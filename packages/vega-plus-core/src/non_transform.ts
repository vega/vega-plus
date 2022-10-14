export function vegaNonTransformToSql(tableName: string, markFields: string[]) {
    let out = `SELECT `;
    for (const [fieldIdx, field] of markFields.entries()) {
        if (fieldIdx !== 0) {
            out += ", "
        }
        out += field;
    }
    out += ` FROM ${tableName}`;
    return `"${out}"`;
}

export function collectNonTransformFields(dataName: string, marks: any) {

    // TODO: this was for dataflow, need to be changed to work for specs
    const fields: string[] = []
    for (const [index, mark] of marks.entries()) {
        if (mark.encode && mark.encode.enter && mark.from && mark.from.data === dataName) {
            for (var key of Object.keys(mark.encode.enter)) {
                if (mark.encode.enter[key].field) { fields.push(mark.encode.enter[key].field) }
            }
        }
    }
    return fields
}