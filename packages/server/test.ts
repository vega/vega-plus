const {Pool} = require('pg');

async function pg_explain(pool, query, params = null) {
    return new Promise((resolve, reject) => {
        pool.query(query, params, (err: Error, result: Record<string, unknown>[],) => {
          if (err) {
            reject(err)
          } else {
             resolve(result['rows'][0]['QUERY PLAN'][0]['Plan'])
          }
        })
      })
}

var pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'scalable_vega',
    password: 'postgres',
    port: 5432,
});
var test_query = 'EXPLAIN (FORMAT JSON) SELECT * FROM cars;';

var temp = pg_explain(pool, test_query);
temp.then(function(result) {
    console.log(result['Total Cost'], result['Plan Rows']) // "Some User token"   
 })
 pool.end();