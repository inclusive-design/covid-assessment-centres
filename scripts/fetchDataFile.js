// This script checks if a new data file is published on the data source URL. If there is,
// it downloads the file, writes into a local file and updates the corresponding latest.json.
//
// A sample command that runs this script in the universal root directory:
// node scripts/fetchDataFile.js https://data.ontario.ca/dataset/covid-19-assessment-centre-locations ../ODC/

"use strict";

const path = require("path");
const fs = require("fs");
const axios = require("axios");
const JSDOM = require("jsdom").JSDOM;

const dataSourceURL = process.argv[2];
const localDataFileFolder = process.argv[3];

const dataFileFolder = path.join(__dirname, localDataFileFolder);
const latestFileTemplate = "{\n\t\"fileName\": \"$filename\"\n}\n";

/**
 * Scrape the download link and date of last update from the ODS repository page
 * @param {String} dataSourceURL The URL to the webpage where the information of the data file is published
 * @return {Object} An object keyed by "downloadURL" (the url to download the new data file) and
 * "date" (the last updated date of the data file).
 */
async function getDataSource(dataSourceURL) {

	let res = await axios.get(dataSourceURL);
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
			lastUpdate = header.parentElement.querySelector("td.dataset-details").innerHTML.trim();
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
 * @param {String} date The date the file was uploaded, in ISO 8601 format (YYYY-MM-DD)
 * @return {String} The filename in format assessment_centre_locations_YYYY_MM_DD.csv
 */
function generateDataFileName(date) {
	return "assessment_centre_locations_" + date.replace(/-/g, "_") + ".csv";
};

/**
 * Check whether a given version of the data is in the repository
 * @param {String} dataFileName The name of the file to look for
 * @param {String} dataFileFolder The folder where all data files are located
 * @return {Boolean} true if the file name is already present in the data folder, false if not
 */
function hasNewDataFile(dataFileName, dataFileFolder) {
	let allFiles = fs.readdirSync(dataFileFolder);
	return !allFiles.includes(dataFileName);
};

/**
 * Download a file from the given download URL and write into a target local file.
 * @param {String} downloadURL The download URL
 * @param {String} targetFileLocation The target file location including the path and file name
 */
async function downloadDataFile(downloadURL, targetFileLocation) {
	let res = await axios.get(downloadURL);
	fs.writeFileSync(targetFileLocation, res.data, "utf8");
};

// The main function
async function main() {
	let { downloadURL, date } = await getDataSource(dataSourceURL);
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
