import {FilterTransform} from "vega";
import { parseExpression } from "vega-expression";

export const filterTransformToSql = (tableName: string, transform: FilterTransform, db: string, prev: any) => {
    function parse(str) {
        return parseExpression(str);
    }
    const filter = expr2sql(parse(transform.expr))
    tableName = prev ? `(${prev.query.signal.slice(1, -1)}) ${prev.name}` : tableName
    
    const sql =
    `"SELECT * \
    FROM ${tableName} \
    WHERE ${filter}"`
    
    return sql
}

function expr2sql(expr) {
    var memberDepth = 0
    function visit(ast) {
        var generator = Generators[ast.type];
        if (generator == null) console.log('Unsupported type: ' + ast.type);
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
    
    return visit(expr)
}