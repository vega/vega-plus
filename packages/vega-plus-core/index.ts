export { specRewrite } from './src/spec_rewrite';
export { runtimeRewrite } from './src/runtime_rewrite'; 

import { specRewrite } from './src/spec_rewrite';
import { runtimeRewrite } from './src/runtime_rewrite'; 
import * as vega from 'vega';

export function parse(spec: vega.Spec, transform_type: string, transform:any, config?:object, option?:object) {

    (vega as any).transforms[transform_type] = transform
    const newSpec = specRewrite(spec)
    const runtime = vega.parse(newSpec, config, option)
    console.log(runtime)
    return runtimeRewrite(runtime)
}
