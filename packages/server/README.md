# vega-plus-server
[Vega-plus](https://www.npmjs.com/package/vega-plus) extends the Vega dataflow to a client-server architecture to utilize the scalability advantage of DBMSs, we automatically translate Vega transform operators to SQL queries. To offload intensive calculations to the DBMS, combine vega-plus with one of our customized Vega transform that accepts SQL queries and requests data from a database. 

Vega-plus-server is a lightweight Node.js Express middleware server that forwards requests from a brower client to a DBMS backend (we now support PostgreSQL and DuckDB). The users can use our DBMS wapper API to load datasets and send queries. 

## Usage Instructions

Install the package with

```
yarn add vega-plus-server
```

Here is a complete example that uses `vega-plus-server`. The server exposes two routes, `/createSql` and
`/query`. The route `/createSql` is a utility route used during development and testing that creates and
populates a relation from a list of JSON tuples. The `/query` route forwards an SQL query to a backend database. 

```js
// server.ts
import * as bodyParser from 'body-parser';
import {Duck_Db} from 'vega-plus-server';
import {Postgres_Db} from 'vega-plus-server'
const cors = require('cors');
const express = require('express');
const app = express();

export function run_app() {
    var type = '';
    
    var myArgs = process.argv;
    if (myArgs.length > 2 && myArgs[2] == 'pg') {
        type = 'pg'
    }
    else{
        type = 'duckdb'
    }
    
    var Db;
    const port = 3000;
    
    app.use(bodyParser.json({ limit: '50mb' }));
    app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
    app.use(cors());
    app.options('*', cors());
    var allowCrossDomain = function (req, res, next) {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE');
        res.header('Access-Control-Allow-Headers', 'Content-Type');
        next();
    }
    app.use(allowCrossDomain);
    app.listen(port, () => console.log(`server listening on port ${port}`));
    
    
    if(type=='pg'){
        Db = new Postgres_Db()    
    }
    else{
        Db = new Duck_Db();
    }
    
    function handleError(err: any, res: any) {
        console.log('Here')
        const msg = err.stack ? err.stack.split('\n')[0] : err;
        console.error(msg);
        res.status(400).send(msg);
    }
    
    app.post('/query', async (req: any, res: any) => {
        if (!req.body.query) {
            throw 'request body must define query property'
        }
        try {
            var query = req.body.query;
            console.log(`running query: ${query}`);
            var results =await Db.runQuery(query);
            if (type=='pg'){
                res.status(200).send(results['rows']);
            }
            else {
                res.status(200).send(results);
            }
            
        } catch (err) {
            handleError(err, res);
        } finally {
            console.log("Final");
        }
        
    })
    
    
    app.post('/createSql', async (req: any, res: any) => {
        try {
            if (!req.body.data) {
                throw 'request body must define data property';
            }
            if (!req.body.name) {
                throw 'request body must define name property';
            }
            var result = await Db.createTable(req.body)
            console.log('Table Created')
            result = await Db.InsertTable(req.body)
            console.log('insert queries complete')
            result = 'Success'
            res.send({
                message: {}
            })
        } catch (err) {
            handleError(err, res);
        } finally {
            console.log("Final");
        }
    });
}

```
Copy over and run this server example with 
```
tsc --esModuleInterop server.ts
node server.js pg
```
Or you can import and use our default server code equavalent to the above example using our `run_server()` function. 

## API Reference
<a name="run_server" href="#run_server">#</a>
<b>run_server</b>(<i>type: string = "pg"</i>)
* type: a string indicating which DBMS to use. We currently support PostgreSQL("pg") and DuckDB("duckdb"). And the defualt type is "pg".

To be continue with the DB wrapper API...