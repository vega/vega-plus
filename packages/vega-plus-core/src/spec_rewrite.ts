import { aggregateTransformToSql } from "./aggregate";
import { filterTransformToSql } from "./filter";
import { collectTransformToSql } from "./collect";
import { collectNonTransformFields, vegaNonTransformToSql } from "./non_transform"; 
import { projectTransformToSql } from "./project"
import { stackTransformToSql } from "./stack"
import {Transforms} from "vega"

export function specRewrite(vgSpec) {
    const dataSpec = vgSpec.data
    const dbTransformInd = []   //the data item to be removed(the one only indicating using db and not succeed by other transforms )
    var table = ""
    const newData = []
    var db = "postgres"
    var transformCounter = 0    // to generate a unique name for the transform in case we need it in nested sql
    
    
    for (const [index, spec] of dataSpec.entries()) {
        if (spec.transform && spec.transform.length > 0 && spec.transform[0].type === "dbtransform") {
            if (spec.transform.length == 1) {
                dbTransformInd.push(index)
                console.log(dbTransformInd)
            }
            table = spec.transform[0]["relation"]
            db = spec.transform[0].db ? spec.transform[0].db : db
            
            // if the data spec doesn't contain any explicit transform, collect all useful fields as data
            const markFileds: string[] = collectNonTransformFields(spec.name, vgSpec.marks);
            if (markFileds.length > 0) {
                spec.transform[0] = {
                    type: "dbtransform",
                    query: {
                        signal: vegaNonTransformToSql(table, markFileds)
                    }
                }
            }
            
            // successor transform
            if (spec.transform.length > 1) {
                const dbTransforms = []
                var skip = false;
                for (var i = 1; i < spec.transform.length; i++) {
                    
                    spec.transform[i].name = spec.transform[i].type + 'Transform' + transformCounter++
                    dataRewrite(table, spec.transform[i], db, dbTransforms, newData)
                    if (skip) break // skip the aggregate follwing bin
                }
                
                dataSpec[index].transform = dbTransforms
            }
            continue;
            
        }
        
        // sourced transform
        if (spec.transform && spec.transform.length > 0 && dbTransformInd.length > 0) {
            
            const dbTransforms = []
            var skip = false;
            for (const [index, transform] of spec.transform.entries()) {
                
                transform.name = transform.type + 'Transform' + transformCounter++
                for (const ind of dbTransformInd) {
                    if (spec.source && spec.source === dataSpec[ind].name) {
                        // console.log(dataSpec[ind].transform[0])
                        table = dataSpec[ind].transform[0].relation
                        delete spec.source
                    }
                }
                
                skip = dataRewrite(table, transform, db, dbTransforms, newData)
                if (skip) {
                    dbTransforms.push(...spec.transform.slice(index))
                    break
                }
            }
            
            if (dbTransforms.length > 0) {
                dataSpec[index].transform = dbTransforms
            } else {
                dbTransformInd.push(index)
            }
            // console.log(dbTransforms, index)
            
        }
    }
    
    // remove the original "dbtransform" transform that indicating using db
    for (var i = dbTransformInd.length - 1; dataSpec.length > 1 && i >= 0; i--) {
        console.log(i)
        console.log(dataSpec[dbTransformInd[i]], "remove")
        dataSpec.splice(dbTransformInd[i], 1);
    }
    
    // console.log(newData, "newdata")
    vgSpec.data = newData.concat(dataSpec)
    console.log(vgSpec)
    return vgSpec
}

export function dataRewrite(tableName: string, transform: Transforms, db: string, dbTransforms, newData) {
    
    if (transform.type === "extent") {
        // converting signal to a new data item
        var query = null;
        
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
                },
                signal:transform.signal
            }]
        })
        
    }
    
    else if (transform.type === "bin") {
        // TODO: need to include previous queries like in crossfilter
        var prev = dbTransforms.pop() ?? null // null or a dbtransform
        tableName = prev ? `(${prev.query.signal.slice(1, -1)}) ${prev.name}` : tableName

        const maxbins = transform.maxbins ? transform.maxbins : 10
        let extent = {}
        
        if (transform.extent.hasOwnProperty("signal")) {
            // geting "extent" from the data item that converted from signal
            const name = transform.extent["signal"]
            extent["signal"] = `[data('${name}')[0]['min'], data('${name}')[0]['max']]`
        } else if (Array.isArray(transform.extent)){
            // extent is assigned explicitly as the array [min, max]
            extent = transform.extent
        } 
        
        var query = null;
        let bin_name = `bin_${newData.length}`
        let bin_signal = transform.signal? transform.signal : bin_name
        let bin0 = transform.as? transform.as[0] : "bin0"
        let bin1 = transform.as? transform.as[1] : "bin1"
        
        if (transform.field.hasOwnProperty("signal")) {
            
            // query = `" select bin0 +" + ${bin_name}.step + " as bin1 , * from (select " + bins.step + " * floor(cast( " + ${transform.field['signal']} + " as float)/" + bins.step + ") as bin0, * from ${tableName} where " + ${transform.field['signal']} + " between " + bins.start + " and " + bins.stop + ") as sub "+ " UNION ALL select NULL as bin0, NULL as bin1, * from ${tableName} where " + ${transform.field['signal']} + " is null"`
            query = `" select ${bin0} +" + ${bin_signal}.step + " as ${bin1}, * from (select " + ${bin_signal}.start + " + " + ${bin_signal}.step + " * floor((cast( " + ${transform.field['signal']} + " as float) - " + ${bin_signal}.start + ")/" + ${bin_signal}.step + ") as ${bin0}, * from ${tableName} where " + ${transform.field['signal']} + " between " + ${bin_signal}.start + " and " + ${bin_signal}.stop + ") as sub "`            
        } else {
            
            // query = `" select bin0 +" + ${bin_signal}.step + " as bin1, * from (select " + ${bin_signal}.step + " * floor(cast(${transform.field} as float)/" + ${bin_signal}.step + ") as bin0, * from ${tableName} where ${transform.field} between " + ${bin_signal}.start + " and " + ${bin_signal}.stop + ") as sub "+ " UNION ALL select NULL as bin0, NULL as bin1, * from ${tableName} where ${transform.field} is null"`
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
                    nice: true
                }
            ]
        })
        
        dbTransforms.push({
            type: "dbtransform",
            alias: bin_name,
            query: {
                signal: query
            }
        })
        
    }
    
    else if (transform.type === "aggregate") {
        var prev = dbTransforms.pop() ?? null // null or a dbtransform
        
        dbTransforms.push({
            type: "dbtransform",
            name: transform['name'],
            query: {
                signal: aggregateTransformToSql(tableName, transform, db, prev)
            }
        })
    }
    
    else if (transform.type === "filter") {
        var prev = dbTransforms.pop() ?? null // null or a dbtransform
        let sql = filterTransformToSql(tableName, transform, db, prev)

        if (sql === null) {
            console.log("skip")
            return true
        }
        
        dbTransforms.push({
            type: "dbtransform",
            name: transform['name'],
            query: {
                signal: sql
            }
        })
    }
    
    else if (transform.type === 'project') {
        var prev = dbTransforms.pop() ?? null // null or a dbtransform
        
        dbTransforms.push({
            type: "dbtransform",
            name: transform['name'],
            query: {
                signal: projectTransformToSql(tableName, transform, db, prev)
            }
        })
        
    }
    
    else if (transform.type === 'stack') {
        var prev = dbTransforms.pop() ?? null // null or a dbtransform
        
        dbTransforms.push({
            type: "dbtransform",
            name: transform['name'],
            query: {
                signal: stackTransformToSql(tableName, transform, db)
            }
        })
        dbTransforms.push({
            type: "formula",
            expr: `datum.y1 - datum.${transform.field}`,
            as: transform.as ? transform.as[0] : "y0"
        })
    }
    
    else if (transform.type === 'collect') {
        dbTransforms.push({
            type: "dbtransform",
            name: transform['name'],
            query: {
                signal: collectTransformToSql(tableName, transform, db)
            }
        })
    }

    else {
        // TODO: 
        dbTransforms.push(transform)
    }
    
}
