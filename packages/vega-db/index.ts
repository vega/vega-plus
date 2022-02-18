export { specRewrite } from './src/spec_rewrite';
export { runtimeRewrite } from './src/runtime_rewrite'; 

import { specRewrite } from './src/spec_rewrite';
import { runtimeRewrite } from './src/runtime_rewrite'; 
import * as vega from 'vega';
import VegaTransformPostgres from '../demo/new_transform'


export function parse(spec: vega.Spec) {
    const httpOptions = {
        'url': 'http://localhost:3000/query',
        'mode': 'cors',
        'method': 'POST',
        'headers': {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      };
    (vega as any).transforms['dbtransform'] = VegaTransformPostgres;
    VegaTransformPostgres.setHttpOptions(httpOptions);

    const newSpec = specRewrite(spec)
    const runtime = vega.parse(newSpec)
    console.log(runtime)
    return runtimeRewrite(runtime)
}