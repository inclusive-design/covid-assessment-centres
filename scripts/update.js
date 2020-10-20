const path = require("path");
const fs = require("fs");
const axios = require("axios");
const JSDOM = require("jsdom").JSDOM;

// grab constants from the configuration file
const config = require("./config.json");
const dataFileFolder = path.join(__dirname, config.localDataFileFolder);
const latestFileTemplate = "{\n  \"fileName\": \"$filename\"\n}\n";

/*
 * Scrape the download link and date of last update from the ODS repository page
 */
async function getDataSource(config) {

	let res = await axios.get(config.dataSourceURL);
	let data = res.data;
	let dom = new JSDOM(data);

	const findElements = function (selector) {
		return dom.window.document.querySelectorAll(selector);
	};

	// find the CSV download link
	let downloadLink;
	let as = findElements("a.dataset-download-link");
	for (let a of as) {
		let link = a.getAttribute("href");
		if (link.slice(-4) === ".csv") {
			downloadLink = link;
			break;
		}
	}

	// find the last date the dataset was updated
	let lastUpdate;
	let tableHeaders = findElements("th.dataset-label");
	for (let header of tableHeaders) {
		if (header.innerHTML === "Last Validated Date") {
			lastUpdate = header.parentElement.querySelector('td.dataset-details').innerHTML.trim();
			break;
		}
	}

	return {
		downloadURL: downloadLink,
		date: lastUpdate
	};
};

/**
 * Generate the name for a data file based on the date it was uploaded
 * @param {string} date the date the file was uploaded, in ISO 8601 format (YYYY-MM-DD)
 * @returns filename in format assessment_centre_locations_YYYY_MM_DD.csv
 */
function generateDataFileName(date) {
	return "assessment_centre_locations_" + date.replace(/-/g, "_") + ".csv";
};

/**
 * Check whether a given version of the data is in the repository
 * @param {string} dataFileName the name of the file to look for
 * @param {string} dataFileFolder the folder where data files are located
 * @returns true if the file name is already present in the versions folder, false if not
 */
function hasNewDataFile(dataFileName, dataFileFolder) {
	let allFiles = fs.readdirSync(dataFileFolder);
	return !allFiles.includes(dataFileName);
};

async function downloadDataFile(downloadURL, targetFileName) {
	let res = await axios.get(downloadURL);
	fs.writeFileSync(targetFileName, res.data, "utf8");
};

async function main() {
	let { downloadURL, date } = await getDataSource(config);
	let dataFileName = generateDataFileName(date);
	if (hasNewDataFile(dataFileName, dataFileFolder)) {
		await downloadDataFile(downloadURL, path.join(dataFileFolder, dataFileName));
		fs.writeFileSync(path.join(dataFileFolder, "latest.json"), latestFileTemplate.replace("$filename", dataFileName), "utf8");
		console.log("Done: The new data file: ", dataFileName);
	} else {
		console.log("Done: No new data file");
	}
};

main();
