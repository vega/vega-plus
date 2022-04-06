import 'regenerator-runtime/runtime'
import * as vega from "vega";
import VegaTransformDB from "vega-transform-db"
import { specRewrite } from "../../vega-plus-core/index"
var htmldiff = require("../dependencies/htmldiff")
import { view2dot } from '../dependencies/view2dot'
var hpccWasm = window["@hpcc-js/wasm"];
import { SqliteDB } from "../src";


var url_loc = window.location.origin.toString();
var csv_url = require("../data/flights-1m.csv");
var SQL_db = sqliteDB()

async function sqliteDB(){
  var data_url = require("../data/flights-1m.db")
  data_url = url_loc + data_url
  const db = new SqliteDB<"Test">(data_url)
  await db.initialize();
  return db
}





SQL_db.then(function(SQL_db){
    async function sql_query(query){
      const results = await SQL_db.queries(query);
      return results;
    }


    VegaTransformDB.type('Serverless');
    VegaTransformDB.QueryFunction(sql_query);
    const oldSpec = "<pre class=\"prettyprint\">" + JSON.stringify(vega_spec['data'], null, 4) + "</pre>"


    const newspec = specRewrite(vega_spec)
    const runtime = vega.parse(newspec);
    console.log("Normal Vega Start");  
    const view = new vega.View(runtime)
      .logLevel(vega.Info)
      .renderer("svg")
      .initialize(document.querySelector("#vega_view"));
    view.runAsync();
    console.log("Normal Vega Done", view);

    const newspec_vp = specRewrite(vegaplus_spec)
    rename(newspec_vp.data, "dbtransform")
    vega.transforms["dbtransform"] = VegaTransformDB;
    console.log("Vega Plus Start");  
    const runtime_vp = vega.parse(newspec_vp);
    const view_vp = new vega.View(runtime_vp)
      .logLevel(vega.Info)
      .renderer("svg")
      .initialize(document.querySelector("#vegap_view"));  
    view_vp.runAsync();
    console.log("Vega Plus Done", view_vp);

    // assign view and vega to window so we can debug them
    window["vega"] = vega;
    window["view"] = view;
    const newSpec = "<pre class=\"prettyprint\">" + JSON.stringify(vegaplus_spec['data'], null, 4) + "</pre>"
    let output = htmldiff(oldSpec, newSpec);

    // Show HTML diff output as HTML (crazy right?)!
    document.getElementById("output").innerHTML = output;

    view.runAfter(view => {
      const dot = `${view2dot(view)}`
      hpccWasm.graphviz.layout(dot, "svg", "dot").then(svg => {
        const placeholder = document.getElementById("graph-placeholder");
        placeholder.innerHTML = svg;
      });
    })

});

function rename(dataSpec, type) {
  for (var i = 0; i < dataSpec.length; i++) {
    var spec = dataSpec[i]
    for (const transform of spec.transform) {
      if (transform.type === "dbtransform") transform.type = type

    }
  }
}

const vegaplus_spec = {
  "$schema": "https://vega.github.io/schema/vega/v5.json",
  "autosize": "pad",
  "padding": 5,
  "width": 600,
  "height": 250,
  "signals": [
    {
      "name": "field",
      "value": "ARR_TIME",
      "bind": {
        "input": "select",
        "options": [
          "FL_DATE","DEP_TIME","DEP_DELAY","ARR_TIME","ARR_DELAY","AIR_TIME","DISTANCE"]
      }
    },
    {
      "name": "maxbins",
      "value": 20,
      "bind": {
        "input": "range",
        "min": 1,
        "max": 300,
        "debounce": 100
      }
    }
  ],
  "data": [
    {
      "name": "flights",
      "transform": [
        {
          "type": "dbtransform",
          "relation": "flights"
        }
      ]
    },
    {
      "name": "table",
      "source": "flights",
      "transform": [
        {
          "type": "extent",
          "field": {
            "signal": "field"
          },
          "signal": "extent"
        },
        {
          "type": "bin",
          "signal": "bins",
          "field": {
            "signal": "field"
          },
          "extent": {
            "signal": "extent"
          },
          "maxbins": {
            "signal": "maxbins"
          }
        },
        {
          "type": "aggregate",
          "key": "bin0",
          "groupby": [
            "bin0",
            "bin1"
          ],
          "fields": [
            "bin0"
          ],
          "ops": [
            "count"
          ],
          "as": [
            "count"
          ]
        }
      ]
    }
  ],
  "marks": [
    {
      "name": "marks",
      "type": "rect",
      "from": {
        "data": "table"
      },
      "encode": {
        "update": {
          "fill": {
            "value": "steelblue"
          },
          "x2": {
            "scale": "x",
            "field": "bin0",
            "offset": {
              "signal": "(bins.stop - bins.start)/bins.step > 150 ? 0 : 1"
            }
          },
          "x": {
            "scale": "x",
            "field": "bin1"
          },
          "y": {
            "scale": "y",
            "field": "count"
          },
          "y2": {
            "scale": "y",
            "value": 0
          }
        }
      }
    }
  ],
  "scales": [
    {
      "name": "x",
      "type": "linear",
      "domain": {
        "signal": "[bins.start, bins.stop]"
      },
      "range": [
        0,
        {
          "signal": "width"
        }
      ],
      "zero": false,
      "bins": {
        "signal": "bins"
      }
    },
    {
      "name": "y",
      "type": "linear",
      "domain": {
        "data": "table",
        "field": "count"
      },
      "range": [
        {
          "signal": "height"
        },
        0
      ],
      "nice": true,
      "zero": true
    }
  ],
  "axes": [
    {
      "scale": "x",
      "orient": "bottom",
      "grid": false,
      "title": {
        "signal": "field"
      },
      "labelFlush": true,
      "labelOverlap": true
    },
    {
      "scale": "y",
      "orient": "left",
      "grid": true,
      "title": "Count of Records",
      "labelOverlap": true,
      "gridOpacity": 0.7
    }
  ],
  "config": {
    "axisY": {
      "minExtent": 30
    }
  }
};


const vega_spec = {
  "$schema": "https://vega.github.io/schema/vega/v5.json",
  "autosize": "pad",
  "padding": 5,
  "width": 600,
  "height": 250,
  "signals": [
    {
      "name": "field",
      "value": "ARR_TIME",
      "bind": {
        "input": "select",
        "options": [
          "FL_DATE","DEP_TIME","DEP_DELAY","ARR_TIME","ARR_DELAY","AIR_TIME","DISTANCE"]
      }
    },
    {
      "name": "maxbins",
      "value": 20,
      "bind": {
        "input": "range",
        "min": 1,
        "max": 300,
        "debounce": 100
      }
    }
  ],
  "data": [
    {
      "name": "flights",
      "format": {"type":"csv"},
      "url": url_loc + csv_url
    },
    {
      "name": "table",
      "source": "flights",
      "transform": [
        {
          "type": "extent",
          "field": {
            "signal": "field"
          },
          "signal": "extent"
        },
        {
          "type": "bin",
          "signal": "bins",
          "field": {
            "signal": "field"
          },
          "extent": {
            "signal": "extent"
          },
          "maxbins": {
            "signal": "maxbins"
          }
        },
        {
          "type": "aggregate",
          "key": "bin0",
          "groupby": [
            "bin0",
            "bin1"
          ],
          "fields": [
            "bin0"
          ],
          "ops": [
            "count"
          ],
          "as": [
            "count"
          ]
        }
      ]
    }
  ],
  "marks": [
    {
      "name": "marks",
      "type": "rect",
      "from": {
        "data": "table"
      },
      "encode": {
        "update": {
          "fill": {
            "value": "steelblue"
          },
          "x2": {
            "scale": "x",
            "field": "bin0",
            "offset": {
              "signal": "(bins.stop - bins.start)/bins.step > 150 ? 0 : 1"
            }
          },
          "x": {
            "scale": "x",
            "field": "bin1"
          },
          "y": {
            "scale": "y",
            "field": "count"
          },
          "y2": {
            "scale": "y",
            "value": 0
          }
        }
      }
    }
  ],
  "scales": [
    {
      "name": "x",
      "type": "linear",
      "domain": {
        "signal": "[bins.start, bins.stop]"
      },
      "range": [
        0,
        {
          "signal": "width"
        }
      ],
      "zero": false,
      "bins": {
        "signal": "bins"
      }
    },
    {
      "name": "y",
      "type": "linear",
      "domain": {
        "data": "table",
        "field": "count"
      },
      "range": [
        {
          "signal": "height"
        },
        0
      ],
      "nice": true,
      "zero": true
    }
  ],
  "axes": [
    {
      "scale": "x",
      "orient": "bottom",
      "grid": false,
      "title": {
        "signal": "field"
      },
      "labelFlush": true,
      "labelOverlap": true
    },
    {
      "scale": "y",
      "orient": "left",
      "grid": true,
      "title": "Count of Records",
      "labelOverlap": true,
      "gridOpacity": 0.7
    }
  ],
  "config": {
    "axisY": {
      "minExtent": 30
    }
  }
}
