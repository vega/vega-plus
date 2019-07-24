import * as cors from 'cors';
import * as bodyParser from 'body-parser';

// PostgreSQL client initialization
const format = require('pg-format')
const pg = require('pg');
const pghost = 'localhost';
const pgport = '5432';
const pgdb = 'voyager';
const connectionString = 'postgres://' + pghost + ':' + pgport + '/' + pgdb;
console.log('Connecting to ' + connectionString);
const pgclient = new pg.Client(connectionString);
pgclient.connect(err => {
  if (err) {
    console.log(`Could not connect to pg: ${err}`);
    return;
  }
  console.log(`Connected to pg`);
});

// Express server
const express = require('express');
const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({ limit: '20mb', type: 'application/json' }));

app.listen(port, () => console.log(`Example app listening on port ${port}!`));

app.post('/query', (req: any, res: any) => {
  console.log(req.body.query);
  const query = pgclient.query(req.body.query, (err: any, results: any) => {
    if (err) {
      console.error(err);
      res.status(500).send(err);
    } else {
      res.status(200).send(results);
    }
  });
});