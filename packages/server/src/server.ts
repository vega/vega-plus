import * as bodyParser from 'body-parser';
import {Duck_Db} from './duck_db';
import {Postgres_Db} from './postgres_db'
const cors = require('cors');
const express = require('express');
const app = express();

export function run_server(type:string = "pg") {
    if (!["pg", "duckdb"].includes(type.toLowerCase())) {
        console.log("DBMS not supported!");
        return
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
