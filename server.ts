import * as cors from 'cors';
import * as bodyParser from 'body-parser';
const { Pool, Client } = require('pg');
const format = require('pg-format');

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
  let client: any;
  try {
    if(!req.body.postgresConnectionString) {
      throw 'request body must define postgresConnectionString property';
    }
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

function postgresTypeFor(value : any): string {
  // FixMe: want to use INTs too, if possible. Client needs to send more data.
  const type = typeof value;
  if(type === 'string') {
    return 'VARCHAR(256)';
  } else if(type === 'number') {
    return 'FLOAT';
  } else if(type === 'boolean') {
    return 'BOOLEAN';
  } else {
    console.log('ERROR: undefined type: \'' + type + '\'');
  }
}

function postgresSchemaFor(dataObj: any): string {
  const schema: any = {};
  for(var property in dataObj) {
    if(dataObj.hasOwnProperty(property)) {
      const pgType = postgresTypeFor(dataObj[property]);
      schema[property] = postgresTypeFor(dataObj[property]);
    }
  }
  return schema;
}

function createTableQueryStrFor(tableName: string, schema: any): string {
  let out: string = 'CREATE TABLE ' + tableName + '('
  let first: boolean = true;
  for(var attrName in schema) {
    if(!schema.hasOwnProperty(attrName)) {
      continue;
    }
    let attrType: string = schema[attrName];
    if(first) {
      first = false;
    } else {
      out += ', ';
    }
    out += (attrName + ' ' + attrType)
  }
  out += ');';
  return out;
}

function listToSQLTuple(l: any[], keepQuotes: boolean): string {
  let out: string = JSON.stringify(l);
  out = out.substring(1, out.length - 1);
  out = out.replace(/'/g, '\'\'');
  out = out.replace(/"/g, keepQuotes? '\'' : '');
  return out;
}

app.post('/createSql', async (req: any, res: any) => {
  let client: any;
  try {
    if(!req.body.postgresConnectionString) {
      throw 'request body must define postgresConnectionString property';
    }
    if(!req.body.data) {
      throw 'request body must define data property';
    }
    if(!req.body.name) {
      throw 'request body must define name property';
    }

    // Connect to postgres
    const pool = poolFor(req.body.postgresConnectionString);
    client = await pool.connect();

    // Check if table exists yet
    let exists = false;
    const existsQueryStr = 'SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='+
      '\'' + req.body.name.toLowerCase() + '\');'
    const response = await client.query(existsQueryStr);
    if(response.rows[0]['exists']) {
      exists = true;
      console.log('INFO: table ' + req.body.name + ' already exists.');
    } else {
      exists = false;
      console.log('INFO: table ' + req.body.name + ' does not exist');
    }

    const data = JSON.parse(req.body.data);
    const schema: any = postgresSchemaFor(data[0]);

    // Create table if it doesn't exist yet
    if(!exists) {
      console.log('INFO: creating table ' + req.body.name);
      console.log('INFO: built postgres schema: '+JSON.stringify(schema));
      const createTableQueryStr = createTableQueryStrFor(req.body.name, schema);
      console.log('INFO: running create query: ' + createTableQueryStr);  
      await client.query(createTableQueryStr);
    }

    // Insert values
  
    // Build attribute list string e.g. (attr1, attr2, attr3)
    let attrNames: string[] = [];
    for(const attrName in schema) {
      if(!schema.hasOwnProperty(attrName)) {
        continue;
      }
      attrNames.push(attrName);
    }
    const attrNamesStr = listToSQLTuple(attrNames, false);
  
    // Transform data from JSON format into a 2d array where each row is a list of attribute values
    // with the same attribute order as the attribute list string above.
    const rows: any[] = [];
    for(let i: number = 0; i < data.length; i++) {
      const item: any = data[i];
      const row: any[] = [];
      for(let j: number = 0; j < attrNames.length; j++) {
        row.push(item[attrNames[j]]);
      }
      rows.push(row);
    }

    // Execute the insert queries.
    const queryStr = format('INSERT INTO ' + req.body.name + ' (' + attrNamesStr + ') VALUES %L', rows);
    console.log('INFO: running insert queries for ' + req.body.name);
    await client.query(queryStr);
    res.status(200).send();
  } catch(err) {
    handleError(err, res);
  } finally {
    if(client) {
      client.release();
    }
  }
});