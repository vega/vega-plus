import * as vega from "vega";
import VegaTransformPostgres from "vega-transform-pg";

const table = "cars";
const xField = "cylinders";
const yFieldRaw = "miles_per_gallon";
const yField = "avg";
const precision = 2;
const query = `select ${xField}, round(cast(${yField}(${yFieldRaw}) as numeric), ${precision}) as ${yField} from ${table} group by ${xField}`;
const data = {
  type: "postgres",
  query: {
    signal: `'${query}'`
  }
} as any;
const spec:vega.Spec = {
  $schema: "https://vega.github.io/schema/vega/v5.json",
  width: 400,
  height: 200,
  padding: 10,
  data: [
    {
      name: "table",
      transform: [data]
    }
  ],

  signals: [
    {
      name: "tooltip",
      value: {},
      on: [
        {events: "rect:mouseover", update: "datum"},
        {events: "rect:mouseout",  update: "{}"}
      ]
    }
  ],

  scales: [
    {
      name: "xscale",
      type: "band",
      domain: {data: "table", field: xField},
      range: "width",
      padding: 0.05,
      round: true
    },
    {
      name: "yscale",
      domain: {data: "table", field: yField},
      nice: true,
      range: "height"
    }
  ],

  axes: [
    { orient: "bottom", scale: "xscale", title: xField },
    { orient: "left", scale: "yscale", title: `${yField}(${yFieldRaw})` }
  ],

  marks: [
    {
      type: "rect",
      from: {data:"table"},
      encode: {
        enter: {
          x: {scale: "xscale", field: xField},
          width: {scale: "xscale", band: 1},
          y: {scale: "yscale", field: yField},
          y2: {scale: "yscale", value: 0}
        },
        update: {
          fill: {value: "steelblue"}
        },
        hover: {
          fill: {value: "red"}
        }
      }
    },
    {
      type: "text",
      encode: {
        enter: {
          align: {value: "center"},
          baseline: {value: "bottom"},
          fill: {value: "#333"}
        },
        update: {
          x: {scale: "xscale", signal: `tooltip.${xField}`, band: 0.5},
          y: {scale: "yscale", signal: `tooltip.${yField}`, offset: -2},
          text: {signal: `tooltip.${yField}`},
          fillOpacity: [
            {test: `isNaN(tooltip.${yField})`, value: 0},
            {value: 1}
          ]
        }
      }
    }
  ]
}

VegaTransformPostgres.setPostgresConnectionString('postgres://localhost:5432/voyager');
VegaTransformPostgres.setHttpOptions({
  hostname: 'localhost',
  port: 3000,
  method: 'POST',
  path: '/query',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  }
});
(vega as any).transforms["postgres"] = VegaTransformPostgres;
const runtime = vega.parse(spec);
const view = new vega.View(runtime)
  .logLevel(vega.Info)
  .renderer("svg")
  .initialize(document.querySelector("#view"));
window["vega"] = vega;
window["view"] = view;
view.runAsync();