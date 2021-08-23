"use strict";

var fluid = require("infusion");

fluid.module.register("covid-assessment-centres", __dirname, require);

require("forgiving-data");

require("./pipes/WeCount-ODC.js");

fluid.registerNamespace("fluid.data");

fluid.data.loadAllPipelines("%covid-assessment-centres/pipelines");
