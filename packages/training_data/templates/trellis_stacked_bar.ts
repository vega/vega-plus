// export const parameter_types = {
//     field_1: "categorical",
//     field_2: "categorical",
//     field_3: "categorical",
//     field_4: "quantitative",
// }
export const trellis_parameter_types = {
    "categorical": ["field_1", "field_2", "field_3"],
    "quantitative": ["field_4"]
}

export const trellis_stacked_bar = {
    "$schema": "https://vega.github.io/schema/vega/v5.json",
    "background": "white",
    "padding": 5,
    "data": [
      {
        "name": "barley",
        "transform": [
            {
            "type": "dbtransform",
            "relation": () => { return "table" }
            }
        ]
      },
      {
        "name": "source_0",
        "source": "barley",
        "transform": [
          {
            "type": "aggregate",
            "groupby": [ () => { return "field_1" },  () => { return "field_2" }, () => { return "field_3" }],
            "ops": ["sum"],
            "fields": [ () => { return "field_4" }],
            "as": ["sum_yield"]
          },
          {
            "type": "stack",
            "groupby": [ () => { return "field_1" }, () => { return "field_3" }],
            "field": "sum_yield",
            "sort": {"field": [ () => { return "field_2" }], "order": ["ascending"]},
            "as": ["sum_yield_start", "sum_yield_end"]
          }
        ]
      },
      {
        "name": "column_domain",
        "source": "source_0",
        "transform": [{"type": "aggregate", "groupby": [ () => { return "field_3" }]}]
      }
    ],
    "signals": [
      {"name": "child_width", "value": 200},
      {"name": "y_step", "value": 20},
      {
        "name": "child_height",
        "update": "bandspace(domain('y').length, 0.1, 0.05) * y_step"
      }
    ],
    "layout": {
      "padding": 20,
      "offset": {"columnTitle": 10},
      "columns": {"signal": "length(data('column_domain'))"},
      "bounds": "full",
      "align": "all"
    },
    "marks": [
      {
        "name": "column-title",
        "type": "group",
        "role": "column-title",
        "title": {"text": "year", "style": "guide-title", "offset": 10}
      },
      {
        "name": "row_header",
        "type": "group",
        "role": "row-header",
        "encode": {"update": {"height": {"signal": "child_height"}}},
        "axes": [
          {
            "scale": "y",
            "orient": "left",
            "grid": false,
            "title": "variety",
            "zindex": 0
          }
        ]
      },
      {
        "name": "column_header",
        "type": "group",
        "role": "column-header",
        "from": {"data": "column_domain"},
        "sort": {"field": `"datum[\"${ () => { return "field_3" }}\"]"`, "order": "ascending"},
        "encode": {"update": {"width": {"signal": "child_width"}}}
      },
      {
        "name": "column_footer",
        "type": "group",
        "role": "column-footer",
        "from": {"data": "column_domain"},
        "sort": {"field": `"datum[\"${ () => { return "field_3" }}\"]"`, "order": "ascending"},
        "encode": {"update": {"width": {"signal": "child_width"}}},
        "axes": [
          {
            "scale": "x",
            "orient": "bottom",
            "grid": false,
            "title": "Sum of yield",
            "labelFlush": true,
            "labelOverlap": true,
            "tickCount": {"signal": "ceil(child_width/40)"},
            "zindex": 0
          }
        ]
      },
      {
        "name": "cell",
        "type": "group",
        "style": "cell",
        "from": {
          "facet": {"name": "facet", "data": "source_0", "groupby": [() => { return "field_3" }]}
        },
        "sort": {"field": [ `"datum[\"${ () => { return "field_3" }}\"]"`], "order": ["ascending"]},
        "encode": {
          "update": {
            "width": {"signal": "child_width"},
            "height": {"signal": "child_height"}
          }
        },
        "marks": [
          {
            "name": "child_marks",
            "type": "rect",
            "style": ["bar"],
            "from": {"data": "facet"},
            "encode": {
              "update": {
                "fill": {"scale": "color", "field":  () => { return "field_2" }},
                "ariaRoleDescription": {"value": "bar"},
                "description": {
                  "signal": "\"Sum of yield: \" + (format(datum[\"sum_yield\"], \"\")) + \"; variety: \" + (isValid(datum[\"variety\"]) ? datum[\"variety\"] : \"\"+datum[\"variety\"]) + \"; site: \" + (isValid(datum[\"site\"]) ? datum[\"site\"] : \"\"+datum[\"site\"])"
                },
                "x": {"scale": "x", "field": "sum_yield_end"},
                "x2": {"scale": "x", "field": "sum_yield_start"},
                "y": {"scale": "y", "field": "variety"},
                "height": {"signal": "max(0.25, bandwidth('y'))"}
              }
            }
          }
        ],
        "axes": [
          {
            "scale": "x",
            "orient": "bottom",
            "gridScale": "y",
            "grid": true,
            "tickCount": {"signal": "ceil(child_width/40)"},
            "domain": false,
            "labels": false,
            "aria": false,
            "maxExtent": 0,
            "minExtent": 0,
            "ticks": false,
            "zindex": 0
          }
        ]
      }
    ],
    "scales": [
      {
        "name": "x",
        "type": "linear",
        "domain": {
          "data": "source_0",
          "fields": ["sum_yield_start", "sum_yield_end"]
        },
        "range": [0, {"signal": "child_width"}],
        "nice": true,
        "zero": true
      },
      {
        "name": "y",
        "type": "band",
        "domain": {"data": "source_0", "field":  () => { return "field_1" }, "sort": true},
        "range": {"step": {"signal": "y_step"}},
        "paddingInner": 0.1,
        "paddingOuter": 0.05
      },
      {
        "name": "color",
        "type": "ordinal",
        "domain": {"data": "source_0", "field": () => { return "field_2" }, "sort": true},
        "range": "category"
      }
    ],
    "legends": [{"fill": "color", "symbolType": "square", "title": "site"}]
  }