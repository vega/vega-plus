import * as vega from "vega";
import VegaTransformPostgres from "vega-transform-pg";

const table = "cars";
const xField = "cylinders";
const yField = "miles_per_gallon";

const query = `select ${xField}, avg(${yField}) from ${table} group by ${xField}`;

const extent = {
  type: "postgres",
  query: {
    signal: `'${query}'`
  }
} as any;
const spec: vega.Spec = {
  $schema: "https://vega.github.io/schema/vega/v5.json",
  autosize: "pad",
  padding: 5,
  width: 600,
  height: 250,
  data: [
    {
      name: "extent",
      transform: [extent]
    }
  ],
  marks: [
    {
      name: "marks",
      type: "rect",
      from: { data: "extent" },
      encode: {
        update: {
          fill: { value: "steelblue" },
          x: {field: xField},
          y: {field: yField}
        }
      }
    }
  ],
  scales: [
    {
      name: "x",
      type: "linear",
      domain: [0, 10],
      range: [0, { signal: "width" }],
    },
    {
      name: "y",
      type: "linear",
      domain: [0, 30],
      range: [{ signal: "height" }, 0],
      nice: true,
      zero: true
    }
  ]
};

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
view.runAsync();
window["vega"] = vega;
window["view"] = view;