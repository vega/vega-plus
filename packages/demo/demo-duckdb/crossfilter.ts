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

      const normal_vg = await time_view(runtime, "#vega_view")
      console.log(normal_vg.time, "Normal Vega");
      const view = normal_vg.view

      const newspec_vp = specRewrite(vegaplus_spec)
      rename(newspec_vp.data, "dbtransform");
      (vega as any).transforms["dbtransform"] = VegaTransformDB;
      const runtime_vp = vega.parse(newspec_vp);

      let vg_p = await time_view(runtime_vp, "#vegap_view")
      console.log(vg_p.time, "Vega Plus");
      let view_vp = vg_p.view


      // assign view and vega to window so we can debug them
      window["vega"] = vega;
      window["view"] = view;
      const newSpec = "<pre class=\"prettyprint\">" + JSON.stringify(vegaplus_spec['data'], null, 4) + "</pre>"
      let output = htmldiff(oldSpec, newSpec);

      // Show HTML diff output as HTML (crazy right?)!
      document.getElementById("output").innerHTML = output;

      view_vp.runAfter(view => {
        const dot = `${view2dot(view)}`
        hpccWasm.graphviz.layout(dot, "svg", "dot").then(svg => {
          const placeholder = document.getElementById("graph-placeholder");
          placeholder.innerHTML = svg;
        });
      })

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


// db.then(function(db){
//     async function duck_db_query(query){
//       const results = await db.queries(query);
//       return results;
//     }

//     (VegaTransformDB as any).type('Serverless');
//     (VegaTransformDB as any).QueryFunction(duck_db_query);
//     const oldSpec = "<pre class=\"prettyprint\">" + JSON.stringify(vega_spec['data'], null, 4) + "</pre>"


//     const newspec = specRewrite(vega_spec)
//     const runtime = vega.parse(newspec);
//     console.log("Normal Vega Start");  
//     const view = new vega.View(runtime)
//       .logLevel(vega.Info)
//       .renderer("svg")
//       .initialize(document.querySelector("#vega_view"));
//     view.runAsync();
//     console.log("Normal Vega Done");

//     const newspec_vp = specRewrite(vegaplus_spec)
//     console.log(newspec_vp) 
//     rename(newspec_vp.data, "dbtransform");
//     (vega as any).transforms["dbtransform"] = VegaTransformDB;
//     console.log("Vega Plus Start");  
//     const runtime_vp = vega.parse(newspec_vp);
//     console.log(runtime_vp) 

//     const view_vp = new vega.View(runtime_vp)
//       .logLevel(vega.Info)
//       .renderer("svg")
//       .initialize(document.querySelector("#vegap_view")); 
//     console.log(view_vp) 
//     view_vp.runAsync();
//     console.log("Vega Plus Done");

//     // assign view and vega to window so we can debug them
//     window["vega"] = vega;
//     // window["view"] = view;
//     const newSpec = "<pre class=\"prettyprint\">" + JSON.stringify(vegaplus_spec['data'], null, 4) + "</pre>"
//     let output = htmldiff(oldSpec, newSpec);

//     // Show HTML diff output as HTML (crazy right?)!
//     document.getElementById("output").innerHTML = output;

//     view_vp.runAfter(view => {
//       const dot = `${view2dot(view)}`
//       hpccWasm.graphviz.layout(dot, "svg", "dot").then(svg => {
//         const placeholder = document.getElementById("graph-placeholder");
//         placeholder.innerHTML = svg;
//       });
//     })
// });

function rename(dataSpec, type) {
  for (var i = 0; i < dataSpec.length; i++) {
    if (!dataSpec[i].hasOwnProperty("transform")) continue
    var spec = dataSpec[i]
    for (const transform of spec.transform) {
      if (transform.type === "dbtransform") transform.type = type

    }
  }
}

const vegaplus_spec = {
    "$schema": "https://vega.github.io/schema/vega/v5.json",
    "background": "white",
    "padding": 5,
    "data": [
      {"name": "brush_store"},
      {
        "name": "source_0",
        "transform": [
          {       
            "type": "dbtransform",
            "relation": "flights"
          },
          {
            "type": "extent",
            "field": "ARR_DELAY",
            "signal": "child__column_delay_layer_1_bin_maxbins_20_delay_extent"
          },
          {
            "type": "bin",
            "field": "ARR_DELAY",
            "as": ["bin_maxbins_20_delay", "bin_maxbins_20_delay_end"],
            "signal": "child__column_delay_layer_1_bin_maxbins_20_delay_bins",
            "extent": {
              "signal": "child__column_delay_layer_1_bin_maxbins_20_delay_extent"
            },
            "maxbins": 20
          },
          {
            "type": "extent",
            "field": "DISTANCE",
            "signal": "child__column_distance_layer_0_bin_maxbins_20_distance_extent"
          },
          {
            "type": "bin",
            "field": "DISTANCE",
            "as": ["bin_maxbins_20_distance", "bin_maxbins_20_distance_end"],
            "signal": "child__column_distance_layer_0_bin_maxbins_20_distance_bins",
            "extent": {
              "signal": "child__column_distance_layer_0_bin_maxbins_20_distance_extent"
            },
            "maxbins": 20
          },
          {"type": "formula", "expr": "hours(datum.ARR_TIME)", "as": "time"}
        ]
      },
      {
        "name": "data_0",
        "source": "source_0",
        "transform": [
          {
            "type": "extent",
            "field": "ARR_TIME",
            "signal": "child__column_time_layer_1_bin_maxbins_20_time_extent"
          },
          {
            "type": "bin",
            "field": "ARR_TIME",
            "as": ["bin_maxbins_20_time", "bin_maxbins_20_time_end"],
            "signal": "child__column_time_layer_1_bin_maxbins_20_time_bins",
            "extent": {
              "signal": "child__column_time_layer_1_bin_maxbins_20_time_extent"
            },
            "maxbins": 20
          }
        ]
      },
      {
        "name": "data_1",
        "source": "data_0",
        "transform": [
          {
            "type": "filter",
            "expr": "!length(data(\"brush_store\")) || vlSelectionTest(\"brush_store\", datum)"
          },
          {
            "type": "aggregate",
            "groupby": ["bin_maxbins_20_time", "bin_maxbins_20_time_end"],
            "ops": ["count"],
            "fields": [null],
            "as": ["__count"]
          },
          {
            "type": "filter",
            "expr": "isValid(datum[\"bin_maxbins_20_time\"]) && isFinite(+datum[\"bin_maxbins_20_time\"])"
          }
        ]
      },
      {
        "name": "data_2",
        "source": "data_0",
        "transform": [
          {
            "type": "aggregate",
            "groupby": ["bin_maxbins_20_time", "bin_maxbins_20_time_end"],
            "ops": ["count"],
            "fields": [null],
            "as": ["__count"]
          },
          {
            "type": "filter",
            "expr": "isValid(datum[\"bin_maxbins_20_time\"]) && isFinite(+datum[\"bin_maxbins_20_time\"])"
          }
        ]
      },
      {
        "name": "data_3",
        "source": "source_0",
        "transform": [
          {
            "type": "filter",
            "expr": "!length(data(\"brush_store\")) || vlSelectionTest(\"brush_store\", datum)"
          }
        ]
      },
      {
        "name": "data_4",
        "source": "data_3",
        "transform": [
          {
            "type": "aggregate",
            "groupby": ["bin_maxbins_20_delay", "bin_maxbins_20_delay_end"],
            "ops": ["count"],
            "fields": [null],
            "as": ["__count"]
          },
          {
            "type": "filter",
            "expr": "isValid(datum[\"bin_maxbins_20_delay\"]) && isFinite(+datum[\"bin_maxbins_20_delay\"])"
          }
        ]
      },
      {
        "name": "data_5",
        "source": "data_3",
        "transform": [
          {
            "type": "aggregate",
            "groupby": ["bin_maxbins_20_distance", "bin_maxbins_20_distance_end"],
            "ops": ["count"],
            "fields": [null],
            "as": ["__count"]
          },
          {
            "type": "filter",
            "expr": "isValid(datum[\"bin_maxbins_20_distance\"]) && isFinite(+datum[\"bin_maxbins_20_distance\"])"
          }
        ]
      },
      {
        "name": "data_6",
        "source": "source_0",
        "transform": [
          {
            "type": "aggregate",
            "groupby": ["bin_maxbins_20_distance", "bin_maxbins_20_distance_end"],
            "ops": ["count"],
            "fields": [null],
            "as": ["__count"]
          },
          {
            "type": "filter",
            "expr": "isValid(datum[\"bin_maxbins_20_distance\"]) && isFinite(+datum[\"bin_maxbins_20_distance\"])"
          }
        ]
      },
      {
        "name": "data_7",
        "source": "source_0",
        "transform": [
          {
            "type": "aggregate",
            "groupby": ["bin_maxbins_20_delay", "bin_maxbins_20_delay_end"],
            "ops": ["count"],
            "fields": [null],
            "as": ["__count"]
          },
          {
            "type": "filter",
            "expr": "isValid(datum[\"bin_maxbins_20_delay\"]) && isFinite(+datum[\"bin_maxbins_20_delay\"])"
          }
        ]
      }
    ],
    "signals": [
      {"name": "childWidth", "value": 200},
      {"name": "childHeight", "value": 200},
      {
        "name": "unit",
        "value": {},
        "on": [
          {"events": "mousemove", "update": "isTuple(group()) ? group() : unit"}
        ]
      },
      {
        "name": "brush",
        "update": "vlSelectionResolve(\"brush_store\", \"union\")"
      }
    ],
    "layout": {"padding": 20, "columns": 3, "bounds": "full", "align": "all"},
    "marks": [
      {
        "type": "group",
        "name": "child__column_distance_group",
        "style": "cell",
        "encode": {
          "update": {
            "width": {"signal": "childWidth"},
            "height": {"signal": "childHeight"}
          }
        },
        "signals": [
          {
            "name": "brush_x",
            "value": [],
            "on": [
              {
                "events": {
                  "source": "scope",
                  "type": "mousedown",
                  "filter": [
                    "!event.item || event.item.mark.name !== \"brush_brush\""
                  ]
                },
                "update": "[x(unit), x(unit)]"
              },
              {
                "events": {
                  "source": "window",
                  "type": "mousemove",
                  "consume": true,
                  "between": [
                    {
                      "source": "scope",
                      "type": "mousedown",
                      "filter": [
                        "!event.item || event.item.mark.name !== \"brush_brush\""
                      ]
                    },
                    {"source": "window", "type": "mouseup"}
                  ]
                },
                "update": "[brush_x[0], clamp(x(unit), 0, childWidth)]"
              },
              {
                "events": {"signal": "brush_scale_trigger"},
                "update": "[scale(\"child__column_distance_x\", brush_distance[0]), scale(\"child__column_distance_x\", brush_distance[1])]"
              },
              {
                "events": [{"source": "view", "type": "dblclick"}],
                "update": "[0, 0]"
              },
              {
                "events": {"signal": "brush_translate_delta"},
                "update": "clampRange(panLinear(brush_translate_anchor.extent_x, brush_translate_delta.x / span(brush_translate_anchor.extent_x)), 0, childWidth)"
              },
              {
                "events": {"signal": "brush_zoom_delta"},
                "update": "clampRange(zoomLinear(brush_x, brush_zoom_anchor.x, brush_zoom_delta), 0, childWidth)"
              }
            ]
          },
          {
            "name": "brush_distance",
            "on": [
              {
                "events": {"signal": "brush_x"},
                "update": "brush_x[0] === brush_x[1] ? null : invert(\"child__column_distance_x\", brush_x)"
              }
            ]
          },
          {
            "name": "brush_scale_trigger",
            "value": {},
            "on": [
              {
                "events": [{"scale": "child__column_distance_x"}],
                "update": "(!isArray(brush_distance) || (+invert(\"child__column_distance_x\", brush_x)[0] === +brush_distance[0] && +invert(\"child__column_distance_x\", brush_x)[1] === +brush_distance[1])) ? brush_scale_trigger : {}"
              }
            ]
          },
          {
            "name": "brush_tuple",
            "on": [
              {
                "events": [{"signal": "brush_distance"}],
                "update": "brush_distance ? {unit: \"child__column_distance_layer_0\", fields: brush_tuple_fields, values: [brush_distance]} : null"
              }
            ]
          },
          {
            "name": "brush_tuple_fields",
            "value": [{"field": "DISTANCE", "channel": "x", "type": "R"}]
          },
          {
            "name": "brush_translate_anchor",
            "value": {},
            "on": [
              {
                "events": [
                  {
                    "source": "scope",
                    "type": "mousedown",
                    "markname": "brush_brush"
                  }
                ],
                "update": "{x: x(unit), y: y(unit), extent_x: slice(brush_x)}"
              }
            ]
          },
          {
            "name": "brush_translate_delta",
            "value": {},
            "on": [
              {
                "events": [
                  {
                    "source": "window",
                    "type": "mousemove",
                    "consume": true,
                    "between": [
                      {
                        "source": "scope",
                        "type": "mousedown",
                        "markname": "brush_brush"
                      },
                      {"source": "window", "type": "mouseup"}
                    ]
                  }
                ],
                "update": "{x: brush_translate_anchor.x - x(unit), y: brush_translate_anchor.y - y(unit)}"
              }
            ]
          },
          {
            "name": "brush_zoom_anchor",
            "on": [
              {
                "events": [
                  {
                    "source": "scope",
                    "type": "wheel",
                    "consume": true,
                    "markname": "brush_brush"
                  }
                ],
                "update": "{x: x(unit), y: y(unit)}"
              }
            ]
          },
          {
            "name": "brush_zoom_delta",
            "on": [
              {
                "events": [
                  {
                    "source": "scope",
                    "type": "wheel",
                    "consume": true,
                    "markname": "brush_brush"
                  }
                ],
                "force": true,
                "update": "pow(1.001, event.deltaY * pow(16, event.deltaMode))"
              }
            ]
          },
          {
            "name": "brush_modify",
            "on": [
              {
                "events": {"signal": "brush_tuple"},
                "update": "modify(\"brush_store\", brush_tuple, true)"
              }
            ]
          }
        ],
        "marks": [
          {
            "name": "brush_brush_bg",
            "type": "rect",
            "clip": true,
            "encode": {
              "enter": {
                "fill": {"value": "#333"},
                "fillOpacity": {"value": 0.125}
              },
              "update": {
                "x": [
                  {
                    "test": "data(\"brush_store\").length && data(\"brush_store\")[0].unit === \"child__column_distance_layer_0\"",
                    "signal": "brush_x[0]"
                  },
                  {"value": 0}
                ],
                "y": [
                  {
                    "test": "data(\"brush_store\").length && data(\"brush_store\")[0].unit === \"child__column_distance_layer_0\"",
                    "value": 0
                  },
                  {"value": 0}
                ],
                "x2": [
                  {
                    "test": "data(\"brush_store\").length && data(\"brush_store\")[0].unit === \"child__column_distance_layer_0\"",
                    "signal": "brush_x[1]"
                  },
                  {"value": 0}
                ],
                "y2": [
                  {
                    "test": "data(\"brush_store\").length && data(\"brush_store\")[0].unit === \"child__column_distance_layer_0\"",
                    "field": {"group": "height"}
                  },
                  {"value": 0}
                ]
              }
            }
          },
          {
            "name": "child__column_distance_layer_0_marks",
            "type": "rect",
            "style": ["bar"],
            "interactive": true,
            "from": {"data": "data_6"},
            "encode": {
              "update": {
                "fill": {"value": "#ddd"},
                "ariaRoleDescription": {"value": "bar"},
                "description": {
                  "signal": "\"distance (binned): \" + (!isValid(datum[\"bin_maxbins_20_distance\"]) || !isFinite(+datum[\"bin_maxbins_20_distance\"]) ? \"null\" : format(datum[\"bin_maxbins_20_distance\"], \"\") + \" – \" + format(datum[\"bin_maxbins_20_distance_end\"], \"\")) + \"; Count of Records: \" + (format(datum[\"__count\"], \"\"))"
                },
                "x2": {
                  "scale": "child__column_distance_x",
                  "field": "bin_maxbins_20_distance",
                  "offset": 1
                },
                "x": {
                  "scale": "child__column_distance_x",
                  "field": "bin_maxbins_20_distance_end"
                },
                "y": {"scale": "child__column_distance_y", "field": "__count"},
                "y2": {"scale": "child__column_distance_y", "value": 0}
              }
            }
          },
          {
            "name": "child__column_distance_layer_1_marks",
            "type": "rect",
            "style": ["bar"],
            "interactive": false,
            "from": {"data": "data_5"},
            "encode": {
              "update": {
                "fill": {"value": "#4c78a8"},
                "ariaRoleDescription": {"value": "bar"},
                "description": {
                  "signal": "\"distance (binned): \" + (!isValid(datum[\"bin_maxbins_20_distance\"]) || !isFinite(+datum[\"bin_maxbins_20_distance\"]) ? \"null\" : format(datum[\"bin_maxbins_20_distance\"], \"\") + \" – \" + format(datum[\"bin_maxbins_20_distance_end\"], \"\")) + \"; Count of Records: \" + (format(datum[\"__count\"], \"\"))"
                },
                "x2": {
                  "scale": "child__column_distance_x",
                  "field": "bin_maxbins_20_distance",
                  "offset": 1
                },
                "x": {
                  "scale": "child__column_distance_x",
                  "field": "bin_maxbins_20_distance_end"
                },
                "y": {"scale": "child__column_distance_y", "field": "__count"},
                "y2": {"scale": "child__column_distance_y", "value": 0}
              }
            }
          },
          {
            "name": "brush_brush",
            "type": "rect",
            "clip": true,
            "encode": {
              "enter": {"fill": {"value": "transparent"}},
              "update": {
                "x": [
                  {
                    "test": "data(\"brush_store\").length && data(\"brush_store\")[0].unit === \"child__column_distance_layer_0\"",
                    "signal": "brush_x[0]"
                  },
                  {"value": 0}
                ],
                "y": [
                  {
                    "test": "data(\"brush_store\").length && data(\"brush_store\")[0].unit === \"child__column_distance_layer_0\"",
                    "value": 0
                  },
                  {"value": 0}
                ],
                "x2": [
                  {
                    "test": "data(\"brush_store\").length && data(\"brush_store\")[0].unit === \"child__column_distance_layer_0\"",
                    "signal": "brush_x[1]"
                  },
                  {"value": 0}
                ],
                "y2": [
                  {
                    "test": "data(\"brush_store\").length && data(\"brush_store\")[0].unit === \"child__column_distance_layer_0\"",
                    "field": {"group": "height"}
                  },
                  {"value": 0}
                ],
                "stroke": [
                  {"test": "brush_x[0] !== brush_x[1]", "value": "white"},
                  {"value": null}
                ]
              }
            }
          }
        ],
        "axes": [
          {
            "scale": "child__column_distance_y",
            "orient": "left",
            "gridScale": "child__column_distance_x",
            "grid": true,
            "tickCount": {"signal": "ceil(childHeight/40)"},
            "domain": false,
            "labels": false,
            "aria": false,
            "maxExtent": 0,
            "minExtent": 0,
            "ticks": false,
            "zindex": 0
          },
          {
            "scale": "child__column_distance_x",
            "orient": "bottom",
            "grid": false,
            "title": "distance (binned)",
            "labelFlush": true,
            "labelOverlap": true,
            "tickCount": {"signal": "ceil(childWidth/10)"},
            "zindex": 0
          },
          {
            "scale": "child__column_distance_y",
            "orient": "left",
            "grid": false,
            "title": "Count of Records",
            "labelOverlap": true,
            "tickCount": {"signal": "ceil(childHeight/40)"},
            "zindex": 0
          }
        ]
      },
      {
        "type": "group",
        "name": "child__column_delay_group",
        "style": "cell",
        "encode": {
          "update": {
            "width": {"signal": "childWidth"},
            "height": {"signal": "childHeight"}
          }
        },
        "signals": [
          {
            "name": "brush_x",
            "value": [],
            "on": [
              {
                "events": {
                  "source": "scope",
                  "type": "mousedown",
                  "filter": [
                    "!event.item || event.item.mark.name !== \"brush_brush\""
                  ]
                },
                "update": "[x(unit), x(unit)]"
              },
              {
                "events": {
                  "source": "window",
                  "type": "mousemove",
                  "consume": true,
                  "between": [
                    {
                      "source": "scope",
                      "type": "mousedown",
                      "filter": [
                        "!event.item || event.item.mark.name !== \"brush_brush\""
                      ]
                    },
                    {"source": "window", "type": "mouseup"}
                  ]
                },
                "update": "[brush_x[0], clamp(x(unit), 0, childWidth)]"
              },
              {
                "events": {"signal": "brush_scale_trigger"},
                "update": "[scale(\"child__column_delay_x\", brush_delay[0]), scale(\"child__column_delay_x\", brush_delay[1])]"
              },
              {
                "events": [{"source": "view", "type": "dblclick"}],
                "update": "[0, 0]"
              },
              {
                "events": {"signal": "brush_translate_delta"},
                "update": "clampRange(panLinear(brush_translate_anchor.extent_x, brush_translate_delta.x / span(brush_translate_anchor.extent_x)), 0, childWidth)"
              },
              {
                "events": {"signal": "brush_zoom_delta"},
                "update": "clampRange(zoomLinear(brush_x, brush_zoom_anchor.x, brush_zoom_delta), 0, childWidth)"
              }
            ]
          },
          {
            "name": "brush_delay",
            "on": [
              {
                "events": {"signal": "brush_x"},
                "update": "brush_x[0] === brush_x[1] ? null : invert(\"child__column_delay_x\", brush_x)"
              }
            ]
          },
          {
            "name": "brush_scale_trigger",
            "value": {},
            "on": [
              {
                "events": [{"scale": "child__column_delay_x"}],
                "update": "(!isArray(brush_delay) || (+invert(\"child__column_delay_x\", brush_x)[0] === +brush_delay[0] && +invert(\"child__column_delay_x\", brush_x)[1] === +brush_delay[1])) ? brush_scale_trigger : {}"
              }
            ]
          },
          {
            "name": "brush_tuple",
            "on": [
              {
                "events": [{"signal": "brush_delay"}],
                "update": "brush_delay ? {unit: \"child__column_delay_layer_0\", fields: brush_tuple_fields, values: [brush_delay]} : null"
              }
            ]
          },
          {
            "name": "brush_tuple_fields",
            "value": [{"field": "ARR_DELAY", "channel": "x", "type": "R"}]
          },
          {
            "name": "brush_translate_anchor",
            "value": {},
            "on": [
              {
                "events": [
                  {
                    "source": "scope",
                    "type": "mousedown",
                    "markname": "brush_brush"
                  }
                ],
                "update": "{x: x(unit), y: y(unit), extent_x: slice(brush_x)}"
              }
            ]
          },
          {
            "name": "brush_translate_delta",
            "value": {},
            "on": [
              {
                "events": [
                  {
                    "source": "window",
                    "type": "mousemove",
                    "consume": true,
                    "between": [
                      {
                        "source": "scope",
                        "type": "mousedown",
                        "markname": "brush_brush"
                      },
                      {"source": "window", "type": "mouseup"}
                    ]
                  }
                ],
                "update": "{x: brush_translate_anchor.x - x(unit), y: brush_translate_anchor.y - y(unit)}"
              }
            ]
          },
          {
            "name": "brush_zoom_anchor",
            "on": [
              {
                "events": [
                  {
                    "source": "scope",
                    "type": "wheel",
                    "consume": true,
                    "markname": "brush_brush"
                  }
                ],
                "update": "{x: x(unit), y: y(unit)}"
              }
            ]
          },
          {
            "name": "brush_zoom_delta",
            "on": [
              {
                "events": [
                  {
                    "source": "scope",
                    "type": "wheel",
                    "consume": true,
                    "markname": "brush_brush"
                  }
                ],
                "force": true,
                "update": "pow(1.001, event.deltaY * pow(16, event.deltaMode))"
              }
            ]
          },
          {
            "name": "brush_modify",
            "on": [
              {
                "events": {"signal": "brush_tuple"},
                "update": "modify(\"brush_store\", brush_tuple, true)"
              }
            ]
          }
        ],
        "marks": [
          {
            "name": "brush_brush_bg",
            "type": "rect",
            "clip": true,
            "encode": {
              "enter": {
                "fill": {"value": "#333"},
                "fillOpacity": {"value": 0.125}
              },
              "update": {
                "x": [
                  {
                    "test": "data(\"brush_store\").length && data(\"brush_store\")[0].unit === \"child__column_delay_layer_0\"",
                    "signal": "brush_x[0]"
                  },
                  {"value": 0}
                ],
                "y": [
                  {
                    "test": "data(\"brush_store\").length && data(\"brush_store\")[0].unit === \"child__column_delay_layer_0\"",
                    "value": 0
                  },
                  {"value": 0}
                ],
                "x2": [
                  {
                    "test": "data(\"brush_store\").length && data(\"brush_store\")[0].unit === \"child__column_delay_layer_0\"",
                    "signal": "brush_x[1]"
                  },
                  {"value": 0}
                ],
                "y2": [
                  {
                    "test": "data(\"brush_store\").length && data(\"brush_store\")[0].unit === \"child__column_delay_layer_0\"",
                    "field": {"group": "height"}
                  },
                  {"value": 0}
                ]
              }
            }
          },
          {
            "name": "child__column_delay_layer_0_marks",
            "type": "rect",
            "style": ["bar"],
            "interactive": true,
            "from": {"data": "data_7"},
            "encode": {
              "update": {
                "fill": {"value": "#ddd"},
                "ariaRoleDescription": {"value": "bar"},
                "description": {
                  "signal": "\"delay (binned): \" + (!isValid(datum[\"bin_maxbins_20_delay\"]) || !isFinite(+datum[\"bin_maxbins_20_delay\"]) ? \"null\" : format(datum[\"bin_maxbins_20_delay\"], \"\") + \" – \" + format(datum[\"bin_maxbins_20_delay_end\"], \"\")) + \"; Count of Records: \" + (format(datum[\"__count\"], \"\"))"
                },
                "x2": {
                  "scale": "child__column_delay_x",
                  "field": "bin_maxbins_20_delay",
                  "offset": 1
                },
                "x": {
                  "scale": "child__column_delay_x",
                  "field": "bin_maxbins_20_delay_end"
                },
                "y": {"scale": "child__column_delay_y", "field": "__count"},
                "y2": {"scale": "child__column_delay_y", "value": 0}
              }
            }
          },
          {
            "name": "child__column_delay_layer_1_marks",
            "type": "rect",
            "style": ["bar"],
            "interactive": false,
            "from": {"data": "data_4"},
            "encode": {
              "update": {
                "fill": {"value": "#4c78a8"},
                "ariaRoleDescription": {"value": "bar"},
                "description": {
                  "signal": "\"delay (binned): \" + (!isValid(datum[\"bin_maxbins_20_delay\"]) || !isFinite(+datum[\"bin_maxbins_20_delay\"]) ? \"null\" : format(datum[\"bin_maxbins_20_delay\"], \"\") + \" – \" + format(datum[\"bin_maxbins_20_delay_end\"], \"\")) + \"; Count of Records: \" + (format(datum[\"__count\"], \"\"))"
                },
                "x2": {
                  "scale": "child__column_delay_x",
                  "field": "bin_maxbins_20_delay",
                  "offset": 1
                },
                "x": {
                  "scale": "child__column_delay_x",
                  "field": "bin_maxbins_20_delay_end"
                },
                "y": {"scale": "child__column_delay_y", "field": "__count"},
                "y2": {"scale": "child__column_delay_y", "value": 0}
              }
            }
          },
          {
            "name": "brush_brush",
            "type": "rect",
            "clip": true,
            "encode": {
              "enter": {"fill": {"value": "transparent"}},
              "update": {
                "x": [
                  {
                    "test": "data(\"brush_store\").length && data(\"brush_store\")[0].unit === \"child__column_delay_layer_0\"",
                    "signal": "brush_x[0]"
                  },
                  {"value": 0}
                ],
                "y": [
                  {
                    "test": "data(\"brush_store\").length && data(\"brush_store\")[0].unit === \"child__column_delay_layer_0\"",
                    "value": 0
                  },
                  {"value": 0}
                ],
                "x2": [
                  {
                    "test": "data(\"brush_store\").length && data(\"brush_store\")[0].unit === \"child__column_delay_layer_0\"",
                    "signal": "brush_x[1]"
                  },
                  {"value": 0}
                ],
                "y2": [
                  {
                    "test": "data(\"brush_store\").length && data(\"brush_store\")[0].unit === \"child__column_delay_layer_0\"",
                    "field": {"group": "height"}
                  },
                  {"value": 0}
                ],
                "stroke": [
                  {"test": "brush_x[0] !== brush_x[1]", "value": "white"},
                  {"value": null}
                ]
              }
            }
          }
        ],
        "axes": [
          {
            "scale": "child__column_delay_y",
            "orient": "left",
            "gridScale": "child__column_delay_x",
            "grid": true,
            "tickCount": {"signal": "ceil(childHeight/40)"},
            "domain": false,
            "labels": false,
            "aria": false,
            "maxExtent": 0,
            "minExtent": 0,
            "ticks": false,
            "zindex": 0
          },
          {
            "scale": "child__column_delay_x",
            "orient": "bottom",
            "grid": false,
            "title": "delay (binned)",
            "labelFlush": true,
            "labelOverlap": true,
            "tickCount": {"signal": "ceil(childWidth/10)"},
            "zindex": 0
          },
          {
            "scale": "child__column_delay_y",
            "orient": "left",
            "grid": false,
            "title": "Count of Records",
            "labelOverlap": true,
            "tickCount": {"signal": "ceil(childHeight/40)"},
            "zindex": 0
          }
        ]
      },
      {
        "type": "group",
        "name": "child__column_time_group",
        "style": "cell",
        "encode": {
          "update": {
            "width": {"signal": "childWidth"},
            "height": {"signal": "childHeight"}
          }
        },
        "signals": [
          {
            "name": "brush_x",
            "value": [],
            "on": [
              {
                "events": {
                  "source": "scope",
                  "type": "mousedown",
                  "filter": [
                    "!event.item || event.item.mark.name !== \"brush_brush\""
                  ]
                },
                "update": "[x(unit), x(unit)]"
              },
              {
                "events": {
                  "source": "window",
                  "type": "mousemove",
                  "consume": true,
                  "between": [
                    {
                      "source": "scope",
                      "type": "mousedown",
                      "filter": [
                        "!event.item || event.item.mark.name !== \"brush_brush\""
                      ]
                    },
                    {"source": "window", "type": "mouseup"}
                  ]
                },
                "update": "[brush_x[0], clamp(x(unit), 0, childWidth)]"
              },
              {
                "events": {"signal": "brush_scale_trigger"},
                "update": "[scale(\"child__column_time_x\", brush_time[0]), scale(\"child__column_time_x\", brush_time[1])]"
              },
              {
                "events": [{"source": "view", "type": "dblclick"}],
                "update": "[0, 0]"
              },
              {
                "events": {"signal": "brush_translate_delta"},
                "update": "clampRange(panLinear(brush_translate_anchor.extent_x, brush_translate_delta.x / span(brush_translate_anchor.extent_x)), 0, childWidth)"
              },
              {
                "events": {"signal": "brush_zoom_delta"},
                "update": "clampRange(zoomLinear(brush_x, brush_zoom_anchor.x, brush_zoom_delta), 0, childWidth)"
              }
            ]
          },
          {
            "name": "brush_time",
            "on": [
              {
                "events": {"signal": "brush_x"},
                "update": "brush_x[0] === brush_x[1] ? null : invert(\"child__column_time_x\", brush_x)"
              }
            ]
          },
          {
            "name": "brush_scale_trigger",
            "value": {},
            "on": [
              {
                "events": [{"scale": "child__column_time_x"}],
                "update": "(!isArray(brush_time) || (+invert(\"child__column_time_x\", brush_x)[0] === +brush_time[0] && +invert(\"child__column_time_x\", brush_x)[1] === +brush_time[1])) ? brush_scale_trigger : {}"
              }
            ]
          },
          {
            "name": "brush_tuple",
            "on": [
              {
                "events": [{"signal": "brush_time"}],
                "update": "brush_time ? {unit: \"child__column_time_layer_0\", fields: brush_tuple_fields, values: [brush_time]} : null"
              }
            ]
          },
          {
            "name": "brush_tuple_fields",
            "value": [{"field": "ARR_TIME", "channel": "x", "type": "R"}]
          },
          {
            "name": "brush_translate_anchor",
            "value": {},
            "on": [
              {
                "events": [
                  {
                    "source": "scope",
                    "type": "mousedown",
                    "markname": "brush_brush"
                  }
                ],
                "update": "{x: x(unit), y: y(unit), extent_x: slice(brush_x)}"
              }
            ]
          },
          {
            "name": "brush_translate_delta",
            "value": {},
            "on": [
              {
                "events": [
                  {
                    "source": "window",
                    "type": "mousemove",
                    "consume": true,
                    "between": [
                      {
                        "source": "scope",
                        "type": "mousedown",
                        "markname": "brush_brush"
                      },
                      {"source": "window", "type": "mouseup"}
                    ]
                  }
                ],
                "update": "{x: brush_translate_anchor.x - x(unit), y: brush_translate_anchor.y - y(unit)}"
              }
            ]
          },
          {
            "name": "brush_zoom_anchor",
            "on": [
              {
                "events": [
                  {
                    "source": "scope",
                    "type": "wheel",
                    "consume": true,
                    "markname": "brush_brush"
                  }
                ],
                "update": "{x: x(unit), y: y(unit)}"
              }
            ]
          },
          {
            "name": "brush_zoom_delta",
            "on": [
              {
                "events": [
                  {
                    "source": "scope",
                    "type": "wheel",
                    "consume": true,
                    "markname": "brush_brush"
                  }
                ],
                "force": true,
                "update": "pow(1.001, event.deltaY * pow(16, event.deltaMode))"
              }
            ]
          },
          {
            "name": "brush_modify",
            "on": [
              {
                "events": {"signal": "brush_tuple"},
                "update": "modify(\"brush_store\", brush_tuple, true)"
              }
            ]
          }
        ],
        "marks": [
          {
            "name": "brush_brush_bg",
            "type": "rect",
            "clip": true,
            "encode": {
              "enter": {
                "fill": {"value": "#333"},
                "fillOpacity": {"value": 0.125}
              },
              "update": {
                "x": [
                  {
                    "test": "data(\"brush_store\").length && data(\"brush_store\")[0].unit === \"child__column_time_layer_0\"",
                    "signal": "brush_x[0]"
                  },
                  {"value": 0}
                ],
                "y": [
                  {
                    "test": "data(\"brush_store\").length && data(\"brush_store\")[0].unit === \"child__column_time_layer_0\"",
                    "value": 0
                  },
                  {"value": 0}
                ],
                "x2": [
                  {
                    "test": "data(\"brush_store\").length && data(\"brush_store\")[0].unit === \"child__column_time_layer_0\"",
                    "signal": "brush_x[1]"
                  },
                  {"value": 0}
                ],
                "y2": [
                  {
                    "test": "data(\"brush_store\").length && data(\"brush_store\")[0].unit === \"child__column_time_layer_0\"",
                    "field": {"group": "height"}
                  },
                  {"value": 0}
                ]
              }
            }
          },
          {
            "name": "child__column_time_layer_0_marks",
            "type": "rect",
            "style": ["bar"],
            "interactive": true,
            "from": {"data": "data_2"},
            "encode": {
              "update": {
                "fill": {"value": "#ddd"},
                "ariaRoleDescription": {"value": "bar"},
                "description": {
                  "signal": "\"time (binned): \" + (!isValid(datum[\"bin_maxbins_20_time\"]) || !isFinite(+datum[\"bin_maxbins_20_time\"]) ? \"null\" : format(datum[\"bin_maxbins_20_time\"], \"\") + \" – \" + format(datum[\"bin_maxbins_20_time_end\"], \"\")) + \"; Count of Records: \" + (format(datum[\"__count\"], \"\"))"
                },
                "x2": {
                  "scale": "child__column_time_x",
                  "field": "bin_maxbins_20_time",
                  "offset": 1
                },
                "x": {
                  "scale": "child__column_time_x",
                  "field": "bin_maxbins_20_time_end"
                },
                "y": {"scale": "child__column_time_y", "field": "__count"},
                "y2": {"scale": "child__column_time_y", "value": 0}
              }
            }
          },
          {
            "name": "child__column_time_layer_1_marks",
            "type": "rect",
            "style": ["bar"],
            "interactive": false,
            "from": {"data": "data_1"},
            "encode": {
              "update": {
                "fill": {"value": "#4c78a8"},
                "ariaRoleDescription": {"value": "bar"},
                "description": {
                  "signal": "\"time (binned): \" + (!isValid(datum[\"bin_maxbins_20_time\"]) || !isFinite(+datum[\"bin_maxbins_20_time\"]) ? \"null\" : format(datum[\"bin_maxbins_20_time\"], \"\") + \" – \" + format(datum[\"bin_maxbins_20_time_end\"], \"\")) + \"; Count of Records: \" + (format(datum[\"__count\"], \"\"))"
                },
                "x2": {
                  "scale": "child__column_time_x",
                  "field": "bin_maxbins_20_time",
                  "offset": 1
                },
                "x": {
                  "scale": "child__column_time_x",
                  "field": "bin_maxbins_20_time_end"
                },
                "y": {"scale": "child__column_time_y", "field": "__count"},
                "y2": {"scale": "child__column_time_y", "value": 0}
              }
            }
          },
          {
            "name": "brush_brush",
            "type": "rect",
            "clip": true,
            "encode": {
              "enter": {"fill": {"value": "transparent"}},
              "update": {
                "x": [
                  {
                    "test": "data(\"brush_store\").length && data(\"brush_store\")[0].unit === \"child__column_time_layer_0\"",
                    "signal": "brush_x[0]"
                  },
                  {"value": 0}
                ],
                "y": [
                  {
                    "test": "data(\"brush_store\").length && data(\"brush_store\")[0].unit === \"child__column_time_layer_0\"",
                    "value": 0
                  },
                  {"value": 0}
                ],
                "x2": [
                  {
                    "test": "data(\"brush_store\").length && data(\"brush_store\")[0].unit === \"child__column_time_layer_0\"",
                    "signal": "brush_x[1]"
                  },
                  {"value": 0}
                ],
                "y2": [
                  {
                    "test": "data(\"brush_store\").length && data(\"brush_store\")[0].unit === \"child__column_time_layer_0\"",
                    "field": {"group": "height"}
                  },
                  {"value": 0}
                ],
                "stroke": [
                  {"test": "brush_x[0] !== brush_x[1]", "value": "white"},
                  {"value": null}
                ]
              }
            }
          }
        ],
        "axes": [
          {
            "scale": "child__column_time_y",
            "orient": "left",
            "gridScale": "child__column_time_x",
            "grid": true,
            "tickCount": {"signal": "ceil(childHeight/40)"},
            "domain": false,
            "labels": false,
            "aria": false,
            "maxExtent": 0,
            "minExtent": 0,
            "ticks": false,
            "zindex": 0
          },
          {
            "scale": "child__column_time_x",
            "orient": "bottom",
            "grid": false,
            "title": "time (binned)",
            "labelFlush": true,
            "labelOverlap": true,
            "tickCount": {"signal": "ceil(childWidth/10)"},
            "zindex": 0
          },
          {
            "scale": "child__column_time_y",
            "orient": "left",
            "grid": false,
            "title": "Count of Records",
            "labelOverlap": true,
            "tickCount": {"signal": "ceil(childHeight/40)"},
            "zindex": 0
          }
        ]
      }
    ],
    "scales": [
      {
        "name": "child__column_distance_x",
        "type": "linear",
        "domain": {
          "signal": "[child__column_distance_layer_0_bin_maxbins_20_distance_bins.start, child__column_distance_layer_0_bin_maxbins_20_distance_bins.stop]"
        },
        "range": [0, {"signal": "childWidth"}],
        "bins": {
          "signal": "child__column_distance_layer_0_bin_maxbins_20_distance_bins"
        },
        "zero": false
      },
      {
        "name": "child__column_distance_y",
        "type": "linear",
        "domain": {
          "fields": [
            {"data": "data_6", "field": "__count"},
            {"data": "data_5", "field": "__count"}
          ]
        },
        "range": [{"signal": "childHeight"}, 0],
        "nice": true,
        "zero": true
      },
      {
        "name": "child__column_delay_x",
        "type": "linear",
        "domain": {
          "signal": "[child__column_delay_layer_1_bin_maxbins_20_delay_bins.start, child__column_delay_layer_1_bin_maxbins_20_delay_bins.stop]"
        },
        "range": [0, {"signal": "childWidth"}],
        "bins": {
          "signal": "child__column_delay_layer_1_bin_maxbins_20_delay_bins"
        },
        "zero": false
      },
      {
        "name": "child__column_delay_y",
        "type": "linear",
        "domain": {
          "fields": [
            {"data": "data_7", "field": "__count"},
            {"data": "data_4", "field": "__count"}
          ]
        },
        "range": [{"signal": "childHeight"}, 0],
        "nice": true,
        "zero": true
      },
      {
        "name": "child__column_time_x",
        "type": "linear",
        "domain": {
          "signal": "[child__column_time_layer_1_bin_maxbins_20_time_bins.start, child__column_time_layer_1_bin_maxbins_20_time_bins.stop]"
        },
        "range": [0, {"signal": "childWidth"}],
        "bins": {"signal": "child__column_time_layer_1_bin_maxbins_20_time_bins"},
        "zero": false
      },
      {
        "name": "child__column_time_y",
        "type": "linear",
        "domain": {
          "fields": [
            {"data": "data_2", "field": "__count"},
            {"data": "data_1", "field": "__count"}
          ]
        },
        "range": [{"signal": "childHeight"}, 0],
        "nice": true,
        "zero": true
      }
    ]
  }

  const vega_spec = {
    "$schema": "https://vega.github.io/schema/vega/v5.json",
    "background": "white",
    "padding": 5,
    "data": [
      {"name": "brush_store"},
      {
        "name": "source_0",
        "format": {"type":"csv"},
        "url": url_loc + csv_url,
        "transform": [
          {
            "type": "extent",
            "field": "ARR_DELAY",
            "signal": "child__column_delay_layer_1_bin_maxbins_20_delay_extent"
          },
          {
            "type": "bin",
            "field": "ARR_DELAY",
            "as": ["bin_maxbins_20_delay", "bin_maxbins_20_delay_end"],
            "signal": "child__column_delay_layer_1_bin_maxbins_20_delay_bins",
            "extent": {
              "signal": "child__column_delay_layer_1_bin_maxbins_20_delay_extent"
            },
            "maxbins": 20
          },
          {
            "type": "extent",
            "field": "DISTANCE",
            "signal": "child__column_distance_layer_0_bin_maxbins_20_distance_extent"
          },
          {
            "type": "bin",
            "field": "DISTANCE",
            "as": ["bin_maxbins_20_distance", "bin_maxbins_20_distance_end"],
            "signal": "child__column_distance_layer_0_bin_maxbins_20_distance_bins",
            "extent": {
              "signal": "child__column_distance_layer_0_bin_maxbins_20_distance_extent"
            },
            "maxbins": 20
          },
          {"type": "formula", "expr": "hours(datum.ARR_TIME)", "as": "time"}
        ]
      },
      {
        "name": "data_0",
        "source": "source_0",
        "transform": [
          {
            "type": "extent",
            "field": "ARR_TIME",
            "signal": "child__column_time_layer_1_bin_maxbins_20_time_extent"
          },
          {
            "type": "bin",
            "field": "ARR_TIME",
            "as": ["bin_maxbins_20_time", "bin_maxbins_20_time_end"],
            "signal": "child__column_time_layer_1_bin_maxbins_20_time_bins",
            "extent": {
              "signal": "child__column_time_layer_1_bin_maxbins_20_time_extent"
            },
            "maxbins": 20
          }
        ]
      },
      {
        "name": "data_1",
        "source": "data_0",
        "transform": [
          {
            "type": "filter",
            "expr": "!length(data(\"brush_store\")) || vlSelectionTest(\"brush_store\", datum)"
          },
          {
            "type": "aggregate",
            "groupby": ["bin_maxbins_20_time", "bin_maxbins_20_time_end"],
            "ops": ["count"],
            "fields": [null],
            "as": ["__count"]
          },
          {
            "type": "filter",
            "expr": "isValid(datum[\"bin_maxbins_20_time\"]) && isFinite(+datum[\"bin_maxbins_20_time\"])"
          }
        ]
      },
      {
        "name": "data_2",
        "source": "data_0",
        "transform": [
          {
            "type": "aggregate",
            "groupby": ["bin_maxbins_20_time", "bin_maxbins_20_time_end"],
            "ops": ["count"],
            "fields": [null],
            "as": ["__count"]
          },
          {
            "type": "filter",
            "expr": "isValid(datum[\"bin_maxbins_20_time\"]) && isFinite(+datum[\"bin_maxbins_20_time\"])"
          }
        ]
      },
      {
        "name": "data_3",
        "source": "source_0",
        "transform": [
          {
            "type": "filter",
            "expr": "!length(data(\"brush_store\")) || vlSelectionTest(\"brush_store\", datum)"
          }
        ]
      },
      {
        "name": "data_4",
        "source": "data_3",
        "transform": [
          {
            "type": "aggregate",
            "groupby": ["bin_maxbins_20_delay", "bin_maxbins_20_delay_end"],
            "ops": ["count"],
            "fields": [null],
            "as": ["__count"]
          },
          {
            "type": "filter",
            "expr": "isValid(datum[\"bin_maxbins_20_delay\"]) && isFinite(+datum[\"bin_maxbins_20_delay\"])"
          }
        ]
      },
      {
        "name": "data_5",
        "source": "data_3",
        "transform": [
          {
            "type": "aggregate",
            "groupby": ["bin_maxbins_20_distance", "bin_maxbins_20_distance_end"],
            "ops": ["count"],
            "fields": [null],
            "as": ["__count"]
          },
          {
            "type": "filter",
            "expr": "isValid(datum[\"bin_maxbins_20_distance\"]) && isFinite(+datum[\"bin_maxbins_20_distance\"])"
          }
        ]
      },
      {
        "name": "data_6",
        "source": "source_0",
        "transform": [
          {
            "type": "aggregate",
            "groupby": ["bin_maxbins_20_distance", "bin_maxbins_20_distance_end"],
            "ops": ["count"],
            "fields": [null],
            "as": ["__count"]
          },
          {
            "type": "filter",
            "expr": "isValid(datum[\"bin_maxbins_20_distance\"]) && isFinite(+datum[\"bin_maxbins_20_distance\"])"
          }
        ]
      },
      {
        "name": "data_7",
        "source": "source_0",
        "transform": [
          {
            "type": "aggregate",
            "groupby": ["bin_maxbins_20_delay", "bin_maxbins_20_delay_end"],
            "ops": ["count"],
            "fields": [null],
            "as": ["__count"]
          },
          {
            "type": "filter",
            "expr": "isValid(datum[\"bin_maxbins_20_delay\"]) && isFinite(+datum[\"bin_maxbins_20_delay\"])"
          }
        ]
      }
    ],
    "signals": [
      {"name": "childWidth", "value": 200},
      {"name": "childHeight", "value": 200},
      {
        "name": "unit",
        "value": {},
        "on": [
          {"events": "mousemove", "update": "isTuple(group()) ? group() : unit"}
        ]
      },
      {
        "name": "brush",
        "update": "vlSelectionResolve(\"brush_store\", \"union\")"
      }
    ],
    "layout": {"padding": 20, "columns": 3, "bounds": "full", "align": "all"},
    "marks": [
      {
        "type": "group",
        "name": "child__column_distance_group",
        "style": "cell",
        "encode": {
          "update": {
            "width": {"signal": "childWidth"},
            "height": {"signal": "childHeight"}
          }
        },
        "signals": [
          {
            "name": "brush_x",
            "value": [],
            "on": [
              {
                "events": {
                  "source": "scope",
                  "type": "mousedown",
                  "filter": [
                    "!event.item || event.item.mark.name !== \"brush_brush\""
                  ]
                },
                "update": "[x(unit), x(unit)]"
              },
              {
                "events": {
                  "source": "window",
                  "type": "mousemove",
                  "consume": true,
                  "between": [
                    {
                      "source": "scope",
                      "type": "mousedown",
                      "filter": [
                        "!event.item || event.item.mark.name !== \"brush_brush\""
                      ]
                    },
                    {"source": "window", "type": "mouseup"}
                  ]
                },
                "update": "[brush_x[0], clamp(x(unit), 0, childWidth)]"
              },
              {
                "events": {"signal": "brush_scale_trigger"},
                "update": "[scale(\"child__column_distance_x\", brush_distance[0]), scale(\"child__column_distance_x\", brush_distance[1])]"
              },
              {
                "events": [{"source": "view", "type": "dblclick"}],
                "update": "[0, 0]"
              },
              {
                "events": {"signal": "brush_translate_delta"},
                "update": "clampRange(panLinear(brush_translate_anchor.extent_x, brush_translate_delta.x / span(brush_translate_anchor.extent_x)), 0, childWidth)"
              },
              {
                "events": {"signal": "brush_zoom_delta"},
                "update": "clampRange(zoomLinear(brush_x, brush_zoom_anchor.x, brush_zoom_delta), 0, childWidth)"
              }
            ]
          },
          {
            "name": "brush_distance",
            "on": [
              {
                "events": {"signal": "brush_x"},
                "update": "brush_x[0] === brush_x[1] ? null : invert(\"child__column_distance_x\", brush_x)"
              }
            ]
          },
          {
            "name": "brush_scale_trigger",
            "value": {},
            "on": [
              {
                "events": [{"scale": "child__column_distance_x"}],
                "update": "(!isArray(brush_distance) || (+invert(\"child__column_distance_x\", brush_x)[0] === +brush_distance[0] && +invert(\"child__column_distance_x\", brush_x)[1] === +brush_distance[1])) ? brush_scale_trigger : {}"
              }
            ]
          },
          {
            "name": "brush_tuple",
            "on": [
              {
                "events": [{"signal": "brush_distance"}],
                "update": "brush_distance ? {unit: \"child__column_distance_layer_0\", fields: brush_tuple_fields, values: [brush_distance]} : null"
              }
            ]
          },
          {
            "name": "brush_tuple_fields",
            "value": [{"field": "DISTANCE", "channel": "x", "type": "R"}]
          },
          {
            "name": "brush_translate_anchor",
            "value": {},
            "on": [
              {
                "events": [
                  {
                    "source": "scope",
                    "type": "mousedown",
                    "markname": "brush_brush"
                  }
                ],
                "update": "{x: x(unit), y: y(unit), extent_x: slice(brush_x)}"
              }
            ]
          },
          {
            "name": "brush_translate_delta",
            "value": {},
            "on": [
              {
                "events": [
                  {
                    "source": "window",
                    "type": "mousemove",
                    "consume": true,
                    "between": [
                      {
                        "source": "scope",
                        "type": "mousedown",
                        "markname": "brush_brush"
                      },
                      {"source": "window", "type": "mouseup"}
                    ]
                  }
                ],
                "update": "{x: brush_translate_anchor.x - x(unit), y: brush_translate_anchor.y - y(unit)}"
              }
            ]
          },
          {
            "name": "brush_zoom_anchor",
            "on": [
              {
                "events": [
                  {
                    "source": "scope",
                    "type": "wheel",
                    "consume": true,
                    "markname": "brush_brush"
                  }
                ],
                "update": "{x: x(unit), y: y(unit)}"
              }
            ]
          },
          {
            "name": "brush_zoom_delta",
            "on": [
              {
                "events": [
                  {
                    "source": "scope",
                    "type": "wheel",
                    "consume": true,
                    "markname": "brush_brush"
                  }
                ],
                "force": true,
                "update": "pow(1.001, event.deltaY * pow(16, event.deltaMode))"
              }
            ]
          },
          {
            "name": "brush_modify",
            "on": [
              {
                "events": {"signal": "brush_tuple"},
                "update": "modify(\"brush_store\", brush_tuple, true)"
              }
            ]
          }
        ],
        "marks": [
          {
            "name": "brush_brush_bg",
            "type": "rect",
            "clip": true,
            "encode": {
              "enter": {
                "fill": {"value": "#333"},
                "fillOpacity": {"value": 0.125}
              },
              "update": {
                "x": [
                  {
                    "test": "data(\"brush_store\").length && data(\"brush_store\")[0].unit === \"child__column_distance_layer_0\"",
                    "signal": "brush_x[0]"
                  },
                  {"value": 0}
                ],
                "y": [
                  {
                    "test": "data(\"brush_store\").length && data(\"brush_store\")[0].unit === \"child__column_distance_layer_0\"",
                    "value": 0
                  },
                  {"value": 0}
                ],
                "x2": [
                  {
                    "test": "data(\"brush_store\").length && data(\"brush_store\")[0].unit === \"child__column_distance_layer_0\"",
                    "signal": "brush_x[1]"
                  },
                  {"value": 0}
                ],
                "y2": [
                  {
                    "test": "data(\"brush_store\").length && data(\"brush_store\")[0].unit === \"child__column_distance_layer_0\"",
                    "field": {"group": "height"}
                  },
                  {"value": 0}
                ]
              }
            }
          },
          {
            "name": "child__column_distance_layer_0_marks",
            "type": "rect",
            "style": ["bar"],
            "interactive": true,
            "from": {"data": "data_6"},
            "encode": {
              "update": {
                "fill": {"value": "#ddd"},
                "ariaRoleDescription": {"value": "bar"},
                "description": {
                  "signal": "\"distance (binned): \" + (!isValid(datum[\"bin_maxbins_20_distance\"]) || !isFinite(+datum[\"bin_maxbins_20_distance\"]) ? \"null\" : format(datum[\"bin_maxbins_20_distance\"], \"\") + \" – \" + format(datum[\"bin_maxbins_20_distance_end\"], \"\")) + \"; Count of Records: \" + (format(datum[\"__count\"], \"\"))"
                },
                "x2": {
                  "scale": "child__column_distance_x",
                  "field": "bin_maxbins_20_distance",
                  "offset": 1
                },
                "x": {
                  "scale": "child__column_distance_x",
                  "field": "bin_maxbins_20_distance_end"
                },
                "y": {"scale": "child__column_distance_y", "field": "__count"},
                "y2": {"scale": "child__column_distance_y", "value": 0}
              }
            }
          },
          {
            "name": "child__column_distance_layer_1_marks",
            "type": "rect",
            "style": ["bar"],
            "interactive": false,
            "from": {"data": "data_5"},
            "encode": {
              "update": {
                "fill": {"value": "#4c78a8"},
                "ariaRoleDescription": {"value": "bar"},
                "description": {
                  "signal": "\"distance (binned): \" + (!isValid(datum[\"bin_maxbins_20_distance\"]) || !isFinite(+datum[\"bin_maxbins_20_distance\"]) ? \"null\" : format(datum[\"bin_maxbins_20_distance\"], \"\") + \" – \" + format(datum[\"bin_maxbins_20_distance_end\"], \"\")) + \"; Count of Records: \" + (format(datum[\"__count\"], \"\"))"
                },
                "x2": {
                  "scale": "child__column_distance_x",
                  "field": "bin_maxbins_20_distance",
                  "offset": 1
                },
                "x": {
                  "scale": "child__column_distance_x",
                  "field": "bin_maxbins_20_distance_end"
                },
                "y": {"scale": "child__column_distance_y", "field": "__count"},
                "y2": {"scale": "child__column_distance_y", "value": 0}
              }
            }
          },
          {
            "name": "brush_brush",
            "type": "rect",
            "clip": true,
            "encode": {
              "enter": {"fill": {"value": "transparent"}},
              "update": {
                "x": [
                  {
                    "test": "data(\"brush_store\").length && data(\"brush_store\")[0].unit === \"child__column_distance_layer_0\"",
                    "signal": "brush_x[0]"
                  },
                  {"value": 0}
                ],
                "y": [
                  {
                    "test": "data(\"brush_store\").length && data(\"brush_store\")[0].unit === \"child__column_distance_layer_0\"",
                    "value": 0
                  },
                  {"value": 0}
                ],
                "x2": [
                  {
                    "test": "data(\"brush_store\").length && data(\"brush_store\")[0].unit === \"child__column_distance_layer_0\"",
                    "signal": "brush_x[1]"
                  },
                  {"value": 0}
                ],
                "y2": [
                  {
                    "test": "data(\"brush_store\").length && data(\"brush_store\")[0].unit === \"child__column_distance_layer_0\"",
                    "field": {"group": "height"}
                  },
                  {"value": 0}
                ],
                "stroke": [
                  {"test": "brush_x[0] !== brush_x[1]", "value": "white"},
                  {"value": null}
                ]
              }
            }
          }
        ],
        "axes": [
          {
            "scale": "child__column_distance_y",
            "orient": "left",
            "gridScale": "child__column_distance_x",
            "grid": true,
            "tickCount": {"signal": "ceil(childHeight/40)"},
            "domain": false,
            "labels": false,
            "aria": false,
            "maxExtent": 0,
            "minExtent": 0,
            "ticks": false,
            "zindex": 0
          },
          {
            "scale": "child__column_distance_x",
            "orient": "bottom",
            "grid": false,
            "title": "distance (binned)",
            "labelFlush": true,
            "labelOverlap": true,
            "tickCount": {"signal": "ceil(childWidth/10)"},
            "zindex": 0
          },
          {
            "scale": "child__column_distance_y",
            "orient": "left",
            "grid": false,
            "title": "Count of Records",
            "labelOverlap": true,
            "tickCount": {"signal": "ceil(childHeight/40)"},
            "zindex": 0
          }
        ]
      },
      {
        "type": "group",
        "name": "child__column_delay_group",
        "style": "cell",
        "encode": {
          "update": {
            "width": {"signal": "childWidth"},
            "height": {"signal": "childHeight"}
          }
        },
        "signals": [
          {
            "name": "brush_x",
            "value": [],
            "on": [
              {
                "events": {
                  "source": "scope",
                  "type": "mousedown",
                  "filter": [
                    "!event.item || event.item.mark.name !== \"brush_brush\""
                  ]
                },
                "update": "[x(unit), x(unit)]"
              },
              {
                "events": {
                  "source": "window",
                  "type": "mousemove",
                  "consume": true,
                  "between": [
                    {
                      "source": "scope",
                      "type": "mousedown",
                      "filter": [
                        "!event.item || event.item.mark.name !== \"brush_brush\""
                      ]
                    },
                    {"source": "window", "type": "mouseup"}
                  ]
                },
                "update": "[brush_x[0], clamp(x(unit), 0, childWidth)]"
              },
              {
                "events": {"signal": "brush_scale_trigger"},
                "update": "[scale(\"child__column_delay_x\", brush_delay[0]), scale(\"child__column_delay_x\", brush_delay[1])]"
              },
              {
                "events": [{"source": "view", "type": "dblclick"}],
                "update": "[0, 0]"
              },
              {
                "events": {"signal": "brush_translate_delta"},
                "update": "clampRange(panLinear(brush_translate_anchor.extent_x, brush_translate_delta.x / span(brush_translate_anchor.extent_x)), 0, childWidth)"
              },
              {
                "events": {"signal": "brush_zoom_delta"},
                "update": "clampRange(zoomLinear(brush_x, brush_zoom_anchor.x, brush_zoom_delta), 0, childWidth)"
              }
            ]
          },
          {
            "name": "brush_delay",
            "on": [
              {
                "events": {"signal": "brush_x"},
                "update": "brush_x[0] === brush_x[1] ? null : invert(\"child__column_delay_x\", brush_x)"
              }
            ]
          },
          {
            "name": "brush_scale_trigger",
            "value": {},
            "on": [
              {
                "events": [{"scale": "child__column_delay_x"}],
                "update": "(!isArray(brush_delay) || (+invert(\"child__column_delay_x\", brush_x)[0] === +brush_delay[0] && +invert(\"child__column_delay_x\", brush_x)[1] === +brush_delay[1])) ? brush_scale_trigger : {}"
              }
            ]
          },
          {
            "name": "brush_tuple",
            "on": [
              {
                "events": [{"signal": "brush_delay"}],
                "update": "brush_delay ? {unit: \"child__column_delay_layer_0\", fields: brush_tuple_fields, values: [brush_delay]} : null"
              }
            ]
          },
          {
            "name": "brush_tuple_fields",
            "value": [{"field": "ARR_DELAY", "channel": "x", "type": "R"}]
          },
          {
            "name": "brush_translate_anchor",
            "value": {},
            "on": [
              {
                "events": [
                  {
                    "source": "scope",
                    "type": "mousedown",
                    "markname": "brush_brush"
                  }
                ],
                "update": "{x: x(unit), y: y(unit), extent_x: slice(brush_x)}"
              }
            ]
          },
          {
            "name": "brush_translate_delta",
            "value": {},
            "on": [
              {
                "events": [
                  {
                    "source": "window",
                    "type": "mousemove",
                    "consume": true,
                    "between": [
                      {
                        "source": "scope",
                        "type": "mousedown",
                        "markname": "brush_brush"
                      },
                      {"source": "window", "type": "mouseup"}
                    ]
                  }
                ],
                "update": "{x: brush_translate_anchor.x - x(unit), y: brush_translate_anchor.y - y(unit)}"
              }
            ]
          },
          {
            "name": "brush_zoom_anchor",
            "on": [
              {
                "events": [
                  {
                    "source": "scope",
                    "type": "wheel",
                    "consume": true,
                    "markname": "brush_brush"
                  }
                ],
                "update": "{x: x(unit), y: y(unit)}"
              }
            ]
          },
          {
            "name": "brush_zoom_delta",
            "on": [
              {
                "events": [
                  {
                    "source": "scope",
                    "type": "wheel",
                    "consume": true,
                    "markname": "brush_brush"
                  }
                ],
                "force": true,
                "update": "pow(1.001, event.deltaY * pow(16, event.deltaMode))"
              }
            ]
          },
          {
            "name": "brush_modify",
            "on": [
              {
                "events": {"signal": "brush_tuple"},
                "update": "modify(\"brush_store\", brush_tuple, true)"
              }
            ]
          }
        ],
        "marks": [
          {
            "name": "brush_brush_bg",
            "type": "rect",
            "clip": true,
            "encode": {
              "enter": {
                "fill": {"value": "#333"},
                "fillOpacity": {"value": 0.125}
              },
              "update": {
                "x": [
                  {
                    "test": "data(\"brush_store\").length && data(\"brush_store\")[0].unit === \"child__column_delay_layer_0\"",
                    "signal": "brush_x[0]"
                  },
                  {"value": 0}
                ],
                "y": [
                  {
                    "test": "data(\"brush_store\").length && data(\"brush_store\")[0].unit === \"child__column_delay_layer_0\"",
                    "value": 0
                  },
                  {"value": 0}
                ],
                "x2": [
                  {
                    "test": "data(\"brush_store\").length && data(\"brush_store\")[0].unit === \"child__column_delay_layer_0\"",
                    "signal": "brush_x[1]"
                  },
                  {"value": 0}
                ],
                "y2": [
                  {
                    "test": "data(\"brush_store\").length && data(\"brush_store\")[0].unit === \"child__column_delay_layer_0\"",
                    "field": {"group": "height"}
                  },
                  {"value": 0}
                ]
              }
            }
          },
          {
            "name": "child__column_delay_layer_0_marks",
            "type": "rect",
            "style": ["bar"],
            "interactive": true,
            "from": {"data": "data_7"},
            "encode": {
              "update": {
                "fill": {"value": "#ddd"},
                "ariaRoleDescription": {"value": "bar"},
                "description": {
                  "signal": "\"delay (binned): \" + (!isValid(datum[\"bin_maxbins_20_delay\"]) || !isFinite(+datum[\"bin_maxbins_20_delay\"]) ? \"null\" : format(datum[\"bin_maxbins_20_delay\"], \"\") + \" – \" + format(datum[\"bin_maxbins_20_delay_end\"], \"\")) + \"; Count of Records: \" + (format(datum[\"__count\"], \"\"))"
                },
                "x2": {
                  "scale": "child__column_delay_x",
                  "field": "bin_maxbins_20_delay",
                  "offset": 1
                },
                "x": {
                  "scale": "child__column_delay_x",
                  "field": "bin_maxbins_20_delay_end"
                },
                "y": {"scale": "child__column_delay_y", "field": "__count"},
                "y2": {"scale": "child__column_delay_y", "value": 0}
              }
            }
          },
          {
            "name": "child__column_delay_layer_1_marks",
            "type": "rect",
            "style": ["bar"],
            "interactive": false,
            "from": {"data": "data_4"},
            "encode": {
              "update": {
                "fill": {"value": "#4c78a8"},
                "ariaRoleDescription": {"value": "bar"},
                "description": {
                  "signal": "\"delay (binned): \" + (!isValid(datum[\"bin_maxbins_20_delay\"]) || !isFinite(+datum[\"bin_maxbins_20_delay\"]) ? \"null\" : format(datum[\"bin_maxbins_20_delay\"], \"\") + \" – \" + format(datum[\"bin_maxbins_20_delay_end\"], \"\")) + \"; Count of Records: \" + (format(datum[\"__count\"], \"\"))"
                },
                "x2": {
                  "scale": "child__column_delay_x",
                  "field": "bin_maxbins_20_delay",
                  "offset": 1
                },
                "x": {
                  "scale": "child__column_delay_x",
                  "field": "bin_maxbins_20_delay_end"
                },
                "y": {"scale": "child__column_delay_y", "field": "__count"},
                "y2": {"scale": "child__column_delay_y", "value": 0}
              }
            }
          },
          {
            "name": "brush_brush",
            "type": "rect",
            "clip": true,
            "encode": {
              "enter": {"fill": {"value": "transparent"}},
              "update": {
                "x": [
                  {
                    "test": "data(\"brush_store\").length && data(\"brush_store\")[0].unit === \"child__column_delay_layer_0\"",
                    "signal": "brush_x[0]"
                  },
                  {"value": 0}
                ],
                "y": [
                  {
                    "test": "data(\"brush_store\").length && data(\"brush_store\")[0].unit === \"child__column_delay_layer_0\"",
                    "value": 0
                  },
                  {"value": 0}
                ],
                "x2": [
                  {
                    "test": "data(\"brush_store\").length && data(\"brush_store\")[0].unit === \"child__column_delay_layer_0\"",
                    "signal": "brush_x[1]"
                  },
                  {"value": 0}
                ],
                "y2": [
                  {
                    "test": "data(\"brush_store\").length && data(\"brush_store\")[0].unit === \"child__column_delay_layer_0\"",
                    "field": {"group": "height"}
                  },
                  {"value": 0}
                ],
                "stroke": [
                  {"test": "brush_x[0] !== brush_x[1]", "value": "white"},
                  {"value": null}
                ]
              }
            }
          }
        ],
        "axes": [
          {
            "scale": "child__column_delay_y",
            "orient": "left",
            "gridScale": "child__column_delay_x",
            "grid": true,
            "tickCount": {"signal": "ceil(childHeight/40)"},
            "domain": false,
            "labels": false,
            "aria": false,
            "maxExtent": 0,
            "minExtent": 0,
            "ticks": false,
            "zindex": 0
          },
          {
            "scale": "child__column_delay_x",
            "orient": "bottom",
            "grid": false,
            "title": "delay (binned)",
            "labelFlush": true,
            "labelOverlap": true,
            "tickCount": {"signal": "ceil(childWidth/10)"},
            "zindex": 0
          },
          {
            "scale": "child__column_delay_y",
            "orient": "left",
            "grid": false,
            "title": "Count of Records",
            "labelOverlap": true,
            "tickCount": {"signal": "ceil(childHeight/40)"},
            "zindex": 0
          }
        ]
      },
      {
        "type": "group",
        "name": "child__column_time_group",
        "style": "cell",
        "encode": {
          "update": {
            "width": {"signal": "childWidth"},
            "height": {"signal": "childHeight"}
          }
        },
        "signals": [
          {
            "name": "brush_x",
            "value": [],
            "on": [
              {
                "events": {
                  "source": "scope",
                  "type": "mousedown",
                  "filter": [
                    "!event.item || event.item.mark.name !== \"brush_brush\""
                  ]
                },
                "update": "[x(unit), x(unit)]"
              },
              {
                "events": {
                  "source": "window",
                  "type": "mousemove",
                  "consume": true,
                  "between": [
                    {
                      "source": "scope",
                      "type": "mousedown",
                      "filter": [
                        "!event.item || event.item.mark.name !== \"brush_brush\""
                      ]
                    },
                    {"source": "window", "type": "mouseup"}
                  ]
                },
                "update": "[brush_x[0], clamp(x(unit), 0, childWidth)]"
              },
              {
                "events": {"signal": "brush_scale_trigger"},
                "update": "[scale(\"child__column_time_x\", brush_time[0]), scale(\"child__column_time_x\", brush_time[1])]"
              },
              {
                "events": [{"source": "view", "type": "dblclick"}],
                "update": "[0, 0]"
              },
              {
                "events": {"signal": "brush_translate_delta"},
                "update": "clampRange(panLinear(brush_translate_anchor.extent_x, brush_translate_delta.x / span(brush_translate_anchor.extent_x)), 0, childWidth)"
              },
              {
                "events": {"signal": "brush_zoom_delta"},
                "update": "clampRange(zoomLinear(brush_x, brush_zoom_anchor.x, brush_zoom_delta), 0, childWidth)"
              }
            ]
          },
          {
            "name": "brush_time",
            "on": [
              {
                "events": {"signal": "brush_x"},
                "update": "brush_x[0] === brush_x[1] ? null : invert(\"child__column_time_x\", brush_x)"
              }
            ]
          },
          {
            "name": "brush_scale_trigger",
            "value": {},
            "on": [
              {
                "events": [{"scale": "child__column_time_x"}],
                "update": "(!isArray(brush_time) || (+invert(\"child__column_time_x\", brush_x)[0] === +brush_time[0] && +invert(\"child__column_time_x\", brush_x)[1] === +brush_time[1])) ? brush_scale_trigger : {}"
              }
            ]
          },
          {
            "name": "brush_tuple",
            "on": [
              {
                "events": [{"signal": "brush_time"}],
                "update": "brush_time ? {unit: \"child__column_time_layer_0\", fields: brush_tuple_fields, values: [brush_time]} : null"
              }
            ]
          },
          {
            "name": "brush_tuple_fields",
            "value": [{"field": "ARR_TIME", "channel": "x", "type": "R"}]
          },
          {
            "name": "brush_translate_anchor",
            "value": {},
            "on": [
              {
                "events": [
                  {
                    "source": "scope",
                    "type": "mousedown",
                    "markname": "brush_brush"
                  }
                ],
                "update": "{x: x(unit), y: y(unit), extent_x: slice(brush_x)}"
              }
            ]
          },
          {
            "name": "brush_translate_delta",
            "value": {},
            "on": [
              {
                "events": [
                  {
                    "source": "window",
                    "type": "mousemove",
                    "consume": true,
                    "between": [
                      {
                        "source": "scope",
                        "type": "mousedown",
                        "markname": "brush_brush"
                      },
                      {"source": "window", "type": "mouseup"}
                    ]
                  }
                ],
                "update": "{x: brush_translate_anchor.x - x(unit), y: brush_translate_anchor.y - y(unit)}"
              }
            ]
          },
          {
            "name": "brush_zoom_anchor",
            "on": [
              {
                "events": [
                  {
                    "source": "scope",
                    "type": "wheel",
                    "consume": true,
                    "markname": "brush_brush"
                  }
                ],
                "update": "{x: x(unit), y: y(unit)}"
              }
            ]
          },
          {
            "name": "brush_zoom_delta",
            "on": [
              {
                "events": [
                  {
                    "source": "scope",
                    "type": "wheel",
                    "consume": true,
                    "markname": "brush_brush"
                  }
                ],
                "force": true,
                "update": "pow(1.001, event.deltaY * pow(16, event.deltaMode))"
              }
            ]
          },
          {
            "name": "brush_modify",
            "on": [
              {
                "events": {"signal": "brush_tuple"},
                "update": "modify(\"brush_store\", brush_tuple, true)"
              }
            ]
          }
        ],
        "marks": [
          {
            "name": "brush_brush_bg",
            "type": "rect",
            "clip": true,
            "encode": {
              "enter": {
                "fill": {"value": "#333"},
                "fillOpacity": {"value": 0.125}
              },
              "update": {
                "x": [
                  {
                    "test": "data(\"brush_store\").length && data(\"brush_store\")[0].unit === \"child__column_time_layer_0\"",
                    "signal": "brush_x[0]"
                  },
                  {"value": 0}
                ],
                "y": [
                  {
                    "test": "data(\"brush_store\").length && data(\"brush_store\")[0].unit === \"child__column_time_layer_0\"",
                    "value": 0
                  },
                  {"value": 0}
                ],
                "x2": [
                  {
                    "test": "data(\"brush_store\").length && data(\"brush_store\")[0].unit === \"child__column_time_layer_0\"",
                    "signal": "brush_x[1]"
                  },
                  {"value": 0}
                ],
                "y2": [
                  {
                    "test": "data(\"brush_store\").length && data(\"brush_store\")[0].unit === \"child__column_time_layer_0\"",
                    "field": {"group": "height"}
                  },
                  {"value": 0}
                ]
              }
            }
          },
          {
            "name": "child__column_time_layer_0_marks",
            "type": "rect",
            "style": ["bar"],
            "interactive": true,
            "from": {"data": "data_2"},
            "encode": {
              "update": {
                "fill": {"value": "#ddd"},
                "ariaRoleDescription": {"value": "bar"},
                "description": {
                  "signal": "\"time (binned): \" + (!isValid(datum[\"bin_maxbins_20_time\"]) || !isFinite(+datum[\"bin_maxbins_20_time\"]) ? \"null\" : format(datum[\"bin_maxbins_20_time\"], \"\") + \" – \" + format(datum[\"bin_maxbins_20_time_end\"], \"\")) + \"; Count of Records: \" + (format(datum[\"__count\"], \"\"))"
                },
                "x2": {
                  "scale": "child__column_time_x",
                  "field": "bin_maxbins_20_time",
                  "offset": 1
                },
                "x": {
                  "scale": "child__column_time_x",
                  "field": "bin_maxbins_20_time_end"
                },
                "y": {"scale": "child__column_time_y", "field": "__count"},
                "y2": {"scale": "child__column_time_y", "value": 0}
              }
            }
          },
          {
            "name": "child__column_time_layer_1_marks",
            "type": "rect",
            "style": ["bar"],
            "interactive": false,
            "from": {"data": "data_1"},
            "encode": {
              "update": {
                "fill": {"value": "#4c78a8"},
                "ariaRoleDescription": {"value": "bar"},
                "description": {
                  "signal": "\"time (binned): \" + (!isValid(datum[\"bin_maxbins_20_time\"]) || !isFinite(+datum[\"bin_maxbins_20_time\"]) ? \"null\" : format(datum[\"bin_maxbins_20_time\"], \"\") + \" – \" + format(datum[\"bin_maxbins_20_time_end\"], \"\")) + \"; Count of Records: \" + (format(datum[\"__count\"], \"\"))"
                },
                "x2": {
                  "scale": "child__column_time_x",
                  "field": "bin_maxbins_20_time",
                  "offset": 1
                },
                "x": {
                  "scale": "child__column_time_x",
                  "field": "bin_maxbins_20_time_end"
                },
                "y": {"scale": "child__column_time_y", "field": "__count"},
                "y2": {"scale": "child__column_time_y", "value": 0}
              }
            }
          },
          {
            "name": "brush_brush",
            "type": "rect",
            "clip": true,
            "encode": {
              "enter": {"fill": {"value": "transparent"}},
              "update": {
                "x": [
                  {
                    "test": "data(\"brush_store\").length && data(\"brush_store\")[0].unit === \"child__column_time_layer_0\"",
                    "signal": "brush_x[0]"
                  },
                  {"value": 0}
                ],
                "y": [
                  {
                    "test": "data(\"brush_store\").length && data(\"brush_store\")[0].unit === \"child__column_time_layer_0\"",
                    "value": 0
                  },
                  {"value": 0}
                ],
                "x2": [
                  {
                    "test": "data(\"brush_store\").length && data(\"brush_store\")[0].unit === \"child__column_time_layer_0\"",
                    "signal": "brush_x[1]"
                  },
                  {"value": 0}
                ],
                "y2": [
                  {
                    "test": "data(\"brush_store\").length && data(\"brush_store\")[0].unit === \"child__column_time_layer_0\"",
                    "field": {"group": "height"}
                  },
                  {"value": 0}
                ],
                "stroke": [
                  {"test": "brush_x[0] !== brush_x[1]", "value": "white"},
                  {"value": null}
                ]
              }
            }
          }
        ],
        "axes": [
          {
            "scale": "child__column_time_y",
            "orient": "left",
            "gridScale": "child__column_time_x",
            "grid": true,
            "tickCount": {"signal": "ceil(childHeight/40)"},
            "domain": false,
            "labels": false,
            "aria": false,
            "maxExtent": 0,
            "minExtent": 0,
            "ticks": false,
            "zindex": 0
          },
          {
            "scale": "child__column_time_x",
            "orient": "bottom",
            "grid": false,
            "title": "time (binned)",
            "labelFlush": true,
            "labelOverlap": true,
            "tickCount": {"signal": "ceil(childWidth/10)"},
            "zindex": 0
          },
          {
            "scale": "child__column_time_y",
            "orient": "left",
            "grid": false,
            "title": "Count of Records",
            "labelOverlap": true,
            "tickCount": {"signal": "ceil(childHeight/40)"},
            "zindex": 0
          }
        ]
      }
    ],
    "scales": [
      {
        "name": "child__column_distance_x",
        "type": "linear",
        "domain": {
          "signal": "[child__column_distance_layer_0_bin_maxbins_20_distance_bins.start, child__column_distance_layer_0_bin_maxbins_20_distance_bins.stop]"
        },
        "range": [0, {"signal": "childWidth"}],
        "bins": {
          "signal": "child__column_distance_layer_0_bin_maxbins_20_distance_bins"
        },
        "zero": false
      },
      {
        "name": "child__column_distance_y",
        "type": "linear",
        "domain": {
          "fields": [
            {"data": "data_6", "field": "__count"},
            {"data": "data_5", "field": "__count"}
          ]
        },
        "range": [{"signal": "childHeight"}, 0],
        "nice": true,
        "zero": true
      },
      {
        "name": "child__column_delay_x",
        "type": "linear",
        "domain": {
          "signal": "[child__column_delay_layer_1_bin_maxbins_20_delay_bins.start, child__column_delay_layer_1_bin_maxbins_20_delay_bins.stop]"
        },
        "range": [0, {"signal": "childWidth"}],
        "bins": {
          "signal": "child__column_delay_layer_1_bin_maxbins_20_delay_bins"
        },
        "zero": false
      },
      {
        "name": "child__column_delay_y",
        "type": "linear",
        "domain": {
          "fields": [
            {"data": "data_7", "field": "__count"},
            {"data": "data_4", "field": "__count"}
          ]
        },
        "range": [{"signal": "childHeight"}, 0],
        "nice": true,
        "zero": true
      },
      {
        "name": "child__column_time_x",
        "type": "linear",
        "domain": {
          "signal": "[child__column_time_layer_1_bin_maxbins_20_time_bins.start, child__column_time_layer_1_bin_maxbins_20_time_bins.stop]"
        },
        "range": [0, {"signal": "childWidth"}],
        "bins": {"signal": "child__column_time_layer_1_bin_maxbins_20_time_bins"},
        "zero": false
      },
      {
        "name": "child__column_time_y",
        "type": "linear",
        "domain": {
          "fields": [
            {"data": "data_2", "field": "__count"},
            {"data": "data_1", "field": "__count"}
          ]
        },
        "range": [{"signal": "childHeight"}, 0],
        "nice": true,
        "zero": true
      }
    ]
  }
