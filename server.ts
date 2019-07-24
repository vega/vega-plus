import * as cors from 'cors';

// PostgreSQL client initialization
const format = require('pg-format')
const pg = require('pg');
const pghost = 'localhost';
const pgport = '5432';
const pgdb = 'vega';
const connectionString = 'postgres://' + pghost + ':' + pgport + '/' + pgdb;
console.log('Connecting to ' + connectionString);
const client = new pg.Client(connectionString);
client.connect(err => {
  if (err) {
    console.log(`Could not connect to pg: ${err}`);
    return;
  }
  console.log(`Connected to pg`);
});

const express = require('express');
const app = express();
const port = 3000;

app.use(cors());
app.get('/', (req, res) => {
  console.log('got request'); res.send('Hello World!')
});
app.listen(port, () => console.log(`Example app listening on port ${port}!`));
