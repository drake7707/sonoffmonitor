"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const WebSocket = require("ws");
const realtime_1 = require("./realtime");
const analysis_1 = require("./analysis");
const HTTP_PORT = 3000;
const DATA_FILE_BASEPATH = "./";
const app = express();
app.use(express.static('wwwroot'));
app.use(express.json());
const server = app.listen(HTTP_PORT);
const wss = new WebSocket.Server({ server });
realtime_1.realtime(app, wss, DATA_FILE_BASEPATH);
analysis_1.analysis(app, DATA_FILE_BASEPATH);
//# sourceMappingURL=index.js.map