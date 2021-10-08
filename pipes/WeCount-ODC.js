"use strict";

const path = require("path");

const axios = require("axios");
const JSDOM = require("jsdom").JSDOM;

const fluid = require("infusion");

const latestFileTemplate = "{\n\t\"fileName\": \"$filename\"\n}\n";

fluid.registerNamespace("fluid.dataMonitor");

/**
 * Scrape the download link and date of last update from the ODS repository page
 * https://data.ontario.ca/dataset/covid-19-assessment-centre-locations
 * @param {String} dataSourceURL - The URL to the webpage where the information of the data file is published
 * @return {Object} An object with members
 *     {String} downloadURL - The url to download the new data file
 *     {String} date - The last updated date of the data file as rendered in the manifest page which is in ISO 8601 date format
 */
fluid.dataMonitor.scrapeRepositoryPage = async function (dataSourceURL) {

    let res = await axios.get(dataSourceURL);
    let data = res.data;
    let dom = new JSDOM(data);

    const findElements = function (selector) {
        return dom.window.document.querySelectorAll(selector);
    };

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

// Returns the bare filename without extension
fluid.dataMonitor.trunkName = function (path) {
    var dotpos = path.lastIndexOf(".");
    var slashpos = path.lastIndexOf("/");
    return path.substring(slashpos + 1, dotpos);
};


function generateMergedFileName(ODCDate, assessmentFile) {
    var trunkName = fluid.dataMonitor.trunkName(assessmentFile);
    var assessDate = trunkName.slice(-10);
    return "merged_ODC_" + ODCDate.replace(/-/g, "_") + "_WeCount_" + assessDate + ".csv";
};

fluid.defaults("fluid.dataMonitor.getMergedFilename", {
    gradeNames: "fluid.dataPipe"
});

/** Compute the filename to be used to represent a merged result of the WeCount and ODC datasets.
 * @param {Object} options - Accepts a structure
 *     ODCCoordinates: "{ODCCoordinates}.data"
 *     WeCountFilePath: "{WeCount}.options.filePath"
       folder: "{gitConfig}.mergedFolder
 * @return {Object} A structure holding the required path in member `filePath`.
 */
fluid.dataMonitor.getMergedFilename = function (options) {
    return {
        filePath: options.folder + generateMergedFileName(options.ODCCoordinates.date, options.WeCountFilePath)
    };
};

/**
 * Representation of a pathed file and its contents (generally on its way to be written, e.g. by gitOpsApi's commitMultipleFiles
 * @typedef {Object} FileEntry
 * @param {String} path - The path of the data to be written
 * @param {String} content - The content of the data to be written
 */

/** Given a pending set of file writes, append a small index file named `latest.json` determining which is the
 * latest dated file just written.
 * @param {FileEntry} fileOptions - Overall file options for the file being written
 * @return {FileEntry} An additional `FileEntry` element recording the additional index file to be written
 */
fluid.dataMonitor.writeLatest = function (fileOptions) {
    var parsed = path.posix.parse(fileOptions.filePath);
    return {
        path: parsed.dir + "/latest.json",
        content: latestFileTemplate.replace("$filename", parsed.base)
    };
};

/**
 * Generate the name for an ODC data file based on the date it was uploaded
 * @param {String} date - The date the file was uploaded, in ISO 8601 format (YYYY-MM-DD)
 * @return {String} The filename in format assessment_centre_locations_YYYY_MM_DD.csv
 */
fluid.dataMonitor.generateODCFileName = function (date) {
    return "assessment_centre_locations_" + date.replace(/-/g, "_") + ".csv";
};

fluid.defaults("fluid.dataMonitor.getODCFileCoordinates", {
    gradeNames: "fluid.dataPipe"
});

fluid.dataMonitor.getODCFileCoordinates = async function (options) {
    let scrapeResults = await fluid.dataMonitor.scrapeRepositoryPage(options.scrapeURL);
    return {
        ...scrapeResults,
        dataFileName: options.folder + fluid.dataMonitor.generateODCFileName(scrapeResults.date)
    };
};

// As of 2021/10/06 the ODC dataset has started to contain corrupt rows with blanks for "city"
// We also take this opportunity to filter out centres which are not active
fluid.dataMonitor.filterBadCentres = function (row) {
    return row.city && row.active !== "No";
};
