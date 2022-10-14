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
var csv_url = require("../data/movies_51k.json");

async function DuckDBs(){
  var url = require("../data/movies_51k.parquet");
  console.log(url, url_loc, window, window.location)
  url = url_loc + url
  const db = new DuckDB<"Test">(url, "movies");
  await db.initialize();
  return db
}




db.then(function(db){
    async function duck_db_query(query){
      const results = await db.queries(query);
      return results;
    }

    (VegaTransformDB as any).type('Serverless');
    (VegaTransformDB as any).QueryFunction(duck_db_query);
    const oldSpec = "<pre class=\"prettyprint\">" + JSON.stringify(vega_spec['data'], null, 4) + "</pre>"


    const newspec = specRewrite(vega_spec)
    const runtime = vega.parse(newspec);
    console.log("Normal Vega Start");  
    const view = new vega.View(runtime)
      .logLevel(vega.Info)
      .renderer("svg")
      .initialize(document.querySelector("#vega_view"));
    view.runAsync();
    console.log("Normal Vega Done");

    const newspec_vp = specRewrite(vegaplus_spec)

    // rename(newspec_vp.data, "dbtransform");
    console.log(newspec_vp) ;

    (vega as any).transforms["dbtransform"] = VegaTransformDB;
    console.log("Vega Plus Start");  
    const runtime_vp = vega.parse(newspec_vp);
    console.log(runtime_vp) 
    
    const view_vp = new vega.View(runtime_vp)
      .logLevel(vega.Info)
      .renderer("svg")
      .initialize(document.querySelector("#vegap_view"));  
    console.log(view_vp) 
    view_vp.runAsync();
    console.log("Vega Plus Done");

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
});

function rename(dataSpec, type) {
  for (var i = 0; i < dataSpec.length; i++) {
    var spec = dataSpec[i]
    for (const transform of spec.transform) {
      if (transform.type === "dbtransform") transform.type = type

    }
  }
}

const vegaplus_spec =   {
    "$schema": "https://vega.github.io/schema/vega/v5.json",
    "description": "A dashboard with cross-highlighting.",
    "background": "white",
    "padding": 5,
    "data": [
      {"name": "pts_store"},
      {
        "name": "source_0",
        "transform": [
          {       
            "type": "dbtransform",
            "relation": "movies"
          }
        ]
      },
      {
        "name": "data_0",
        "source": "source_0",
        "transform": [
          {
            "type": "extent",
            "field": "IMDB_Rating",
            "signal": "concat_0_layer_1_bin_maxbins_10_IMDB_Rating_extent"
          },
          {
            "type": "bin",
            "field": "IMDB_Rating",
            "as": [
              "bin_maxbins_10_IMDB_Rating",
              "bin_maxbins_10_IMDB_Rating_end"
            ],
            "signal": "concat_0_layer_1_bin_maxbins_10_IMDB_Rating_bins",
            "extent": {
              "signal": "concat_0_layer_1_bin_maxbins_10_IMDB_Rating_extent"
            },
            "maxbins": 10
          },
          {
            "type": "extent",
            "field": "Rotten_Tomatoes_Rating",
            "signal": "concat_0_layer_1_bin_maxbins_10_Rotten_Tomatoes_Rating_extent"
          },
          {
            "type": "bin",
            "field": "Rotten_Tomatoes_Rating",
            "as": [
              "bin_maxbins_10_Rotten_Tomatoes_Rating",
              "bin_maxbins_10_Rotten_Tomatoes_Rating_end"
            ],
            "signal": "concat_0_layer_1_bin_maxbins_10_Rotten_Tomatoes_Rating_bins",
            "extent": {
              "signal": "concat_0_layer_1_bin_maxbins_10_Rotten_Tomatoes_Rating_extent"
            },
            "maxbins": 10
          }
        ]
      },
      {
        "name": "data_1",
        "source": "data_0",
        "transform": [
          {
            "type": "filter",
            "expr": "!length(data(\"pts_store\")) || vlSelectionTest(\"pts_store\", datum)"
          },
          {
            "type": "aggregate",
            "groupby": [
              "bin_maxbins_10_IMDB_Rating",
              "bin_maxbins_10_IMDB_Rating_end",
              "bin_maxbins_10_Rotten_Tomatoes_Rating",
              "bin_maxbins_10_Rotten_Tomatoes_Rating_end"
            ],
            "ops": ["count"],
            "fields": [null],
            "as": ["__count"]
          },
          {
            "type": "filter",
            "expr": "isValid(datum[\"bin_maxbins_10_IMDB_Rating\"]) && isFinite(+datum[\"bin_maxbins_10_IMDB_Rating\"]) && isValid(datum[\"bin_maxbins_10_Rotten_Tomatoes_Rating\"]) && isFinite(+datum[\"bin_maxbins_10_Rotten_Tomatoes_Rating\"])"
          }
        ]
      },
      {
        "name": "data_2",
        "source": "data_0",
        "transform": [
          {
            "type": "aggregate",
            "groupby": [
              "bin_maxbins_10_IMDB_Rating",
              "bin_maxbins_10_IMDB_Rating_end",
              "bin_maxbins_10_Rotten_Tomatoes_Rating",
              "bin_maxbins_10_Rotten_Tomatoes_Rating_end"
            ],
            "ops": ["count"],
            "fields": [null],
            "as": ["__count"]
          },
          {
            "type": "filter",
            "expr": "isValid(datum[\"bin_maxbins_10_IMDB_Rating\"]) && isFinite(+datum[\"bin_maxbins_10_IMDB_Rating\"]) && isValid(datum[\"bin_maxbins_10_Rotten_Tomatoes_Rating\"]) && isFinite(+datum[\"bin_maxbins_10_Rotten_Tomatoes_Rating\"])"
          }
        ]
      },
      {
        "name": "data_3",
        "source": "source_0",
        "transform": [
          {
            "type": "aggregate",
            "groupby": ["Major_Genre"],
            "ops": ["count"],
            "fields": [null],
            "as": ["__count"]
          }
        ]
      }
    ],
    "signals": [
      {"name": "concat_0_width", "value": 200},
      {"name": "concat_0_height", "value": 200},
      {"name": "concat_1_width", "value": 330},
      {"name": "concat_1_height", "value": 120},
      {
        "name": "unit",
        "value": {},
        "on": [
          {"events": "mousemove", "update": "isTuple(group()) ? group() : unit"}
        ]
      },
      {
        "name": "pts",
        "update": "vlSelectionResolve(\"pts_store\", \"union\", true, true)"
      }
    ],
    "layout": {"padding": 20, "columns": 1, "bounds": "full", "align": "each"},
    "marks": [
      {
        "type": "group",
        "name": "concat_0_group",
        "style": "cell",
        "encode": {
          "update": {
            "width": {"signal": "concat_0_width"},
            "height": {"signal": "concat_0_height"}
          }
        },
        "marks": [
          {
            "name": "concat_0_layer_0_marks",
            "type": "rect",
            "style": ["rect"],
            "interactive": false,
            "from": {"data": "data_2"},
            "encode": {
              "update": {
                "fill": {"scale": "color", "field": "__count"},
                "description": {
                  "signal": "\"IMDB_Rating (binned): \" + (!isValid(datum[\"bin_maxbins_10_IMDB_Rating\"]) || !isFinite(+datum[\"bin_maxbins_10_IMDB_Rating\"]) ? \"null\" : format(datum[\"bin_maxbins_10_IMDB_Rating\"], \"\") + \" – \" + format(datum[\"bin_maxbins_10_IMDB_Rating_end\"], \"\")) + \"; Rotten_Tomatoes_Rating (binned): \" + (!isValid(datum[\"bin_maxbins_10_Rotten_Tomatoes_Rating\"]) || !isFinite(+datum[\"bin_maxbins_10_Rotten_Tomatoes_Rating\"]) ? \"null\" : format(datum[\"bin_maxbins_10_Rotten_Tomatoes_Rating\"], \"\") + \" – \" + format(datum[\"bin_maxbins_10_Rotten_Tomatoes_Rating_end\"], \"\")) + \"; Count of Records: \" + (format(datum[\"__count\"], \"\"))"
                },
                "x2": {
                  "scale": "concat_0_x",
                  "field": "bin_maxbins_10_IMDB_Rating",
                  "offset": 0.5
                },
                "x": {
                  "scale": "concat_0_x",
                  "field": "bin_maxbins_10_IMDB_Rating_end",
                  "offset": 0.5
                },
                "y2": {
                  "scale": "concat_0_y",
                  "field": "bin_maxbins_10_Rotten_Tomatoes_Rating",
                  "offset": 0.5
                },
                "y": {
                  "scale": "concat_0_y",
                  "field": "bin_maxbins_10_Rotten_Tomatoes_Rating_end",
                  "offset": 0.5
                }
              }
            }
          },
          {
            "name": "concat_0_layer_1_marks",
            "type": "symbol",
            "style": ["point"],
            "interactive": false,
            "from": {"data": "data_1"},
            "encode": {
              "update": {
                "fill": {"value": "transparent"},
                "stroke": {"value": "#666"},
                "ariaRoleDescription": {"value": "point"},
                "description": {
                  "signal": "\"IMDB_Rating (binned): \" + (!isValid(datum[\"bin_maxbins_10_IMDB_Rating\"]) || !isFinite(+datum[\"bin_maxbins_10_IMDB_Rating\"]) ? \"null\" : format(datum[\"bin_maxbins_10_IMDB_Rating\"], \"\") + \" – \" + format(datum[\"bin_maxbins_10_IMDB_Rating_end\"], \"\")) + \"; Rotten_Tomatoes_Rating (binned): \" + (!isValid(datum[\"bin_maxbins_10_Rotten_Tomatoes_Rating\"]) || !isFinite(+datum[\"bin_maxbins_10_Rotten_Tomatoes_Rating\"]) ? \"null\" : format(datum[\"bin_maxbins_10_Rotten_Tomatoes_Rating\"], \"\") + \" – \" + format(datum[\"bin_maxbins_10_Rotten_Tomatoes_Rating_end\"], \"\")) + \"; Count of Records: \" + (format(datum[\"__count\"], \"\"))"
                },
                "x": {
                  "signal": "scale(\"concat_0_x\", 0.5 * datum[\"bin_maxbins_10_IMDB_Rating\"] + 0.5 * datum[\"bin_maxbins_10_IMDB_Rating_end\"])"
                },
                "y": {
                  "signal": "scale(\"concat_0_y\", 0.5 * datum[\"bin_maxbins_10_Rotten_Tomatoes_Rating\"] + 0.5 * datum[\"bin_maxbins_10_Rotten_Tomatoes_Rating_end\"])"
                },
                "size": {"scale": "size", "field": "__count"}
              }
            }
          }
        ],
        "axes": [
          {
            "scale": "concat_0_x",
            "orient": "bottom",
            "grid": false,
            "title": "IMDB_Rating (binned)",
            "labelFlush": true,
            "labelOverlap": true,
            "tickCount": {"signal": "ceil(concat_0_width/10)"},
            "zindex": 1
          },
          {
            "scale": "concat_0_y",
            "orient": "left",
            "grid": false,
            "title": "Rotten_Tomatoes_Rating (binned)",
            "labelOverlap": true,
            "tickCount": {"signal": "ceil(concat_0_height/10)"},
            "zindex": 1
          }
        ],
        "legends": [
          {
            "direction": "horizontal",
            "gradientLength": 120,
            "title": "All Movies Count",
            "fill": "color"
          },
          {
            "title": "Selected Category Count",
            "size": "size",
            "symbolType": "circle",
            "encode": {
              "symbols": {
                "update": {
                  "fill": {"value": "transparent"},
                  "stroke": {"value": "#666"}
                }
              }
            }
          }
        ]
      },
      {
        "type": "group",
        "name": "concat_1_group",
        "style": "cell",
        "encode": {
          "update": {
            "width": {"signal": "concat_1_width"},
            "height": {"signal": "concat_1_height"}
          }
        },
        "signals": [
          {
            "name": "pts_tuple",
            "on": [
              {
                "events": [{"source": "scope", "type": "click"}],
                "update": "datum && item().mark.marktype !== 'group' ? {unit: \"concat_1\", fields: pts_tuple_fields, values: [(item().isVoronoi ? datum.datum : datum)[\"Major_Genre\"]]} : null",
                "force": true
              },
              {
                "events": [{"source": "view", "type": "dblclick"}],
                "update": "null"
              }
            ]
          },
          {
            "name": "pts_tuple_fields",
            "value": [{"field": "Major_Genre", "channel": "x", "type": "E"}]
          },
          {
            "name": "pts_toggle",
            "value": false,
            "on": [
              {
                "events": [{"source": "scope", "type": "click"}],
                "update": "event.shiftKey"
              },
              {
                "events": [{"source": "view", "type": "dblclick"}],
                "update": "false"
              }
            ]
          },
          {
            "name": "pts_modify",
            "on": [
              {
                "events": {"signal": "pts_tuple"},
                "update": "modify(\"pts_store\", pts_toggle ? null : pts_tuple, pts_toggle ? null : true, pts_toggle ? pts_tuple : null)"
              }
            ]
          }
        ],
        "marks": [
          {
            "name": "concat_1_marks",
            "type": "rect",
            "style": ["bar"],
            "interactive": true,
            "from": {"data": "data_3"},
            "encode": {
              "update": {
                "fill": [
                  {
                    "test": "!length(data(\"pts_store\")) || vlSelectionTest(\"pts_store\", datum)",
                    "value": "steelblue"
                  },
                  {"value": "grey"}
                ],
                "ariaRoleDescription": {"value": "bar"},
                "description": {
                  "signal": "\"Major_Genre: \" + (isValid(datum[\"Major_Genre\"]) ? datum[\"Major_Genre\"] : \"\"+datum[\"Major_Genre\"]) + \"; Count of Records: \" + (format(datum[\"__count\"], \"\"))"
                },
                "x": {"scale": "concat_1_x", "field": "Major_Genre"},
                "width": {"scale": "concat_1_x", "band": 1},
                "y": {"scale": "concat_1_y", "field": "__count"},
                "y2": {"scale": "concat_1_y", "value": 0}
              }
            }
          }
        ],
        "axes": [
          {
            "scale": "concat_1_y",
            "orient": "left",
            "gridScale": "concat_1_x",
            "grid": true,
            "tickCount": {"signal": "ceil(concat_1_height/40)"},
            "domain": false,
            "labels": false,
            "aria": false,
            "maxExtent": 0,
            "minExtent": 0,
            "ticks": false,
            "zindex": 0
          },
          {
            "scale": "concat_1_x",
            "orient": "bottom",
            "grid": false,
            "title": "Major_Genre",
            "labelAngle": 320,
            "labelAlign": "right",
            "labelBaseline": "top",
            "zindex": 0
          },
          {
            "scale": "concat_1_y",
            "orient": "left",
            "grid": false,
            "title": "Count of Records",
            "labelOverlap": true,
            "tickCount": {"signal": "ceil(concat_1_height/40)"},
            "zindex": 0
          }
        ]
      }
    ],
    "scales": [
      {
        "name": "color",
        "type": "linear",
        "domain": {"data": "data_2", "field": "__count"},
        "range": "heatmap",
        "interpolate": "hcl",
        "zero": false
      },
      {
        "name": "size",
        "type": "linear",
        "domain": {"data": "data_1", "field": "__count"},
        "range": [
          0,
          {
            "signal": "pow(0.95 * min(concat_0_width / ((concat_0_layer_1_bin_maxbins_10_IMDB_Rating_bins.stop - concat_0_layer_1_bin_maxbins_10_IMDB_Rating_bins.start) / concat_0_layer_1_bin_maxbins_10_IMDB_Rating_bins.step), concat_0_height / ((concat_0_layer_1_bin_maxbins_10_Rotten_Tomatoes_Rating_bins.stop - concat_0_layer_1_bin_maxbins_10_Rotten_Tomatoes_Rating_bins.start) / concat_0_layer_1_bin_maxbins_10_Rotten_Tomatoes_Rating_bins.step)), 2)"
          }
        ],
        "zero": true
      },
      {
        "name": "concat_0_x",
        "type": "linear",
        "domain": {
          "signal": "[concat_0_layer_1_bin_maxbins_10_IMDB_Rating_bins.start, concat_0_layer_1_bin_maxbins_10_IMDB_Rating_bins.stop]"
        },
        "range": [0, {"signal": "concat_0_width"}],
        "bins": {"signal": "concat_0_layer_1_bin_maxbins_10_IMDB_Rating_bins"},
        "zero": false
      },
      {
        "name": "concat_0_y",
        "type": "linear",
        "domain": {
          "signal": "[concat_0_layer_1_bin_maxbins_10_Rotten_Tomatoes_Rating_bins.start, concat_0_layer_1_bin_maxbins_10_Rotten_Tomatoes_Rating_bins.stop]"
        },
        "range": [{"signal": "concat_0_height"}, 0],
        "bins": {
          "signal": "concat_0_layer_1_bin_maxbins_10_Rotten_Tomatoes_Rating_bins"
        },
        "zero": false
      },
      {
        "name": "concat_1_x",
        "type": "band",
        "domain": {"data": "data_3", "field": "Major_Genre", "sort": true},
        "range": [0, {"signal": "concat_1_width"}],
        "paddingInner": 0.1,
        "paddingOuter": 0.05
      },
      {
        "name": "concat_1_y",
        "type": "linear",
        "domain": {"data": "data_3", "field": "__count"},
        "range": [{"signal": "concat_1_height"}, 0],
        "nice": true,
        "zero": true
      }
    ]
  };


const vega_spec = {
    "$schema": "https://vega.github.io/schema/vega/v5.json",
    "description": "A dashboard with cross-highlighting.",
    "background": "white",
    "padding": 5,
    "data": [
      {"name": "pts_store"},
      {"name": "source_0", "url": url_loc + csv_url, "format": {"type": "json"}},
      {
        "name": "data_0",
        "source": "source_0",
        "transform": [
          {
            "type": "extent",
            "field": "IMDB_Rating",
            "signal": "concat_0_layer_1_bin_maxbins_10_IMDB_Rating_extent"
          },
          {
            "type": "bin",
            "field": "IMDB_Rating",
            "as": [
              "bin_maxbins_10_IMDB_Rating",
              "bin_maxbins_10_IMDB_Rating_end"
            ],
            "signal": "concat_0_layer_1_bin_maxbins_10_IMDB_Rating_bins",
            "extent": {
              "signal": "concat_0_layer_1_bin_maxbins_10_IMDB_Rating_extent"
            },
            "maxbins": 10
          },
          {
            "type": "extent",
            "field": "Rotten_Tomatoes_Rating",
            "signal": "concat_0_layer_1_bin_maxbins_10_Rotten_Tomatoes_Rating_extent"
          },
          {
            "type": "bin",
            "field": "Rotten_Tomatoes_Rating",
            "as": [
              "bin_maxbins_10_Rotten_Tomatoes_Rating",
              "bin_maxbins_10_Rotten_Tomatoes_Rating_end"
            ],
            "signal": "concat_0_layer_1_bin_maxbins_10_Rotten_Tomatoes_Rating_bins",
            "extent": {
              "signal": "concat_0_layer_1_bin_maxbins_10_Rotten_Tomatoes_Rating_extent"
            },
            "maxbins": 10
          }
        ]
      },
      {
        "name": "data_1",
        "source": "data_0",
        "transform": [
          {
            "type": "filter",
            "expr": "!length(data(\"pts_store\")) || vlSelectionTest(\"pts_store\", datum)"
          },
          {
            "type": "aggregate",
            "groupby": [
              "bin_maxbins_10_IMDB_Rating",
              "bin_maxbins_10_IMDB_Rating_end",
              "bin_maxbins_10_Rotten_Tomatoes_Rating",
              "bin_maxbins_10_Rotten_Tomatoes_Rating_end"
            ],
            "ops": ["count"],
            "fields": [null],
            "as": ["__count"]
          },
          {
            "type": "filter",
            "expr": "isValid(datum[\"bin_maxbins_10_IMDB_Rating\"]) && isFinite(+datum[\"bin_maxbins_10_IMDB_Rating\"]) && isValid(datum[\"bin_maxbins_10_Rotten_Tomatoes_Rating\"]) && isFinite(+datum[\"bin_maxbins_10_Rotten_Tomatoes_Rating\"])"
          }
        ]
      },
      {
        "name": "data_2",
        "source": "data_0",
        "transform": [
          {
            "type": "aggregate",
            "groupby": [
              "bin_maxbins_10_IMDB_Rating",
              "bin_maxbins_10_IMDB_Rating_end",
              "bin_maxbins_10_Rotten_Tomatoes_Rating",
              "bin_maxbins_10_Rotten_Tomatoes_Rating_end"
            ],
            "ops": ["count"],
            "fields": [null],
            "as": ["__count"]
          },
          {
            "type": "filter",
            "expr": "isValid(datum[\"bin_maxbins_10_IMDB_Rating\"]) && isFinite(+datum[\"bin_maxbins_10_IMDB_Rating\"]) && isValid(datum[\"bin_maxbins_10_Rotten_Tomatoes_Rating\"]) && isFinite(+datum[\"bin_maxbins_10_Rotten_Tomatoes_Rating\"])"
          }
        ]
      },
      {
        "name": "data_3",
        "source": "source_0",
        "transform": [
          {
            "type": "aggregate",
            "groupby": ["Major_Genre"],
            "ops": ["count"],
            "fields": [null],
            "as": ["__count"]
          }
        ]
      }
    ],
    "signals": [
      {"name": "concat_0_width", "value": 200},
      {"name": "concat_0_height", "value": 200},
      {"name": "concat_1_width", "value": 330},
      {"name": "concat_1_height", "value": 120},
      {
        "name": "unit",
        "value": {},
        "on": [
          {"events": "mousemove", "update": "isTuple(group()) ? group() : unit"}
        ]
      },
      {
        "name": "pts",
        "update": "vlSelectionResolve(\"pts_store\", \"union\", true, true)"
      }
    ],
    "layout": {"padding": 20, "columns": 1, "bounds": "full", "align": "each"},
    "marks": [
      {
        "type": "group",
        "name": "concat_0_group",
        "style": "cell",
        "encode": {
          "update": {
            "width": {"signal": "concat_0_width"},
            "height": {"signal": "concat_0_height"}
          }
        },
        "marks": [
          {
            "name": "concat_0_layer_0_marks",
            "type": "rect",
            "style": ["rect"],
            "interactive": false,
            "from": {"data": "data_2"},
            "encode": {
              "update": {
                "fill": {"scale": "color", "field": "__count"},
                "description": {
                  "signal": "\"IMDB_Rating (binned): \" + (!isValid(datum[\"bin_maxbins_10_IMDB_Rating\"]) || !isFinite(+datum[\"bin_maxbins_10_IMDB_Rating\"]) ? \"null\" : format(datum[\"bin_maxbins_10_IMDB_Rating\"], \"\") + \" – \" + format(datum[\"bin_maxbins_10_IMDB_Rating_end\"], \"\")) + \"; Rotten_Tomatoes_Rating (binned): \" + (!isValid(datum[\"bin_maxbins_10_Rotten_Tomatoes_Rating\"]) || !isFinite(+datum[\"bin_maxbins_10_Rotten_Tomatoes_Rating\"]) ? \"null\" : format(datum[\"bin_maxbins_10_Rotten_Tomatoes_Rating\"], \"\") + \" – \" + format(datum[\"bin_maxbins_10_Rotten_Tomatoes_Rating_end\"], \"\")) + \"; Count of Records: \" + (format(datum[\"__count\"], \"\"))"
                },
                "x2": {
                  "scale": "concat_0_x",
                  "field": "bin_maxbins_10_IMDB_Rating",
                  "offset": 0.5
                },
                "x": {
                  "scale": "concat_0_x",
                  "field": "bin_maxbins_10_IMDB_Rating_end",
                  "offset": 0.5
                },
                "y2": {
                  "scale": "concat_0_y",
                  "field": "bin_maxbins_10_Rotten_Tomatoes_Rating",
                  "offset": 0.5
                },
                "y": {
                  "scale": "concat_0_y",
                  "field": "bin_maxbins_10_Rotten_Tomatoes_Rating_end",
                  "offset": 0.5
                }
              }
            }
          },
          {
            "name": "concat_0_layer_1_marks",
            "type": "symbol",
            "style": ["point"],
            "interactive": false,
            "from": {"data": "data_1"},
            "encode": {
              "update": {
                "fill": {"value": "transparent"},
                "stroke": {"value": "#666"},
                "ariaRoleDescription": {"value": "point"},
                "description": {
                  "signal": "\"IMDB_Rating (binned): \" + (!isValid(datum[\"bin_maxbins_10_IMDB_Rating\"]) || !isFinite(+datum[\"bin_maxbins_10_IMDB_Rating\"]) ? \"null\" : format(datum[\"bin_maxbins_10_IMDB_Rating\"], \"\") + \" – \" + format(datum[\"bin_maxbins_10_IMDB_Rating_end\"], \"\")) + \"; Rotten_Tomatoes_Rating (binned): \" + (!isValid(datum[\"bin_maxbins_10_Rotten_Tomatoes_Rating\"]) || !isFinite(+datum[\"bin_maxbins_10_Rotten_Tomatoes_Rating\"]) ? \"null\" : format(datum[\"bin_maxbins_10_Rotten_Tomatoes_Rating\"], \"\") + \" – \" + format(datum[\"bin_maxbins_10_Rotten_Tomatoes_Rating_end\"], \"\")) + \"; Count of Records: \" + (format(datum[\"__count\"], \"\"))"
                },
                "x": {
                  "signal": "scale(\"concat_0_x\", 0.5 * datum[\"bin_maxbins_10_IMDB_Rating\"] + 0.5 * datum[\"bin_maxbins_10_IMDB_Rating_end\"])"
                },
                "y": {
                  "signal": "scale(\"concat_0_y\", 0.5 * datum[\"bin_maxbins_10_Rotten_Tomatoes_Rating\"] + 0.5 * datum[\"bin_maxbins_10_Rotten_Tomatoes_Rating_end\"])"
                },
                "size": {"scale": "size", "field": "__count"}
              }
            }
          }
        ],
        "axes": [
          {
            "scale": "concat_0_x",
            "orient": "bottom",
            "grid": false,
            "title": "IMDB_Rating (binned)",
            "labelFlush": true,
            "labelOverlap": true,
            "tickCount": {"signal": "ceil(concat_0_width/10)"},
            "zindex": 1
          },
          {
            "scale": "concat_0_y",
            "orient": "left",
            "grid": false,
            "title": "Rotten_Tomatoes_Rating (binned)",
            "labelOverlap": true,
            "tickCount": {"signal": "ceil(concat_0_height/10)"},
            "zindex": 1
          }
        ],
        "legends": [
          {
            "direction": "horizontal",
            "gradientLength": 120,
            "title": "All Movies Count",
            "fill": "color"
          },
          {
            "title": "Selected Category Count",
            "size": "size",
            "symbolType": "circle",
            "encode": {
              "symbols": {
                "update": {
                  "fill": {"value": "transparent"},
                  "stroke": {"value": "#666"}
                }
              }
            }
          }
        ]
      },
      {
        "type": "group",
        "name": "concat_1_group",
        "style": "cell",
        "encode": {
          "update": {
            "width": {"signal": "concat_1_width"},
            "height": {"signal": "concat_1_height"}
          }
        },
        "signals": [
          {
            "name": "pts_tuple",
            "on": [
              {
                "events": [{"source": "scope", "type": "click"}],
                "update": "datum && item().mark.marktype !== 'group' ? {unit: \"concat_1\", fields: pts_tuple_fields, values: [(item().isVoronoi ? datum.datum : datum)[\"Major_Genre\"]]} : null",
                "force": true
              },
              {
                "events": [{"source": "view", "type": "dblclick"}],
                "update": "null"
              }
            ]
          },
          {
            "name": "pts_tuple_fields",
            "value": [{"field": "Major_Genre", "channel": "x", "type": "E"}]
          },
          {
            "name": "pts_toggle",
            "value": false,
            "on": [
              {
                "events": [{"source": "scope", "type": "click"}],
                "update": "event.shiftKey"
              },
              {
                "events": [{"source": "view", "type": "dblclick"}],
                "update": "false"
              }
            ]
          },
          {
            "name": "pts_modify",
            "on": [
              {
                "events": {"signal": "pts_tuple"},
                "update": "modify(\"pts_store\", pts_toggle ? null : pts_tuple, pts_toggle ? null : true, pts_toggle ? pts_tuple : null)"
              }
            ]
          }
        ],
        "marks": [
          {
            "name": "concat_1_marks",
            "type": "rect",
            "style": ["bar"],
            "interactive": true,
            "from": {"data": "data_3"},
            "encode": {
              "update": {
                "fill": [
                  {
                    "test": "!length(data(\"pts_store\")) || vlSelectionTest(\"pts_store\", datum)",
                    "value": "steelblue"
                  },
                  {"value": "grey"}
                ],
                "ariaRoleDescription": {"value": "bar"},
                "description": {
                  "signal": "\"Major_Genre: \" + (isValid(datum[\"Major_Genre\"]) ? datum[\"Major_Genre\"] : \"\"+datum[\"Major_Genre\"]) + \"; Count of Records: \" + (format(datum[\"__count\"], \"\"))"
                },
                "x": {"scale": "concat_1_x", "field": "Major_Genre"},
                "width": {"scale": "concat_1_x", "band": 1},
                "y": {"scale": "concat_1_y", "field": "__count"},
                "y2": {"scale": "concat_1_y", "value": 0}
              }
            }
          }
        ],
        "axes": [
          {
            "scale": "concat_1_y",
            "orient": "left",
            "gridScale": "concat_1_x",
            "grid": true,
            "tickCount": {"signal": "ceil(concat_1_height/40)"},
            "domain": false,
            "labels": false,
            "aria": false,
            "maxExtent": 0,
            "minExtent": 0,
            "ticks": false,
            "zindex": 0
          },
          {
            "scale": "concat_1_x",
            "orient": "bottom",
            "grid": false,
            "title": "Major_Genre",
            "labelAngle": 320,
            "labelAlign": "right",
            "labelBaseline": "top",
            "zindex": 0
          },
          {
            "scale": "concat_1_y",
            "orient": "left",
            "grid": false,
            "title": "Count of Records",
            "labelOverlap": true,
            "tickCount": {"signal": "ceil(concat_1_height/40)"},
            "zindex": 0
          }
        ]
      }
    ],
    "scales": [
      {
        "name": "color",
        "type": "linear",
        "domain": {"data": "data_2", "field": "__count"},
        "range": "heatmap",
        "interpolate": "hcl",
        "zero": false
      },
      {
        "name": "size",
        "type": "linear",
        "domain": {"data": "data_1", "field": "__count"},
        "range": [
          0,
          {
            "signal": "pow(0.95 * min(concat_0_width / ((concat_0_layer_1_bin_maxbins_10_IMDB_Rating_bins.stop - concat_0_layer_1_bin_maxbins_10_IMDB_Rating_bins.start) / concat_0_layer_1_bin_maxbins_10_IMDB_Rating_bins.step), concat_0_height / ((concat_0_layer_1_bin_maxbins_10_Rotten_Tomatoes_Rating_bins.stop - concat_0_layer_1_bin_maxbins_10_Rotten_Tomatoes_Rating_bins.start) / concat_0_layer_1_bin_maxbins_10_Rotten_Tomatoes_Rating_bins.step)), 2)"
          }
        ],
        "zero": true
      },
      {
        "name": "concat_0_x",
        "type": "linear",
        "domain": {
          "signal": "[concat_0_layer_1_bin_maxbins_10_IMDB_Rating_bins.start, concat_0_layer_1_bin_maxbins_10_IMDB_Rating_bins.stop]"
        },
        "range": [0, {"signal": "concat_0_width"}],
        "bins": {"signal": "concat_0_layer_1_bin_maxbins_10_IMDB_Rating_bins"},
        "zero": false
      },
      {
        "name": "concat_0_y",
        "type": "linear",
        "domain": {
          "signal": "[concat_0_layer_1_bin_maxbins_10_Rotten_Tomatoes_Rating_bins.start, concat_0_layer_1_bin_maxbins_10_Rotten_Tomatoes_Rating_bins.stop]"
        },
        "range": [{"signal": "concat_0_height"}, 0],
        "bins": {
          "signal": "concat_0_layer_1_bin_maxbins_10_Rotten_Tomatoes_Rating_bins"
        },
        "zero": false
      },
      {
        "name": "concat_1_x",
        "type": "band",
        "domain": {"data": "data_3", "field": "Major_Genre", "sort": true},
        "range": [0, {"signal": "concat_1_width"}],
        "paddingInner": 0.1,
        "paddingOuter": 0.05
      },
      {
        "name": "concat_1_y",
        "type": "linear",
        "domain": {"data": "data_3", "field": "__count"},
        "range": [{"signal": "concat_1_height"}, 0],
        "nice": true,
        "zero": true
      }
    ]
  }