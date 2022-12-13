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

import { trellis_parameter_types, trellis_stacked_bar } from "./trellis_stacked_bar"
import { datasets_stat } from "./datasets_stat"

export function combinationsAV2(n:number, k:number) {
    const result= [];
    const combos = [];
    const recurse = start => {
      if (combos.length + (n - start + 1) < k) { return }
      recurse(start + 1);
      combos.push(start);
      if(combos.length === k) {     
         result.push(combos.slice());
      }else if(combos.length + (n - start + 2) >= k){
         recurse(start + 1);
      }
      combos.pop();     
    }
    recurse(1, );
    return result;
}

export function parameterize_templates() {
    const result_list = []

    for (const stat of datasets_stat) {
        const result =[]

        const quant_el: number[][] = combinationsAV2(stat.quantitative.length, trellis_parameter_types.quantitative.length)
        const cat_el: number[][] = combinationsAV2(stat.categorical.length, trellis_parameter_types.categorical.length)
        const parameter = {table: stat.name}

        for (const q_idx of quant_el) {
            for (const fq_idx in trellis_parameter_types) {
                parameter[trellis_parameter_types.quantitative[fq_idx]] = stat.quantitative[q_idx[fq_idx] - 1]
            }

            for (const c_idx of cat_el) {
                for (const fc_idx in trellis_parameter_types) {
                    parameter[trellis_parameter_types.quantitative[fc_idx]] = stat.quantitative[c_idx[fc_idx] - 1]
                }

                // parameterize the template

                result.push(templateMaker(trellis_stacked_bar)(parameter))
            }
        }
        result_list.push(result)
        console.log(result.length)

    }

    return result_list
}

