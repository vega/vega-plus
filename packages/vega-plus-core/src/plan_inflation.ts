import { aggregateTransformToSql } from "./aggregate";
import { filterTransformToSql } from "./filter";
import { collectTransformToSql } from "./collect";
import { collectNonTransformFields, vegaNonTransformToSql } from "./non_transform"; 
import { projectTransformToSql } from "./project"
import { stackTransformToSql } from "./stack"
import {BinTransform, ExtentTransform, SignalRef, transforms, Transforms, Vector2} from "vega"
import {
    Data
  } from 'vega-typings/types/spec';

export type DbTransformOrig = {
    type: 'dbtransform';
    relation: string;
    db?: string;
} 

export type DbTransformProcessed = {
    type: 'dbtransform';
    query: {signal:string;};
    alias?: string;
    db?: string;
    relation?: string;
} 

export type ExtendedTransforms = 
    | Transforms
    | DbTransformOrig
    | DbTransformProcessed;

export type DbData = {
    name: string;
    transform: ExtendedTransforms[]
} 

export type ExtendedData = 
    | Data
    | DbData;

export type EnumSeg = {
    sql: ExtendedData[];
    vega: ExtendedData[];
    hybrid: ExtendedData[];
    orig: ExtendedData;
}

/* 
    for each data entry, enumerte the pipeline.
    they can either be pure vaga (same as the original),
    pure sql (one dbtransform node contains the fully translated sql query),
    or hyrid (start with sql query and the rest are unprocessed as in the original)
*/
export function enumSegPlan(data:ExtendedData): EnumSeg {
    const plan = {sql:[], vega:[], hybrid:[], orig:data}
    let terminate: ExtendedTransforms;

    if (!data.transform) {
        plan.vega.push(data)
        return plan
    }

    const processed:DbTransformProcessed[] = []
    const newData = []
    let iter = 0

    if (data.transform[0].type === "dbtransform") {
        let db_source_transform:DbTransformProcessed = {
            type: 'dbtransform',
            query: {signal: `"${data.transform[0].relation}"`}
        };

        if (data.transform.length == 1) {
            // data is from db without futher processing
            // this data entry won't have any pure vega plan
            plan.sql.push({
                name: data.name,
                transform: [db_source_transform]
            })
            return plan
        } else {
            // this data item start with the dbtransform and followed by more transforms to be translated
            processed.push(db_source_transform)
            iter = 1
        } 
    } else {
        // this data entry has exactly one pure vega plan,
        plan.vega.push(data)
    }

    for (var i = iter; i < data.transform.length; i++) {
                    
        terminate = processTransform(plan, i, processed, newData) 

        // stitch the processed part with unprocessed vega operators and store them in hybrid 
        if (i == data.transform.length - 1 ) {
            plan.sql.push({
                name: data.name,
                transform: terminate? [...processed, terminate] : [...processed]
            })

            return plan
        } else {
            
            if (terminate) {
                plan.hybrid.push({
                    name: data.name,
                    transform: [...processed, terminate, ...data.transform.slice(i+1)]
                })

                return plan
            } else {
                plan.hybrid.push({
                    name: data.name,
                    transform: [...processed, ...data.transform.slice(i+1)]
                })
            }
            
        }
        
    }
    

    // return plan
}

export function processTransform(plan: EnumSeg, idx: number, processed: DbTransformProcessed[], newData: ExtendedData[], db?: string): ExtendedTransforms {
    const data = plan.orig
    const transform = data.transform[idx]
    let alias:string = `${data.name}_${transform.type}_${processed.length}`
    var prev = processed.pop() ?? null; // null or a dbtransform
    let tableName = prev ? `(${prev.query.signal.slice(1, -1)}) ${prev.alias}` : '$SOURCE$'

    if (transform.type === "extent") {
        processExtent(transform, tableName, newData)
    }
    else if (transform.type === "bin") {
        // TODO: need to include previous queries like in crossfilter
        processBin(transform, tableName, processed, newData, alias)  
    }
    else if (transform.type === "aggregate") {        
        processed.push({
            type: "dbtransform",
            alias: alias,
            query: {
                signal: aggregateTransformToSql(tableName, transform, db, prev)
            }
        })
    }
    
    else if (transform.type === "filter") {
        let sql = filterTransformToSql(tableName, transform, db, prev)

        if (sql === null) {
            console.log("skip")
            return transform
        }
        
        processed.push({
            type: "dbtransform",
            alias: alias,
            query: {
                signal: sql
            }
        })
    }
    
    else if (transform.type === 'project') {        
        processed.push({
            type: "dbtransform",
            alias: alias,
            query: {
                signal: projectTransformToSql(tableName, transform, db, prev)
            }
        })
        
    }
    
    else if (transform.type === 'stack') {
        processed.push({
            type: "dbtransform",
            alias: alias,
            query: {
                signal: stackTransformToSql(tableName, transform, db)
            }
        })
        return ({
            type: "formula",
            expr: `datum.y1 - datum.${transform.field}`,
            as: transform.as ? transform.as[0] : "y0"
        })
    }
    
    else if (transform.type === 'collect') {
        processed.push({
            type: "dbtransform",
            alias: alias,
            query: {
                signal: collectTransformToSql(tableName, transform, db)
            }
        })
    }

    else {
        // transform hasn't been supported,
        // need to terminate the processing
        return transform
    }

    return null
}

function processExtent(transform: ExtentTransform, tableName: string, newData: ExtendedData[]) {
    let query: string = null;

    if (transform.field.hasOwnProperty("signal")) {
        query = `"select min(" + ${transform.field['signal']} + ") as min, max(" + ${transform.field['signal']} + ") as max from ${tableName}"`
    } else {
        query = `"select min(${transform.field}) as min, max(${transform.field}) as max from ${tableName}"`
    }
    newData.push({
        name: transform.signal,
        transform: [{
            type: "dbtransform",
            query: {
                signal: query
            }
        }]
    })  
}

function processBin(transform: BinTransform, tableName: string, processed:DbTransformProcessed[], newData: ExtendedData[], alias:string) {
    const maxbins = transform.maxbins ? transform.maxbins : 10
    let extent: SignalRef|Vector2<number | SignalRef> = {signal:null}, query:string = null;
            
    if (transform.extent.hasOwnProperty("signal")) {
        // geting "extent" from the data item that converted from signal
        const name = transform.extent["signal"]
        extent["signal"] = `[data('${name}')[0]['min'], data('${name}')[0]['max']]`
    } else if (Array.isArray(transform.extent)){
        // extent is assigned explicitly as the array [min, max]
        extent = transform.extent
    } 
    
    let bin_name = `bin_${newData.length}`
    let bin_signal = transform.signal? transform.signal : bin_name
    let bin0 = transform.as? transform.as[0] : "bin0"
    let bin1 = transform.as? transform.as[1] : "bin1"
    
    if (transform.field.hasOwnProperty("signal")) {
        query = `" select ${bin0} +" + ${bin_signal}.step + " as ${bin1}, * from (select " + ${bin_signal}.start + " + " + ${bin_signal}.step + " * floor((cast( " + ${transform.field['signal']} + " as float) - " + ${bin_signal}.start + ")/" + ${bin_signal}.step + ") as ${bin0}, * from ${tableName} where " + ${transform.field['signal']} + " between " + ${bin_signal}.start + " and " + ${bin_signal}.stop + ") as sub "`            
    } else {
        query = `" select ${bin0} +" + ${bin_signal}.step + " as ${bin1}, * from (select " + ${bin_signal}.start + " + " + ${bin_signal}.step + " * floor((cast(${transform.field} as float) - "+${bin_signal}.start+")/" + ${bin_signal}.step + ") as ${bin0}, * from ${tableName} where ${transform.field} between " + ${bin_signal}.start + " and " + ${bin_signal}.stop + ") as sub "`
    }
    
    newData.push({
        name:bin_name,
        transform: [
            {
                type: "bin",
                field: null,
                as: [bin0, bin1],
                signal: bin_signal,
                maxbins: maxbins,
                extent: extent,
                nice: false
            }
        ]
    })
    
    processed.push({
        type: "dbtransform",
        alias: alias,
        query: {
            signal: query
        }
    })
}