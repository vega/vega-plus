import { Transform as VegaTransform, ingest } from "vega"
const querystring = require('querystring');
//const http = require('http');
import * as http from 'http';
//global.fetch = require("node-fetch");



export class VegaDbTransform extends VegaTransform {
  public value: any
  public Definition: any
  public id: string
  public _httpOptions: any

  constructor(arg: {
    id: string
    httpOptions: any
    init?: any
    params?: any

  }) {
    super(arg.init ?? [], arg.params)
    this.id = arg.id
    this.value = []
    this._httpOptions = arg.httpOptions;
    this.Definition = {
      type: this.id,
      metadata: { changes: true, source: true },
      params: [{ name: "query", type: "string", required: true },
      { name: "db", type: "string", required: false }]

    }
  }

  public async transform(params: Record<string, any>, pulse: Record<string, any>) {
    console.log(params)
    if (!this._httpOptions) {
      throw Error("Vega Transform Postgres http options missing. Assign it with setHttpOptions.");
    }
    if (!params.query) {
      throw Error("Internal error: this._query should be defined");
    }
    let result = [];
    const postQuery = async function () {
      const response = await fetch('http://localhost:3000/query', {
        method: 'POST',
        mode: 'cors',
        headers: {
          // must set this content type when querying via POST
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: querystring.stringify({
          query: params.query
        })
      });

      // fetch won’t reject on HTTP error status even if the response
      // is an HTTP 404 or 500. Instead, it will resolve normally with
      // ok status set to false
      if (response.ok)
        return await response.json();
      else {
        // capture the error message
        const err = await response.json();
        throw Error(
          (err.error + ': ' + err.message).replace(/(\r\n|\n|\r)/gm, "")
        );
      }
    };

    try {
      result = await postQuery();
      console.log(result)
    } catch (error) {
      console.log(error);
    }
    result.forEach(ingest);
    const out = pulse.fork(pulse.NO_FIELDS & pulse.NO_SOURCE);
    this.value = out.add = out.source = out.rem = result;
    return out;
  }
}
