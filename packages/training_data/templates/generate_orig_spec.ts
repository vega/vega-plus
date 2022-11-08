import { flight_spec } from "./flights"

const select_fields = ["FL_DATE","DEP_TIME","DEP_DELAY","ARR_TIME","ARR_DELAY","AIR_TIME","DISTANCE"]

var templateMaker = function (object) {
    return function (context) {
        var replacer = function (key, val) {
            if (typeof val === 'function') {
                return context[val()]
            }
            return val;
        }
        return JSON.parse(JSON.stringify(object, replacer))
    }
}

export var template = templateMaker(flight_spec);

var parameters = {
    field_1: "DISTANCE"
}

export var rendered = template(parameters);

console.log(rendered)

/* 
required data for each template might be different, but should contains the following:
  for each dataset:
  - table columns and their data types, 
    ex: https://github.com/leibatt/crossfilter-benchmark-public/blob/master/data/flights/sample.json
    we need to be able to pick `field` parameter from it based on the type
  - all possible parameters we can permute for each operator. 
  - parameter types for each hole: "categorical", "quantitative", "aggregate_op", etc
  we need to use the combination of above info to generate a series of data that we use as 
  the argument(parameters in the example above) to `tamplate` function.
*/