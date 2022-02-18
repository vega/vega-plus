function ExtentOpToSql(op, prev) {
    const sql = 
        `"(SELECT min(${op.params.field.$field}) as min, max(${op.params.field.$field}) as max \
        FROM ( " + _["$prev"] + ") query_${prev})"`;
   
    return sql
}

function scaleExtent2sql(operators, ref, counter) {
    console.log("extent for scale")

    // find the data source
    let pulse_id = ref.params.pulse.$ref
    let pulse = operators[pulse_id - 1]

    if (pulse.type === "dbtransform") {
        // find the query Object of the data source
        let query_id = pulse.params.query.$ref
        let query = operators[query_id - 1]

        // insert an query string Object
        var prev_query = JSON.parse(JSON.stringify(query));
        prev_query.id = counter++
        prev_query.params['$prev'] = {$ref: query_id}
        operators.push(prev_query)

        let extent_sql = ExtentOpToSql(ref, prev_query.id)
        prev_query.update.code = extent_sql

        // turn extent into a dbtransform
        var new_extent = JSON.parse(JSON.stringify(pulse));
        new_extent.id = ref.id
        new_extent.params.query.$ref = prev_query.id
        new_extent.params.toArray = true

        operators.splice(ref.id - 1, 1, new_extent)
    }

    return counter
}

export function runtimeRewrite(runtime) {
    // deal with transforms generated for scales
    var operators = runtime.operators
    var counter = operators.length

    for (const [ind, op] of operators.entries()) {

        if (op.type === "scale") {
            let ref_id = op.params.domain.$ref
            let ref = operators[op.params.domain.$ref - 1]

            if (ref.id != ref_id) {
                console.log("wrong ref")
            } else {
                if (ref.type === "extent") {
                    counter = scaleExtent2sql(operators, ref, counter)
                }
            }
        }
    }


    return runtime
}