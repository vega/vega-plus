import {FilterTransform, None} from "vega";
import { parseExpression } from "vega-expression";

export const filterTransformToSql = (tableName: string, transform: FilterTransform, db: string, prev: any) => {
    function parse(str) {
        return parseExpression(str);
    }
    const filter = expr2sql(parse(transform.expr))
    if (filter === null) {
        console.log("return null")
        return null
    }
    tableName = prev ? `(${prev.query.signal.slice(1, -1)}) ${prev.alias}` : tableName
    
    const sql =
    `"SELECT * \
    FROM ${tableName} \
    WHERE ${filter}"`
    
    return sql
}

function expr2sql(expr) {
    var memberDepth = 0
    var invalid = false

    function visit(ast) {
        var generator = Generators[ast.type];
        if (generator == null) {
            invalid = true
            console.log('Unsupported type: ' + ast.type);
            return
        }
        return generator(ast);
    }
    const Generators = {
        Literal: n => n.raw,
        
        Identifier: n => {
            const id = n.name;
            if (memberDepth > 0) {
                return id;
            }
        },
        
        MemberExpression: n => {
            const d = !n.computed,
            o = visit(n.object);
            if (d) memberDepth += 1;
            const p = visit(n.property);
            
            if (d) memberDepth -= 1;
            return p;
        },
        
        BinaryExpression: n => {
            const right = visit(n.right)
            if (right === 'null') {
                n.operator = (n.operator === '==' || n.operator === '===') ? 'IS' : 'IS NOT'
            } else {
                if (n.operoter === '==' || n.operoter === '===') {
                    n.operator = '='
                } else if (n.operator === '!=' || n.operator === '!==') {
                    n.operator = '!='
                }
            }
            return visit(n.left) + ' ' + n.operator + ' ' + right
        },
        
        LogicalExpression: n => {
            n.operator = n.operator === '&&' ? 'AND' : 'OR'
            return visit(n.left) + ' ' + n.operator + ' ' + visit(n.right)
        }
        
    };
    let expr_str = visit(expr)

    return invalid? null : expr_str
}