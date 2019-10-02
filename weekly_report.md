# 08/22/2019 - 08/28/2019
## Goals for this week
* [X] Compile Vega lite gallery specs to Vega to see how much more complex the Vega specs are.
* [X] Run scalable vega demo + postgres transform on another dataset, with another encoding besides barchart.

## Accomplishments
* Compiled 9 Vega lite gallery specs to Vega. It seems the Vega specs are substantially more complex, being roughly 
  8x longer (in terms of line count).
* Extended scalable vega demo with a file selector to choose the vega spec to run. Tested with cars.json (barchart)
  and flights.json (scatterplot). Everything works.

## Challenges (problems/issues/questions that need to be addressed)
* No blockers this week.

## Additional Notes
* Working (manually) with the Vega specs is a bit difficult and error prone. For example, field identifiers need to be
  duplicated in many properties/sub-properties of the JSON. Generating JSON specs with code that uses variables per field can
  mitigate this.

# 08/29/2019 - 09/04/2019
## Goals for this week
* [ ] Look at how the bin operator is implemented in vega.
* [X] Do additional manual translations (as different from current ones as possible).
* [ ] Start with translating some transform operators (e.g. bin).

## Accomplishments
* Added ability to upload JSON data through the web interface so that it is stored in Postgres. 
  This involved updating server.js to build a schema, create a table, and insert values based on JSON data and a table name.
* Used the above to import data from 2 additional Vega examples (pie chart and horizon chart).

## Challenges
* Wasn't able to finish translating more complicated examples, still basically just doing select statements.
  But now that the data upload portion is in place, this should be easier.

## Additional Notes
* Does Leilani know how to access the vega data? E.g. for "data/us-10m.json"?
See here: https://github.com/vega/vega-datasets/tree/master/data
Or see here: https://github.com/vega/vega-datasets/blob/master/src/data.ts

# 09/04/2019 - 09/10/2019
## Goals for this week
* [X] Finish first-pass implementation of binned query on server, along with an example vega spec.
* [ ] Look at how the bin operator is implemented in vega. See: https://github.com/vega/vega/blob/master/packages/vega-transforms/src/Bin.js and https://github.com/vega/vega/blob/master/packages/vega-statistics/src/bin.js
* [ ] Do additional manual translations (as different from current ones as possible).
* [ ] Start with translating some transform operators (e.g. bin).

## Challenges
* No blockers this week.

## Additional Notes
* Spent some time looking up how to do Postgres binned queries with ranges
* For the binned query, the data transform for vega looks like this:
{
  "type": "postgres",
  "query": {
    "signal": "'bin'"
  },
  "field": "miles_per_gallon",
  "table": "cars",
  "max_bins": 10
}

* The server composes a corresponding sql query to send off to Postgres:

with
  miles_per_gallon_stats as (
    select min(miles_per_gallon) as min, max(miles_per_gallon) as max
    from cars
  ),
  histogram as (
    select width_bucket(miles_per_gallon, min, max, 10) as bucket,
      int4range(
        cast (min(miles_per_gallon) as integer),
        cast (max(miles_per_gallon) as integer),
        '[]') as range,
      count(*) as freq
    from cars, miles_per_gallon_stats
    where miles_per_gallon is not null
    group by bucket
    order by bucket)
  select * from histogram;

* The server finally returns the binned data.

# 09/11/2019 - 09/18/2019
## Goals for this week
* [X] Added client-side chunking for JSON data file upload
* [X] Looked at OmiSci’s Vega examples — it’s hardcoded sql, just like Dom’s transform for OmniSci and mine for Postgres.
* [X] Looked at Ibis and Altair, again I can’t find any Vega -> sql compilation, just wrappers around Vega. Data is still specified via url, file path, or inline, not by query
* [X] Updated README with steps to install and run demo
* [X] Got Vega's example histogram/binning spec normal-2d.json working statically (i.e. without the step and anchor signals); began work on making the signals work (i.e. re-issue the query with new step and anchor)
* [ ] Look at how the bin operator is implemented in vega. See: https://github.com/vega/vega/blob/master/packages/vega-transforms/src/Bin.js and https://github.com/vega/vega/blob/master/packages/vega-statistics/src/bin.js
* [ ] Start with translating some transform operators (e.g. bin).

# 09/18/2019 - 09/25/2019 - 10/02/2019
## Goals for this week
* [X] First pass implementation of SQL generation from vega. Does not support the following: (1) aggregation (2) encodings beyond x, y.
* [X] Sent query to OmiSci RE if they generate SQL, or if it is all handwritten. No response yet. 
* [X] Met with Hannah and described project to her.
* [ ] Finish implementing histogram signal support (still need to figure out how to re-trigger pg signal when step-size/anchor change).
* [ ] Look at how the bin operator is implemented in vega. See: https://github.com/vega/vega/blob/master/packages/vega-transforms/src/Bin.js and https://github.com/vega/vega/blob/master/packages/vega-statistics/src/bin.js
* [ ] Start with translating some transform operators (e.g. bin).


# 09/18/2019 - 10/03/2019 - 10/09/2019
## Goals for this week
* [ ] Add support for SQL generation for some aggregations
* [ ] Add support for SQL generation for encodings beyond x, y
* [ ] Finish implementing histogram signal support (still need to figure out how to re-trigger pg signal when step-size/anchor change).
* [ ] Look at how the bin operator is implemented in vega. See: https://github.com/vega/vega/blob/master/packages/vega-transforms/src/Bin.js and https://github.com/vega/vega/blob/master/packages/vega-statistics/src/bin.js
* [ ] Start with translating some transform operators (e.g. bin).
