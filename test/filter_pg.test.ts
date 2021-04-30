import { specRewrite } from "../lib/spec_rewrite"
import VegaTransformPostgres from "vega-transform-db"
import * as vega from "vega"
global.fetch = require("node-fetch");

function sortObj(list, key) {
  function compare(a, b) {
    a = a[key];
    b = b[key];

    var type = (typeof (a) === 'string' ||
      typeof (b) === 'string') ? 'string' : 'number';
    var result;
    if (type === 'string') result = parseFloat(a) - parseFloat(b);
    else result = a - b;
    return result;
  }
  return list.sort(compare);
}


function sort_compare(act, mod, a_key, m_key) {
  var tolerance = 0.0;
  var i;
  act = sortObj(act, a_key);
  mod = sortObj(mod, m_key);
  for (i = 0; i < act.length; i++) {

    if (mod[i][m_key] != act[i][a_key]) {
      expect(Math.abs(parseFloat(act[i][a_key]) - parseFloat(mod[i][m_key]))).toBeCloseTo(0, 3);
    }
  }
}

function compare_tolerance(actual, modified) {
  var a_k = Object.keys(actual[0]);
  var m_k = Object.keys(modified[0]);
  var i, j;

  for (i = 0; i < a_k.length; i++) {
    for (j = 0; j < m_k.length; j++) {
      if (a_k[i].toUpperCase() == m_k[j].toUpperCase()) {
        sort_compare(actual, modified, a_k[i], m_k[j])
      }
    }
  }


}
beforeAll(() => {
  const httpOptions = {
    "url": 'http://localhost:3000/query',
    "mode": "cors",
    "method": "POST",
    "headers": {
      "Content-Type": "application/x-www-form-urlencoded"
    }
  };

  (vega as any).transforms["dbtransform"] = VegaTransformPostgres;
  VegaTransformPostgres.setHttpOptions(httpOptions);
});


const str_filter = {
  "type": "filter",
  "expr": " datum.Origin != 'Europe'"
}
const num_filter1 = {
  "type": "filter",
  "expr": " datum.Cylinders >= 4"
}
const num_filter2 = {
  "type": "filter",
  "expr": " datum.Cylinders < 8"
}
const null_filter = {
  "type": "filter",
  "expr": "datum.Miles_per_Gallon == null"
}
const aggregate = {
  "type": "aggregate",
  "fields": [
    "Miles_per_Gallon"
  ],
  "ops": [
    "average"
  ],
  "as": [
    "Miles_per_Gallon"
  ],
  "groupby": [
    "Cylinders"
  ]
}

var test_cases = [
  ['single string filter', [str_filter]],
  ['single num filter1', [num_filter1]],
  ['single null filter', [null_filter]],
  ['string filter->aggregate', [str_filter, aggregate]],
  ['num filter1->aggregate', [num_filter1, aggregate]],
  ['null filter->aggregate', [null_filter, aggregate]],
  ['null filter->num filter1->aggregate', [null_filter, num_filter1, aggregate]],
]

describe.each(test_cases)('successor %s', (name, transform) => {
  test(transform[0]['expr'], async () => {
    var spec_vg = require('./specs/vega_specs/cars_average_transform_filter.json');
    spec_vg.data[0].transform = transform
    var loader = vega.loader();

    var view = new vega.View(vega.parse(spec_vg), {
      loader: loader,
      renderer: 'none'
    });
    await view.runAsync();

    var result_vg = view.data('cars');

    var spec = require('./specs/specs/cars_average_transform_successor_filter.json');
    const dbtransform = {
      "type": "dbtransform",
      "relation": "cars"
    }
    spec.data[0].transform = transform
    spec.data[0].transform.unshift(dbtransform)
    const newspec = specRewrite(spec)

    const runtime = vega.parse(newspec);

    var view_s = new vega.View(runtime, {
      renderer: 'none'
    })
      .logLevel(vega.Info)

    await view_s.runAsync();

    var result_s = view_s.data('cars');

    compare_tolerance(result_vg, result_s);
  })
});

