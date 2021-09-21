import * as bodyParser from 'body-parser';
const { Pool } = require('pg');
const format = require('pg-format');
const duckdb = require('duckdb');
const { MapdCon } = require("@mapd/connector/dist/node-connector.js");
const cors = require('cors');


const express = require('express');
const app = express();
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
// Setup Databases
var db = new duckdb.Database('./database/scalable-vega.db');
const pool = new Pool({
	user: 'postgres',
	host: 'localhost',
	database: 'scalable_vega',
	password: 'postgres',
	port: 5432,
});
const connector = new MapdCon();
const defaultQueryOptions = {};

// User Preference for DB
var myArgs = process.argv;
if (myArgs.length > 2 && myArgs[2] == 'pg') {
	var flag = 1;
}
else if (myArgs.length > 2 && myArgs[2] == 'omni') {
	var flag = 2;
	const hostname = "localhost";
	const protocol = "http";
	const port = "6278";
	const database = "omnisci";
	const username = "admin";
	const password = "HyperInteractive";
	connector
		.protocol(protocol)
		.host(hostname)
		.port(port)
		.dbName(database)
		.user(username)
		.password(password);
}
else {
	var flag = 0;
}

app.listen(port, () => console.log(`server listening on port ${port}`));


function handleError(err: any, res: any) {
	const msg = err.stack ? err.stack.split('\n')[0] : err;
	console.error(msg);
	res.status(400).send(msg);
}

app.post('/query', async (req: any, res: any) => {
	let client: any;
	try {
		if (!req.body.query) {
			throw 'request body must define query property'
		}
		console.log(`connected to ${req.body.postgresConnectionString}`);
		const query = req.body.query;
		console.log(`running query: ${query}`);
		if (flag == 1) {
			client = await pool.connect();
			const results = await client.query(query);
			console.log("Hello", results['rows']);
			res.status(200).send(results['rows']);
		}
		else if (flag == 2) {
			await connector
				.connectAsync().then(session =>
					Promise.all([
						session.queryAsync(query, defaultQueryOptions)
					])).then((values) => {

						console.log(query, values);
						console.log("OmniSciDB", values[0])
						res.status(200).send(values[0]);
					}).catch((error) => {
						console.error("Something bad happened: ", error)
					})
		}
		else {
			client = await db.connect();
			await client.all(query, function (err, results) {
				if (err) {
					throw err;
				}
				console.log("DuckDb", results)
				res.status(200).send(results);
			});
		}
	} catch (err) {
		handleError(err, res);
	} finally {
		if (flag) {
			if (client) {
				client.release();
			}
		}
		console.log("Final");
	}
});



function postgresTypeFor(value: any): string {
	// FixMe: want to use INTs too, if possible.
	// Client needs to send more type data in this case.
	const type = typeof value;
	if (type === 'string') {
		return 'VARCHAR(256)';
	} else if (type === 'number') {
		return 'FLOAT';
	} else if (type === 'boolean') {
		return 'BOOLEAN';
	} else {
		throw 'undefined type: \'' + type + '\'';
	}
}

function postgresSchemaFor(dataObj: any): string {
	const schema: any = {};
	for (var property in dataObj) {
		if (dataObj.hasOwnProperty(property)) {
			schema[property] = postgresTypeFor(dataObj[property]);
		}
	}
	return schema;
}

function createTableQueryStrFor(tableName: string, schema: any): string {
	let out: string = 'create table ' + tableName + '('
	let first: boolean = true;
	for (var attrName in schema) {
		if (!schema.hasOwnProperty(attrName)) {
			continue;
		}
		let attrType: string = schema[attrName];
		if (first) {
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
	out = out.replace(/"/g, keepQuotes ? '\'' : '');
	return out;
}

app.post('/createSql', async (req: any, res: any) => {
	let client: any;
	try {
		if (!req.body.data) {
			throw 'request body must define data property';
		}
		if (!req.body.name) {
			throw 'request body must define name property';
		}

		// Check if table exists yet
		var exists = false;
		const existsQueryStr = 'select exists(select 1 from information_schema.tables where 		table_name=' +
			'\'' + req.body.name.toLowerCase() + '\');'
		console.log(existsQueryStr);
		// Connect to postgres
		if (flag == 1) {
			client = await pool.connect();
			const response = await client.query(existsQueryStr);
			if (response.rows[0]['exists']) {
				exists = true;
				console.log('table ' + req.body.name + ' already exists');
			} else {
				exists = false;
				console.log('table ' + req.body.name + ' does not exist');
			}
			create_table(req, client, exists, res);
		}
		else if (flag == 0) {
			client = await db.connect();
			await client.all('select * from ' + req.body.name.toLowerCase(), function (err, results) {
				if (err) {
					exists = false;
					console.log('table ' + req.body.name + ' does not exist');
				}
				else {
					exists = true;
					console.log('table ' + req.body.name + ' already exists');
				}
				console.log('select * from ' + req.body.name.toLowerCase());
				create_table(req, client, exists, res);
				console.log('Created Table');

			});
		}


	} catch (err) {
		handleError(err, res);
	} finally {
		if (flag == 1) {
			if (client) {
				client.release();
			}
		}
		else {
			console.log("Final");
		}
	}
});


async function create_table(req, client, exists, res) {

	const data = JSON.parse(req.body.data);
	const schema: any = postgresSchemaFor(data[0]);

	// Create table if it doesn't exist yet
	if (!exists) {
		console.log('creating table ' + req.body.name);
		console.log('built postgres schema: ' + JSON.stringify(schema));
		const createTableQueryStr = createTableQueryStrFor(req.body.name, schema);
		console.log('running create query: ' + createTableQueryStr);
		if (flag == 1) {
			await client.query(createTableQueryStr);
		}
		/*		else if (flag==2){
					await connector.connectAsync()
					.then(session =>
					Promise.all([
					session.queryAsync(createTableQueryStr, defaultQueryOptions),
					])
					)
					.then((values) => {
							console.log(values[0])
						})
						.catch((error) => {
							console.error("Something bad happened: ", error)
						})
				} */
		else {
			await client.run(createTableQueryStr);
		}


		// Insert values

		// Build attribute list string e.g. (attr1, attr2, attr3)
		let attrNames: string[] = [];
		for (const attrName in schema) {
			if (!schema.hasOwnProperty(attrName)) {
				continue;
			}
			attrNames.push(attrName);
		}
		const attrNamesStr = listToSQLTuple(attrNames, false);

		// Transform data from JSON format into a 2d array where each row is a list of attribute values
		// with the same attribute order as the attribute list string above.
		const rows: any[] = [];
		for (let i: number = 0; i < data.length; i++) {
			const item: any = data[i];
			const row: any[] = [];
			for (let j: number = 0; j < attrNames.length; j++) {
				row.push(item[attrNames[j]]);
			}
			rows.push(row);
		}

		// Execute the insert queries.
		const queryStr = format('insert into ' + req.body.name + ' (' + attrNamesStr + ') values %L', rows);
		console.log('running insert queries for ' + req.body.name);
		if (flag == 1) {
			await client.query(queryStr);
		}
		/*	else if(flag==2){
			for (let i: number = 0; i < data.length; i++) {
				const item: any = data[i];
				const row: any[] = [];
				for (let j: number = 0; j < attrNames.length; j++) {
					row.push(item[attrNames[j]]);
				}
				var queryStr1 = format('insert into ' + req.body.name + ' (' + attrNamesStr + ') values %L', [row]);
				console.log(queryStr1);
				await connector.connectAsync()
					.then(session =>
					Promise.all([
					session.queryAsync(queryStr1, defaultQueryOptions),
					])
					)
					.then((values) => {
							console.log(values[0])
						})
						.catch((error) => {
							console.error("Something bad happened: ", error)
					});
			}
			} */
		else {
			await client.run(queryStr);
		}
	} // If exists ends here
	console.log('insert queries complete')
	res.status(200).send();
}
