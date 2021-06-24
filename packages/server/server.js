"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var bodyParser = require("body-parser");
var Pool = require('pg').Pool;
var format = require('pg-format');
var duckdb = require('duckdb');
var MapdCon = require("@mapd/connector/dist/node-connector.js").MapdCon;
var express = require('express');
var app = express();
var port = 3000;
// app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
// Cache Work
var cache_map = new Map();
var queries = [];
var count_queries = 0;
var max_cache = 8;
// Setup Databases
var db = new duckdb.Database('./database/scalable-vega.db');
var pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'scalable_vega',
    password: 'postgres',
    port: 5432
});
var connector = new MapdCon();
var defaultQueryOptions = {};
// User Preference for DB
var myArgs = process.argv;
if (myArgs.length > 2 && myArgs[2] == 'pg') {
    var flag = 1;
}
else if (myArgs.length > 2 && myArgs[2] == 'omni') {
    var flag = 2;
    var hostname = "localhost";
    var protocol = "http";
    var port_1 = "6278";
    var database = "omnisci";
    var username = "admin";
    var password = "HyperInteractive";
    connector
        .protocol(protocol)
        .host(hostname)
        .port(port_1)
        .dbName(database)
        .user(username)
        .password(password);
}
else {
    var flag = 0;
}
app.listen(port, function () { return console.log("server listening on port " + port); });
function handleError(err, res) {
    var msg = err.stack ? err.stack.split('\n')[0] : err;
    console.error(msg);
    res.status(400).send(msg);
}
function cache_storage(key, value) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            if (count_queries < max_cache) {
                queries.push(key);
                cache_map.set(key, value);
                count_queries += 1;
            }
            else {
                cache_map["delete"](queries[0]);
                queries = queries.slice(1, max_cache + 2);
                queries.push(key);
                cache_map.set(key, value);
            }
            return [2 /*return*/];
        });
    });
}
app.post('/query', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var client, query_1, results_q, results, err_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 10, 11, 12]);
                if (!req.body.query) {
                    throw 'request body must define query property';
                }
                query_1 = req.body.query;
                results_q = cache_map.get(query_1);
                console.log(results_q);
                if (!queries.includes(query_1)) return [3 /*break*/, 1];
                console.log('Cache in play');
                res.status(200).send(results_q);
                return [3 /*break*/, 9];
            case 1:
                console.log('Cache not in play');
                if (!(flag == 1)) return [3 /*break*/, 4];
                return [4 /*yield*/, pool.connect()];
            case 2:
                client = _a.sent();
                return [4 /*yield*/, client.query(query_1)];
            case 3:
                results = _a.sent();
                cache_storage(query_1, results['rows']);
                res.status(200).send(results['rows']);
                client.release();
                return [3 /*break*/, 9];
            case 4:
                if (!(flag == 2)) return [3 /*break*/, 6];
                return [4 /*yield*/, connector
                        .connectAsync().then(function (session) {
                        return Promise.all([
                            session.queryAsync(query_1, defaultQueryOptions)
                        ]);
                    }).then(function (values) {
                        cache_storage(query_1, values[0]);
                        res.status(200).send(values[0]);
                    })["catch"](function (error) {
                        console.error("Something bad happened: ", error);
                    })];
            case 5:
                _a.sent();
                return [3 /*break*/, 9];
            case 6: return [4 /*yield*/, db.connect()];
            case 7:
                client = _a.sent();
                return [4 /*yield*/, client.all(query_1, function (err, results) {
                        if (err) {
                            throw err;
                        }
                        cache_storage(query_1, results);
                        res.status(200).send(results);
                    })];
            case 8:
                _a.sent();
                _a.label = 9;
            case 9: return [3 /*break*/, 12];
            case 10:
                err_1 = _a.sent();
                handleError(err_1, res);
                return [3 /*break*/, 12];
            case 11:
                console.log("Final");
                return [7 /*endfinally*/];
            case 12: return [2 /*return*/];
        }
    });
}); });
function postgresTypeFor(value) {
    // FixMe: want to use INTs too, if possible.
    // Client needs to send more type data in this case.
    var type = typeof value;
    if (type === 'string') {
        return 'VARCHAR(256)';
    }
    else if (type === 'number') {
        return 'FLOAT';
    }
    else if (type === 'boolean') {
        return 'BOOLEAN';
    }
    else {
        throw 'undefined type: \'' + type + '\'';
    }
}
function postgresSchemaFor(dataObj) {
    var schema = {};
    for (var property in dataObj) {
        if (dataObj.hasOwnProperty(property)) {
            schema[property] = postgresTypeFor(dataObj[property]);
        }
    }
    return schema;
}
function createTableQueryStrFor(tableName, schema) {
    var out = 'create table ' + tableName + '(';
    var first = true;
    for (var attrName in schema) {
        if (!schema.hasOwnProperty(attrName)) {
            continue;
        }
        var attrType = schema[attrName];
        if (first) {
            first = false;
        }
        else {
            out += ', ';
        }
        out += (attrName + ' ' + attrType);
    }
    out += ');';
    return out;
}
function listToSQLTuple(l, keepQuotes) {
    var out = JSON.stringify(l);
    out = out.substring(1, out.length - 1);
    out = out.replace(/'/g, '\'\'');
    out = out.replace(/"/g, keepQuotes ? '\'' : '');
    return out;
}
app.post('/createSql', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var client, exists, existsQueryStr, response, err_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 7, 8, 9]);
                if (!req.body.data) {
                    throw 'request body must define data property';
                }
                if (!req.body.name) {
                    throw 'request body must define name property';
                }
                exists = false;
                existsQueryStr = 'select exists(select 1 from information_schema.tables where 		table_name=' +
                    '\'' + req.body.name.toLowerCase() + '\');';
                console.log(existsQueryStr);
                if (!(flag == 1)) return [3 /*break*/, 3];
                return [4 /*yield*/, pool.connect()];
            case 1:
                client = _a.sent();
                return [4 /*yield*/, client.query(existsQueryStr)];
            case 2:
                response = _a.sent();
                if (response.rows[0]['exists']) {
                    exists = true;
                    console.log('table ' + req.body.name + ' already exists');
                }
                else {
                    exists = false;
                    console.log('table ' + req.body.name + ' does not exist');
                }
                create_table(req, client, exists, res);
                return [3 /*break*/, 6];
            case 3:
                if (!(flag == 0)) return [3 /*break*/, 6];
                return [4 /*yield*/, db.connect()];
            case 4:
                client = _a.sent();
                return [4 /*yield*/, client.all('select * from ' + req.body.name.toLowerCase(), function (err, results) {
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
                    })];
            case 5:
                _a.sent();
                _a.label = 6;
            case 6: return [3 /*break*/, 9];
            case 7:
                err_2 = _a.sent();
                handleError(err_2, res);
                return [3 /*break*/, 9];
            case 8:
                if (flag == 1) {
                    if (client) {
                        client.release();
                    }
                }
                else {
                    console.log("Final");
                }
                return [7 /*endfinally*/];
            case 9: return [2 /*return*/];
        }
    });
}); });
function create_table(req, client, exists, res) {
    return __awaiter(this, void 0, void 0, function () {
        var data, schema, createTableQueryStr, attrNames, attrName, attrNamesStr, rows, i, item, row, j, queryStr;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    data = JSON.parse(req.body.data);
                    schema = postgresSchemaFor(data[0]);
                    if (!!exists) return [3 /*break*/, 8];
                    console.log('creating table ' + req.body.name);
                    console.log('built postgres schema: ' + JSON.stringify(schema));
                    createTableQueryStr = createTableQueryStrFor(req.body.name, schema);
                    console.log('running create query: ' + createTableQueryStr);
                    if (!(flag == 1)) return [3 /*break*/, 2];
                    return [4 /*yield*/, client.query(createTableQueryStr)];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, client.run(createTableQueryStr)];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4:
                    attrNames = [];
                    for (attrName in schema) {
                        if (!schema.hasOwnProperty(attrName)) {
                            continue;
                        }
                        attrNames.push(attrName);
                    }
                    attrNamesStr = listToSQLTuple(attrNames, false);
                    rows = [];
                    for (i = 0; i < data.length; i++) {
                        item = data[i];
                        row = [];
                        for (j = 0; j < attrNames.length; j++) {
                            row.push(item[attrNames[j]]);
                        }
                        rows.push(row);
                    }
                    queryStr = format('insert into ' + req.body.name + ' (' + attrNamesStr + ') values %L', rows);
                    console.log('running insert queries for ' + req.body.name);
                    if (!(flag == 1)) return [3 /*break*/, 6];
                    return [4 /*yield*/, client.query(queryStr)];
                case 5:
                    _a.sent();
                    return [3 /*break*/, 8];
                case 6: return [4 /*yield*/, client.run(queryStr)];
                case 7:
                    _a.sent();
                    _a.label = 8;
                case 8:
                    console.log('insert queries complete');
                    res.status(200).send();
                    return [2 /*return*/];
            }
        });
    });
}
