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
exports.Postgres_Db = void 0;
var Pool = require('pg').Pool;
var format = require('pg-format');
var Postgres_Db = /** @class */ (function () {
    function Postgres_Db() {
        this.pool = new Pool({
            user: 'postgres',
            host: 'localhost',
            database: 'scalable_vega',
            password: 'postgres',
            port: 5432
        });
    }
    Postgres_Db.prototype.TypeFor = function (value) {
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
    };
    Postgres_Db.prototype.listToSQLTuple = function (l, keepQuotes) {
        var out = JSON.stringify(l);
        out = out.substring(1, out.length - 1);
        out = out.replace(/'/g, '\'\'');
        out = out.replace(/"/g, keepQuotes ? '\'' : '');
        return out;
    };
    Postgres_Db.prototype.SchemaFor = function (dataObj) {
        var schema = {};
        for (var property in dataObj) {
            if (dataObj.hasOwnProperty(property)) {
                schema[property] = this.TypeFor(dataObj[property]);
            }
        }
        return schema;
    };
    Postgres_Db.prototype.createTableQueryStrFor = function (tableName, schema) {
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
    };
    Postgres_Db.prototype.createTable = function (body) {
        return __awaiter(this, void 0, void 0, function () {
            var data, schema, createTableQueryStr;
            var _this = this;
            return __generator(this, function (_a) {
                data = JSON.parse(body.data);
                schema = this.SchemaFor(data[0]);
                createTableQueryStr = this.createTableQueryStrFor(body.name, schema);
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        _this.pool.query(createTableQueryStr, function (err) {
                            console.log("create table");
                            if (err) {
                                reject(err);
                            }
                            else {
                                resolve(_this);
                            }
                        });
                    })];
            });
        });
    };
    Postgres_Db.prototype.importDatafile = function (name, filePath) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        console.log("import csv file");
                        _this.pool.query("CREATE TABLE ".concat(name, " AS SELECT * FROM read_csv_auto('").concat(filePath, "');"), function (err) {
                            if (err) {
                                reject(err);
                            }
                            else {
                                resolve(_this);
                            }
                        });
                    })];
            });
        });
    };
    Postgres_Db.prototype.getRows = function (name) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        _this.pool.query("SELECT * from ".concat(name), function (err, rows) {
                            if (err) {
                                reject(err);
                            }
                            else {
                                resolve(rows);
                            }
                        });
                    })];
            });
        });
    };
    Postgres_Db.prototype.runQuery = function (sql, params) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        _this.pool.query(sql, params, function (err, result) {
                            if (err) {
                                reject(err);
                            }
                            else {
                                resolve(result);
                            }
                        });
                    })];
            });
        });
    };
    Postgres_Db.prototype.InsertTable = function (body) {
        return __awaiter(this, void 0, void 0, function () {
            var data, schema, attrNames, attrName, attrNamesStr, rows, i, item, row, j, queryStr;
            var _this = this;
            return __generator(this, function (_a) {
                data = JSON.parse(body.data);
                schema = this.SchemaFor(data[0]);
                attrNames = [];
                console.log('Here1');
                for (attrName in schema) {
                    if (!schema.hasOwnProperty(attrName)) {
                        continue;
                    }
                    attrNames.push(attrName);
                }
                console.log('Here2');
                attrNamesStr = this.listToSQLTuple(attrNames, false);
                rows = [];
                for (i = 0; i < data.length; i++) {
                    item = data[i];
                    row = [];
                    for (j = 0; j < attrNames.length; j++) {
                        row.push(item[attrNames[j]]);
                    }
                    rows.push(row);
                }
                console.log('Here3');
                queryStr = format('insert into ' + body.name + ' (' + attrNamesStr + ') values %L', rows);
                console.log('running insert queries for ' + body.name);
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        _this.pool.query(queryStr, function (err) {
                            if (err) {
                                reject(err);
                            }
                            else {
                                resolve(_this);
                            }
                        });
                    })];
            });
        });
    };
    return Postgres_Db;
}());
exports.Postgres_Db = Postgres_Db;
