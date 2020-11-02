# Data of COVID-19 assessment Centres

This repository contains CSV files of Ontario COVID-19 assessment centre locations.

## Repository Structure

Datasets are organized in directory by ownership and provenance. All datasets have their publication dates attached in filenames.

* `/ODC` directory: contains all versions of COVID-19 assessment centre locations fetched from [Ontario Data Catalogue](https://data.ontario.ca/dataset/covid-19-assessment-centre-locations).

* `/WeCount` directory: contains all datasets used by [the WeCount project](https://wecount.inclusivedesign.ca/).

* `/scripts` directory: contains scripts that merges both kinds of datasets into one.

* `latest.json` in each directory: a JSON schema that indicates the latest dataset used by that ownership.

## License

This data is distributed under the Creative Commons Attribution 4.0 International license. Portions of the data set were provided by the [Ontario Digital Service](https://www.ontario.ca/page/ontario-digital-service), and contains information licensed under the [Open Government Licence - Ontario](https://www.ontario.ca/page/open-government-licence-ontario).
