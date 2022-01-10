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
var duck_db_js_1 = require("./duck_db.js");
var postgres_db_js_1 = require("./postgres_db.js");
var cors = require('cors');
var express = require('express');
var app = express();
var type = '';
var myArgs = process.argv;
if (myArgs.length > 2 && myArgs[2] == 'pg') {
    type = 'pg';
}
else {
    type = 'duckdb';
}
var Db;
var port = 3000;
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());
app.options('*', cors());
var allowCrossDomain = function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
};
app.use(allowCrossDomain);
app.listen(port, function () { return console.log("server listening on port ".concat(port)); });
if (type == 'pg') {
    Db = new postgres_db_js_1.Postgres_Db();
}
else {
    Db = new duck_db_js_1.Duck_Db();
}
function handleError(err, res) {
    console.log('Here');
    var msg = err.stack ? err.stack.split('\n')[0] : err;
    console.error(msg);
    res.status(400).send(msg);
}
app.post('/query', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var query, results, err_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!req.body.query) {
                    throw 'request body must define query property';
                }
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, 4, 5]);
                query = req.body.query;
                console.log("running query: ".concat(query));
                return [4 /*yield*/, Db.runQuery(query)];
            case 2:
                results = _a.sent();
                if (type == 'pg') {
                    res.status(200).send(results['rows']);
                }
                else {
                    res.status(200).send(results);
                }
                return [3 /*break*/, 5];
            case 3:
                err_1 = _a.sent();
                handleError(err_1, res);
                return [3 /*break*/, 5];
            case 4:
                console.log("Final");
                return [7 /*endfinally*/];
            case 5: return [2 /*return*/];
        }
    });
}); });
app.post('/createSql', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var result, err_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, 4, 5]);
                if (!req.body.data) {
                    throw 'request body must define data property';
                }
                if (!req.body.name) {
                    throw 'request body must define name property';
                }
                return [4 /*yield*/, Db.createTable(req.body)];
            case 1:
                result = _a.sent();
                console.log('Table Created');
                return [4 /*yield*/, Db.InsertTable(req.body)];
            case 2:
                result = _a.sent();
                console.log('insert queries complete');
                result = 'Success';
                res.send({
                    message: {}
                });
                return [3 /*break*/, 5];
            case 3:
                err_2 = _a.sent();
                handleError(err_2, res);
                return [3 /*break*/, 5];
            case 4:
                console.log("Final");
                return [7 /*endfinally*/];
            case 5: return [2 /*return*/];
        }
    });
}); });
