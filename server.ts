import * as cors from 'cors';
import * as bodyParser from 'body-parser';
const { Pool, Client } = require('pg')

// Postgres connection pools.
const pools = {};

// Express server
const express = require('express');
const app = express();
const port = 3000;
app.use(cors());
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json({limit: '20mb', type: 'application/json'}));
app.listen(port, () => console.log(`server listening on port ${port}`));

function poolFor(connectionString: string) {
  if(!(connectionString in pools)) {
    pools[connectionString] = new Pool({connectionString: connectionString});
  }
  return pools[connectionString];
}
function handleError(err: any, res: any) {
  const msg = err.stack ? err.stack.split('\n')[0] : err;
  console.log(msg);
  res.status(400).send(msg);
}

app.post('/query', async (req: any, res: any) => {
  if(!req.body.postgresConnectionString) {
    throw 'request body must define postgresConnectionString property';
  }
  let client: any;
  try {
    if(!req.body.query) {
      throw 'request body must define query property'
    }
    console.log(req.body.postgresConnectionString);
    console.log(req.body.query);
    const pool = poolFor(req.body.postgresConnectionString);
    client = await pool.connect();
    const results = await client.query(req.body.query);
    res.status(200).send(results);
  } catch(err) {
    handleError(err, res);
  } finally {
    if(client) {
      client.release();
    }
  }
});