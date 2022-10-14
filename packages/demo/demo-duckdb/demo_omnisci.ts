import 'regenerator-runtime/runtime'
import * as vega from "vega";
import VegaTransformDB from "vega-transform-db"
import { specRewrite } from "../../vega-plus-core/index"
var htmldiff = require("../dependencies/htmldiff.js")
import { view2dot } from '../dependencies/view2dot'
var hpccWasm = window["@hpcc-js/wasm"];
import { DuckDB } from "../src"


var url_loc = window.location.origin.toString();
var db = DuckDBs()
var csv_url = require("../data/flights-3m.csv");

async function DuckDBs(){
  var url = require("../data/flights-3m.parquet");
  console.log(url, url_loc, window, window.location)
  url = url_loc + url
  const db = new DuckDB<"Test">(url, "flights");
  await db.initialize();
  return db
}

async function time_view(runtime, querySelector) {
  let start = Date.now()
  console.log(start, "Start");  
  const view = await new vega.View(runtime)
    .logLevel(vega.Info)
    .renderer("svg")
    .initialize(document.querySelector(querySelector)).runAsync();
  let end = Date.now()
  console.log(end, "Done");
  return {view: view, time: end - start}
}
db.then(function(db){
    async function duck_db_query(query){
      const results = await db.queries(query);
      return results;
    }

    (async function() {
      (VegaTransformDB as any).type('Serverless');
      (VegaTransformDB as any).QueryFunction(duck_db_query);
      const oldSpec = "<pre class=\"prettyprint\">" + JSON.stringify(vega_spec['data'], null, 4) + "</pre>"


      const newspec = specRewrite(vega_spec)
      const runtime = vega.parse(newspec);
      console.log(Date.now(), "Normal Vega Start");  
      console.log(runtime)

      const normal_vg = await time_view(runtime, "#vega_view")
      console.log(normal_vg.time, "Normal Vega");
      const view = normal_vg.view

      const newspec_vp = specRewrite(vegaplus_spec)
      rename(newspec_vp.data, "dbtransform");
      (vega as any).transforms["dbtransform"] = VegaTransformDB;
      const runtime_vp = vega.parse(newspec_vp);

      let vg_p = await time_view(runtime_vp, "#vegap_view")
      console.log(vg_p.time, "Vega Plus");
      console.log(vg_p.view)
      let view_vp = vg_p.view

      vg_p.view.addSignalListener('field', function(name, value) {
        console.log(`${name}_${value}: ${Date.now()}`);
      });
      


      // assign view and vega to window so we can debug them
      window["vega"] = vega;
      window["view"] = view;
      const newSpec = "<pre class=\"prettyprint\">" + JSON.stringify(vegaplus_spec['data'], null, 4) + "</pre>"
      let output = htmldiff(oldSpec, newSpec);

      // Show HTML diff output as HTML (crazy right?)!
      document.getElementById("output").innerHTML = output;

      view_vp.runAfter(view => {
        console.log("runafter")
        const dot = `${view2dot(view)}`
        hpccWasm.graphviz.layout(dot, "svg", "dot").then(svg => {
          const placeholder = document.getElementById("graph-placeholder");
          placeholder.innerHTML = svg;
        });
      })

      function specLoad(format, url) {
        return {
          data: [
            {name: 'table', format: format, "url": url}
          ]
        };
      }

      async function testReadCSV(csv) {
        const  spec = specLoad({type: 'csv'}, csv);
      
        let t = Date.now();
        await new vega.View(vega.parse(spec)).runAsync();
        return Date.now() - t;
      }

      let load =  await testReadCSV(url_loc + csv_url)
      console.log(load, "load time")
      
    })();


    // (VegaTransformDB as any).type('Serverless');
    // (VegaTransformDB as any).QueryFunction(duck_db_query);
    // const oldSpec = "<pre class=\"prettyprint\">" + JSON.stringify(vega_spec['data'], null, 4) + "</pre>"


    // const newspec = specRewrite(vega_spec)
    // const runtime = vega.parse(newspec);
    // console.log(Date.now(), "Normal Vega Start");  
    // // const view = new vega.View(runtime)
    // //   .logLevel(vega.Info)
    // //   .renderer("svg")
    // //   .initialize(document.querySelector("#vega_view"));
    // // view.runAsync();
    // // console.log(Date.now(), "Normal Vega Done");
    
    
    


    // const newspec_vp = specRewrite(vegaplus_spec)
    // rename(newspec_vp.data, "dbtransform");
    // (vega as any).transforms["dbtransform"] = VegaTransformDB;
    // const runtime_vp = vega.parse(newspec_vp);

    // // console.log(Date.now(), "Vega Plus Start");  
    // // const view_vp = new vega.View(runtime_vp)
    // //   .logLevel(vega.Info)
    // //   .renderer("svg")
    // //   .initialize(document.querySelector("#vegap_view"));  
    // // // console.log(view_vp) 
    // // view_vp.runAsync();
    // // console.log(Date.now(), "Vega Plus Done");
    // let vg_p = time_view(runtime_vp, "#vegap_view")
    // console.log(vg_p[1], "Normal Vega");
    // let view_vp = vg_p[0]


    // // assign view and vega to window so we can debug them
    // window["vega"] = vega;
    // window["view"] = view;
    // const newSpec = "<pre class=\"prettyprint\">" + JSON.stringify(vegaplus_spec['data'], null, 4) + "</pre>"
    // let output = htmldiff(oldSpec, newSpec);

    // // Show HTML diff output as HTML (crazy right?)!
    // document.getElementById("output").innerHTML = output;

    // view_vp.runAfter(view => {
    //   const dot = `${view2dot(view)}`
    //   hpccWasm.graphviz.layout(dot, "svg", "dot").then(svg => {
    //     const placeholder = document.getElementById("graph-placeholder");
    //     placeholder.innerHTML = svg;
    //   });
    // })
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
      "value": "DISTANCE",
      "bind": {
        "input": "select",
        "options": [
          "FL_DATE","DEP_TIME","DEP_DELAY","ARR_TIME","ARR_DELAY","AIR_TIME","DISTANCE"]
      }
    },
    {
      "name": "maxbins",
      "value": 50,
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
          },
          "nice": false
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
      "value": "DISTANCE",
      "bind": {
        "input": "select",
        "options": [
          "FL_DATE","DEP_TIME","DEP_DELAY","ARR_TIME","ARR_DELAY","AIR_TIME","DISTANCE"]
      }
    },
    {
      "name": "maxbins",
      "value": 50,
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
          },
          "nice": false
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
