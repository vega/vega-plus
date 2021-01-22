import { Transform as VegaTransform, ingest } from "vega"
import querystring from 'querystring';
import http from 'http';

export class VegaTransformPostgres extends VegaTransform {
  public value: any
  public Definition: any
  public id: string
  public _httpOptions: any

  constructor(arg: {
    id: string
    init?: any
    params?: any
    _httpOptions?: any
  }) {
    super(arg.init ?? [], arg.params)
    this.id = arg.id
    this.value = []
    this.Definition = {
      type: this.id,
      metadata: { changes: true, source: true },
      params: [{ name: "query", type: "string", required: true }]
    }
    this._httpOptions = {}
  }

  // public setHttpOptions(httpOptions) {
  //   if (httpOptions) {
  //     this._httpOptions = httpOptions;
  //     return this;
  //   }
  //   return this._httpOptions;
  // }

  public async transform(params: Record<string, any>, pulse: Record<string, any>) {
    // if (!this._httpOptions) {
    //   throw Error("Vega Transform Postgres http options missing. Assign it with setHttpOptions.");
    // }
    // if (!_.query) {
    //   throw Error("Internal error: this._query should be defined");
    // }
    // console.log("inside")
    // const result = await new Promise((resolve, reject) => {
    //   const postData = querystring.stringify({
    //     query: _.query
    //   });
    //   this._httpOptions['Content-Length'] = Buffer.byteLength(postData);
    //   const req = http.request(this._httpOptions, res => {
    //     let data = '';npm outdated

    //     res.on('data', (chunk) => {
    //       data += chunk;
    //     });
    //     res.on('end', () => {
    //       if (res.statusCode === 400) {
    //         reject(`${res.statusMessage}: ${data}`);
    //       } else {
    //         resolve(JSON.parse(data));
    //       }
    //     });
    //   });
    //   req.on('error', err => {
    //     reject(err);
    //   });
    //   req.write(postData);
    //   req.end();
    // }).catch(err => {
    //   console.error(err);
    //   return [];
    // });
    // result.forEach(ingest);
    // const out = pulse.fork(pulse.NO_FIELDS & pulse.NO_SOURCE);
    // this.value = out.add = out.source = out.rem = result;
    // return out;
  }

}

// import { inherits, ingest, Transform } from "vega";
// const querystring = require('querystring');
// const http = require('http');

// /**
//  * Queries data from a Postgres database.
//  * @constructor
//  * @param {object} params - The parameters for this operator.
//  */
// export default function VegaTransformPostgres(params) {
//   Transform.call(this, [], params);
// }

// VegaTransformPostgres.setHttpOptions = function (httpOptions) {
//   if (httpOptions) {
//     this._httpOptions = httpOptions;
//     return this;
//   }
//   return this._httpOptions;
// }

// VegaTransformPostgres.Definition = {
//   type: "postgres", // FixMe: make uppercase
//   metadata: { changes: true, source: true },
//   params: [
//     { name: "relation", type: "string", required: true }
//   ]
// };

// const prototype = inherits(VegaTransformPostgres, Transform);

// prototype.transform = async function (_, pulse) {
//   if (!VegaTransformPostgres._httpOptions) {
//     throw Error("Vega Transform Postgres http options missing. Assign it with setHttpOptions.");
//   }
//   if (!this._query) {
//     throw Error("Internal error: this._query should be defined");
//   }
//   const result = await new Promise((resolve, reject) => {
//     const postData = querystring.stringify({
//       query: this._query
//     });
//     VegaTransformPostgres._httpOptions['Content-Length'] = Buffer.byteLength(postData);
//     const req = http.request(VegaTransformPostgres._httpOptions, res => {
//       let data = '';
//       res.on('data', (chunk) => {
//         data += chunk;
//       });
//       res.on('end', () => {
//         if (res.statusCode === 400) {
//           reject(`${res.statusMessage}: ${data}`);
//         } else {
//           resolve(JSON.parse(data));
//         }
//       });
//     });
//     req.on('error', err => {
//       reject(err);
//     });
//     req.write(postData);
//     req.end();
//   }).catch(err => {
//     console.error(err);
//     return [];
//   });
//   result.forEach(ingest);
//   const out = pulse.fork(pulse.NO_FIELDS & pulse.NO_SOURCE);
//   this.value = out.add = out.source = out.rem = result;
//   return out;
// }
