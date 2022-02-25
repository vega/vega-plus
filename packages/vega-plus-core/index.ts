export { specRewrite } from './src/spec_rewrite';
export { runtimeRewrite } from './src/runtime_rewrite'; 

import { specRewrite } from './src/spec_rewrite';
import { runtimeRewrite } from './src/runtime_rewrite'; 
import * as vega from 'vega';
import VegaTransformPostgres from "vega-transform-db"


export function parse(spec: vega.Spec, httpOptions) {
    
    (vega as any).transforms['dbtransform'] = VegaTransformPostgres;
    VegaTransformPostgres.setHttpOptions(httpOptions);

    const newSpec = specRewrite(spec)
    const runtime = vega.parse(newSpec)
    console.log(runtime)
    return runtimeRewrite(runtime)
}
