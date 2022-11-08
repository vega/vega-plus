const select_fields = ["FL_DATE","DEP_TIME","DEP_DELAY","ARR_TIME","ARR_DELAY","AIR_TIME","DISTANCE"]

export const flight_spec = {
    "$schema": "https://vega.github.io/schema/vega/v5.json",
    "autosize": "pad",
    "padding": 5,
    "width": 600,
    "height": 250,
    "signals": [
      {
        "name": "field",
        "value": () => { return "field_1" },
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