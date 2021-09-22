# Data of COVID-19 assessment Centres

This repository contains CSV files of Ontario COVID-19 assessment centre locations.

## Repository Structure

Datasets are organized in directory by ownership and provenance. All datasets have their publication dates attached in
filenames.

* [/ODC](/ODC) directory: contains all versions of COVID-19 assessment centre locations fetched from [Ontario Data Catalogue](https://data.ontario.ca/dataset/covid-19-assessment-centre-locations).
This collection is updated whenever fresh data is detected by scraping the ODC published page.

* [/WeCount](/WeCount) directory: contains all datasets compiled through the [the WeCount project](https://wecount.inclusivedesign.ca/)
data collection process. This was only resourced for a short time and consists of a single compilation of 44 centres
surveyed through September 2020.

* [/merged](/merged) directory: contains fused versions of the latest ODC, WeCount and synthetic interpolation of
accessibility data suitable for use in the data visualisation at [Covid Data Monitor](https://github.com/inclusive-design/covid-data-monitor).

* `latest.json` in each directory: a JSON file holding the name of the most recently written dataset in that
directory - helpful for web clients

## Running a test pipeline on behalf of a local user

The pipeline in [WeCount-ODC-userConfig.json5](pipelines/WeCount-ODC-userConfig.json5) contains trial overrides of the
GitHub coordinates used to write the updated data that can be edited in order to test the pipeline on behalf of a local
user. Follow the following steps:

* Clone this repository [covid-assessment-centres](https://github.com/inclusive-design/covid-assessment-centres) on GitHub,
and, optionally create a branch that will be written to by the pipeline test.
* Edit the contents of [WeCount-ODC-userConfig.json5](pipelines/WeCount-ODC-userConfig.json5) to refer to your own
username and branch name.
* Generate a suitable GitHub access token via the instructions at [the Github documentation](https://docs.github.com/en/github/authenticating-to-github/creating-a-personal-access-token).
You need only tick the `public_repo` permission when generating this.
* Set an environment variable GITHUB_TOKEN to the value of your access token - e.g.

```text
export GITHUB_TOKEN=YOUR-GITHUB-TOKEN
```

on Unix or Mac systems, or

```text
set GITHUB_TOKEN=YOUR-GITHUB-TOKEN
```

on Windows

* Run the pipeline by `npm run runUserPipeline`. You should see output ending with `Pipeline executed successfully` and
your branch will be updated with committed data files. If you get a failure, it may be that your branch is already
completely up to date with the latest ODC data file - try deleting the latest existing file and rerunning.

## Linting

Run `npm run lint` to lint.

## Pluralistic data infrastructure

The automatic update of the ODC data and derived merged data is operated by WeCount's Pluralistic Data Infrastructure
as defined in repository [forgiving-data](https://github.com/inclusive-design/forgiving-data). This allows open pipelines
to be defined in JSON5 formatted files such as the one in [WeCount-ODC-userConfig.json5]. They are open in the sense
that the deep structure of the pipeline may be overlaid by further such files forming a mixin structure. In addition,
this infrastructure tracks the _provenance_ of the data in the pipeline on a cell-by-cell basis, by recording the
lineage of each value in a _provenance file_ isomorphic to the original data (e.g. in CSV) stored next to it. These
may be seen in the [/merged](/merged) directory, together with a companion JSON file providing more detail about the
provenance strings in the provenance file.

## Auto-commit New Data Files Published by Ontario Digital Service

A cron job is set up to run every day at 11PM UTC to run the pipeline via a GitHub Action script located at
[`.github/workflows/commitNewDataFile.yml`](.github/workflows/commitNewDataFile.yml).

A shortcoming of this solution is, by Github's policy, if a repository stays idle for 14 days, cron jobs
will be stopped. This may be remedied by scheduling the pipeline job via some other means, e.g. an Amazon Lambda
or Azure Function. This is now feasible since the modernised definition of the pipeline makes no use of local storage
and instead addresses GitHub via its HTTP API.

## License

This data is distributed under the Creative Commons Attribution 4.0 International license. Portions of the data set
were provided by the [Ontario Digital Service](https://www.ontario.ca/page/ontario-digital-service), and contains
information licensed under the [Open Government Licence - Ontario](https://www.ontario.ca/page/open-government-licence-ontario).
