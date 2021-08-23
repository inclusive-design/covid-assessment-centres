"use strict";

var fluid = require("infusion");

require("./index.js");

var pipeline = fluid.data.loadPipeline("fluid.pipelines.WeCount-ODC");

pipeline.completionPromise.then(function () {
    console.log("Pipeline executed successfully");
}, function (err) {
    console.log("Pipeline execution error", err);
});
