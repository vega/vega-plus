import * as vega from "vega";
import QueryCore from "vega-transform-omnisci-core";
import "@mapd/connector/dist/browser-connector";
const http = require('http');
const querystring = require('querystring');

function query(queryStr: string) {
  return new Promise<any>((resolve, reject) => {
    const postData = querystring.stringify({
      'query': queryStr
    });
    const options = {
      hostname: 'localhost',
      port: 3000,
      method: 'POST',
      path: '/query',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    }
    const req = http.request(options, (res: any) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        console.log(JSON.parse(data).rows);
        resolve(data);
      });
    });
    req.on('error', (e: any) => {
      console.error(`Error: ${e}`);
      reject();
    });
    req.write(postData);
    req.end();
  });
}

QueryCore.prototype.transform = function() {
  return query("select * from cars;");
}
/**
 * Generates a function to query data from an Sql database.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): *} params.query - The SQL query.
 */
/*export default function SqlTransform(params) {
  Transform.call(this, [], params);
}
SqlTransform.session = function (session) {
  if (session) {
    this._session = session;
    return this;
  }
  return this._session;
};
SqlTransform.Definition = {
  type: "QueryCore",
  metadata: { changes: true, source: true },
  params: [{ name: "query", type: "string", required: true }]
};
const prototype = inherits(SqlTransform, Transform);
prototype.transform = async function (_, pulse) {
  const result = await query(_.query);
  result.forEach(ingest);
  const out = pulse.fork(pulse.NO_FIELDS & pulse.NO_SOURCE);
  out.rem = this.value;
  this.value = out.add = out.source = result;
  return out;
};*/

const table = "flights_donotmodify";
const extent = {
  type: "querycore",
  query: {
    signal: `'select min(' + field + ') as "min", max(' + field + ') as "max" from ${table}'`
  }
} as any;
const data = {
  type: "querycore",
  query: {
    signal: `'select ' + bins.step + ' * floor((' + field + '-cast(' + bins.start + ' as float))/' + bins.step + ') as "bin_start", count(*) as "cnt" from ${table} where ' + field + ' between ' + bins.start + ' and ' + bins.stop + ' group by bin_start'`
  }
} as any;
const spec: vega.Spec = {
  $schema: "https://vega.github.io/schema/vega/v5.json",
  autosize: "pad",
  padding: 5,
  width: 600,
  height: 250,
  signals: [
    {
      name: "field",
      value: "airtime",
      bind: {
        input: "select",
        options: [
          "deptime",
          "crsdeptime",
          "arrtime",
          "crsarrtime",
          "flightnum",
          "actualelapsedtime",
          "crselapsedtime",
          "airtime",
          "arrdelay",
          "depdelay",
          "distance",
          "taxiin",
          "taxiout",
          "carrierdelay",
          "weatherdelay",
          "nasdelay",
          "securitydelay",
          "lateaircraftdelay",
          "plane_year"
        ]
      }
    },
    {
      name: "maxbins",
      value: 20,
      bind: { input: "range", min: 1, max: 300, debounce: 100 }
    }
  ],
  data: [
    {
      name: "extent",
      transform: [extent]
    },
    {
      name: "bin",
      transform: [
        // this bin transform doesn't actually bin any data, it just computea the bins signal
        {
          type: "bin",
          field: null,
          signal: "bins",
          maxbins: { signal: "maxbins" },
          extent: {
            signal:
              "data('extent') ? [data('extent')[0]['min'], data('extent')[0]['max']] : [0, 0]"
          }
        }
      ]
    },
    {
      name: "table",
      transform: [
        data,
        {
          type: "formula",
          expr: "datum.bin_start + bins.step",
          as: "bin_end"
        }
      ]
    }
  ],
  marks: [
    {
      name: "marks",
      type: "rect",
      from: { data: "table" },
      encode: {
        update: {
          fill: { value: "steelblue" },
          x2: {
            scale: "x",
            field: "bin_start",
            offset: {
              signal: "(bins.stop - bins.start)/bins.step > 150 ? 0 : 1"
            }
          },
          x: { scale: "x", field: "bin_end" },
          y: { scale: "y", field: "cnt" },
          y2: { scale: "y", value: 0 }
        }
      }
    }
  ],
  scales: [
    {
      name: "x",
      type: "linear",
      domain: {
        signal: "[bins.start, bins.stop]"
      },
      range: [0, { signal: "width" }],
      zero: false,
      bins: { signal: "bins" }
    },
    {
      name: "y",
      type: "linear",
      domain: { data: "table", field: "cnt" },
      range: [{ signal: "height" }, 0],
      nice: true,
      zero: true
    }
  ],
  axes: [
    {
      scale: "x",
      orient: "bottom",
      grid: false,
      title: {
        signal: `field`
      },
      labelFlush: true,
      labelOverlap: true
    },
    {
      scale: "y",
      orient: "left",
      grid: true,
      title: "Count of Records",
      labelOverlap: true,
      gridOpacity: 0.7
    }
  ],
  config: { axisY: { minExtent: 30 } }
};

vega.transforms["querycore"] = QueryCore;
const runtime = vega.parse(spec);
const view = new vega.View(runtime)
  .logLevel(vega.Info)
  .renderer("svg")
  .initialize(document.querySelector("#view"));
view.runAsync();
window["vega"] = vega;
window["view"] = view;