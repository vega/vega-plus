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
            for (const transform of spec.transform) {
                
                transform.name = transform.type + 'Transform' + transformCounter++
                for (const ind of dbTransformInd) {
                    if (spec.source && spec.source === dataSpec[ind].name) {
                        // console.log(dataSpec[ind].transform[0])
                        table = dataSpec[ind].transform[0].relation
                        delete spec.source
                    }
                }
                
                dataRewrite(table, transform, db, dbTransforms, newData)
                if (skip) break
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
        //console.log(dataSpec[i])
        dataSpec.splice(i, 1);
    }
    
    // console.log(newData, "newdata")
    vgSpec.data = newData.concat(dataSpec)
    
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
                }
            }]
        })
        
    }
    
    else if (transform.type === "bin") {
        const maxbins = transform.maxbins ? transform.maxbins : 10
        let extent = {}
        
        if (transform.extent.hasOwnProperty("signal")) {
            // getting "extent" from the data item that converted from signal
            const name = transform.extent["signal"]
            extent["signal"] = `[data('${name}')[0]['min'], data('${name}')[0]['max']]`
        } else {
            // extent is assigned explicitly as [min, max]
            extent = transform.extent
        }
        
        var query = null;
        
        if (transform.field.hasOwnProperty("signal")) {
            
            query = `" select bin0 +" + bins.step + " as bin1 , * from (select " + bins.step + " * floor(cast( " + ${transform.field['signal']} + " as float)/" + bins.step + ") as bin0, * from ${tableName} where " + ${transform.field['signal']} + " between " + bins.start + " and " + bins.stop + ") as sub "+ " UNION ALL select NULL as bin0, NULL as bin1, * from ${tableName} where " + ${transform.field['signal']} + " is null"`
            
            query = `" select bin0 +" + bins.step + " as bin1 , * from (select " + bins.step + " * floor(cast( " + ${transform.field['signal']} + " as float)/" + bins.step + ") as bin0, * from ${tableName} where " + ${transform.field['signal']} + " between " + bins.start + " and " + bins.stop + ") as sub "`
            
        } else {
            
            query = `" select bin0 +" + bins.step + " as bin1 , * from (select " + bins.step + " * floor(cast(${transform.field} as float)/" + bins.step + ") as bin0, * from ${tableName} where ${transform.field} between " + bins.start + " and " + bins.stop + ") as sub "+ " UNION ALL select NULL as bin0, NULL as bin1, * from ${tableName} where ${transform.field} is null"`
            
        }
        
        newData.push({
            name: "bin",
            transform: [
                {
                    type: "bin",
                    field: null,
                    signal: "bins",
                    maxbins: maxbins,
                    extent: extent
                }
            ]
        })
        
        dbTransforms.push({
            type: "dbtransform",
            name: transform['name'],
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
        
        dbTransforms.push({
            type: "dbtransform",
            name: transform['name'],
            query: {
                signal: filterTransformToSql(tableName, transform, db, prev)
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
    
}
