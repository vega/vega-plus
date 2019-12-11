# 12/011/2019 - 12/17/2019
* [ ] Hook things up to Voyager.
* [ ] Maybe try to user Saul's expression parsing stuff, or use Vega parser/meet with Junran.

# 12/04/2019 - 12/10/2019
* [X] Finish technical report. Submit as scholarly paper on the 9th.
* [ ] Hook things up to Voyager.
* [ ] Maybe try to user Saul's expression parsing stuff, or use Vega parser/meet with Junran.

# 11/27/2019 - 12/03/2019
* [X] Initial draft of technical report

# 11/21 - 11/27
Break

# 11/14/2019 - 11/20/2019
* [X] Handle case where marks source the pg transform. This involved identifying downstream Extent and Encode nodes that have no intervening aggregate node, collecting all the fields, and then configuring the pg node with a simple select query of all those field. 
* [X] Disucssed expression evaluation with Saul. His team has an Vega expression parser written in Python that generates ibis expressions. The ibis expressions are sent to a server and evaluated as SQL statements. On avenue is to rewrite their Vega parser in JavaScript and then have it generate SQL from the AST directly, rather than output ibis.


# 11/07/2019 - 11/13/2019
## Primary goals for this week
* [X] Add support + tests for remaining aggregate queries (sum, variance, variancep, stdev, stdevp, stderr, median, q1, q3, min, max) EXCEPT confidence interval and argmin/argmax -- see Challenges section for more info.
* [X] Write initial draft of abstract.
* [X] Meet with Junran to explain the project.
* [X] Investigate how Omnisci handles Vega expression translation to SQL, if they do at all. See jupyterlab-omnisci github. Looks like they do handle it partially. See the following:
* https://github.com/Quansight/ibis-vega-transform/blob/master/ibis_vega_transform/transforms/filter.py
* https://github.com/Quansight/ibis-vega-transform/blob/7fba12a11f8e539165a19bd432799cd364c3cd80/ibis_vega_transform/vegaexpr.py#L70.
* https://github.com/altair-viz/altair-transform/blob/master/altair_transform/utils/_evaljs.py

## Long-term goals
* [ ] First draft of technical report.
* [ ] Add simple test fwk.
* [ ] Handle case where marks source the pg transform.
* [ ] Add placeholder in server.ts for sampling. Start with a naive algorithm that does random sampling when the number of datapoints exceeds some threshold (e.g. 5000). The plan would be to eventually plug in something more sophisticated. 

## Challenges

* I struggled writing an argmin/argmax aggregate transform in vega. I understand the concept, but when I write a spec that does argmin on in-line values, I keep getting -Inf/+Inf for the data range. 
* I also struggled coming up with a query to do a bootstrap confidence interval. I have a query that does a single sample mean, but I can't figure out how to iterate 1000 times and collate the results in a single SQL query.

# 10/31/2019 - 11/06/2019
## Goals for this week
* [X] Add support for data entries that source a pg transform. Algorithm to handle this case plus the downstream transform is to recursively check the targets of the pg node for top-level aggregation nodes, i.e. the first aggregate nodes on each path out from the pg node.
* [X] Add support for more aggregation operations (count, valid, missing).
* [X] Add code to remove pg nodes from the data flow. 
* [X] Start text matrix, see here: https://docs.google.com/spreadsheets/d/13WNrjA9Vnv8mlIhPJJeumJzR0H25oSJ0JyBMF8a958E/edit#gid=0

## Additional notes
Still need to support the following: 
1. Case where downstream nodes are marks.
2. Filters (WHERE clause). But this involves supporting expressions.
3. More aggregations.
4. Add a test fwk.

# 10/17/2019 - 10/30/2019
## Goals for these weeks
* [X] Implement first pass of algorithm to rewrite aggregation nodes downstream of postgres operators in the dataflow graph.
 - Average aggregation with aliases is supported.
 - Case where the downstream node is a transform in the same data transform array is supported.
 - Implementation involves composing an aggregate query from the aggregate node in question and then overwriting that node's transform function after the View (dataflow graph) is initialized.
 - The original pg node's transform function is overwritten with a no-op for now.

## Additional notes
Still need to support the following: 
1. Case where downstream nodes are other data sources or marks.
2. Filters (WHERE clause).
3. More aggregations (COUNT, and so on).
4. Safely remove the original pg node.

# 09/18/2019 - 10/10/2019 - 10/16/2019
## Goals for this week
* [X] Figure out how to collect field names from the dataflow graph (look at node._argval.encoders.enter.fields)
* [X] Figure out how to identify specific operator nodes in the dataflow graph
* [X] Implement first pass of altered postgres transform:
  1. Recursively traverse postgres transform targets until a node N with fields F is hit.
  2. For each such node N, backtrack up the graph until N's upstream collector node C is hit.
  3. Emit (C, F) for query generation, execution, and rewriting of C.

## Additional notes
* Right now, I only generate simple `select f1, ..., f2 from table` queries.
* I also pulse the changes through at the postgres transform node, rather than collector nodes.

## Challenges
* Need to figure out how to pulse changes through at the collector node level, rather than the postgres transform node.
* Need to start handling all the operators (and therefore more query generation) here: https://github.com/vega/vega/tree/a27ffe09de611c99e338e2ca77c1d1bdfc662381/packages/vega-transforms.

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
* [X] Read/take notes on at “how vega works” for docs on dataflow. See: https://observablehq.com/@vega/how-vega-works.
* [X] console.log() some dataflows. See scalable-vega/node_modules/vega-dataflow/src/dataflow/run.js:123 in evaluate().
* [X] Reason about how hard it is to make some nodes executable by sql.
* [ ] Handle a simple projection by manipulating the dataflow graph
* [X] Resolved windowed-join issue with Leilani/Arvind
* [ ] (Original approach) Add support for SQL generation for some aggregations
* [ ] (Original approach) Add support for SQL generation for encodings beyond x, y

## Additional Notes
* Here's a diff to log the dataflow graph nodes:
122a123,126
>   console.log("Data");
>   console.log(df._runtime.data.table.input.value);
>   console.log("Graph");
>   console.log(df._runtime.nodes);
* Transform operators get run at scalable-vega/node_modules/vega-dataflow/src/dataflow/run.js:74

## Challenges
* I was been able to collect the nodes that reference my postgres transform node, but those nodes contain no info about field names.
* I dumped the dataflow, and there is only one reference to one of the fields, cylinders (x):
"_inputs": [
   "cylinders"
],
I'm not clear yet on the function of that node in particular. But there is no reference at all to the other mark field, miles_per_gallon (y).
* I looked through all the operators of type "mark", but I could not find any information in them about field names.

