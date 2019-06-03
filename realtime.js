"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const WebSocket = require("ws");
const fs = require("fs");
const path = require("path");
const poller_1 = require("./poller");
const POLL_FREQUENCY = 500; //ms
const MAX_VALUES_TO_KEEP_IN_MEMORY = 10000;
class WebsocketClientManager {
    constructor(wss) {
        this.wss = wss;
        this.webClients = [];
        let self = this;
        wss.on('connection', function connection(ws, req) {
            self.webClients.push(ws);
        });
        wss.on('close', function (ws) {
            let idx = self.webClients.indexOf(ws);
            if (idx > -1)
                self.webClients.slice(idx, 1);
        });
    }
    notifyClients(data) {
        for (const client of this.webClients) {
            try {
                if (client.readyState == WebSocket.OPEN)
                    client.send(JSON.stringify(data));
            }
            catch (err) {
            }
        }
    }
}
function realtime(app, wss, DATA_FILE_BASEPATH) {
    let clientManager = new WebsocketClientManager(wss);
    var poller = null;
    var filename = "";
    var fileStream = null;
    app.get("/realtime/data", (res, resp) => {
        let curState = poller == null ? "Unconfigured" : (poller.isRunning() ? "Running" : "Stopped");
        resp.json({
            state: curState,
            hostname: poller == null ? "" : poller.getHostName(),
            filename: filename,
            data: poller == null ? [] : poller.getValues(),
            files: getFiles()
        });
    });
    function getFiles() {
        return fs.readdirSync(DATA_FILE_BASEPATH).filter(file => file.toLowerCase().endsWith(".csv"));
    }
    app.post("/realtime/setup", (req, resp) => {
        let hostname = req.body.hostname;
        filename = req.body.filename;
        if (poller != null) {
            poller.off("poll", onValuePolled);
            poller.off("error", onPollError);
            poller.stop();
        }
        poller = new poller_1.Poller(hostname, POLL_FREQUENCY, MAX_VALUES_TO_KEEP_IN_MEMORY);
        poller.on("poll", onValuePolled);
        poller.on("error", onPollError);
        if (filename != null && filename != "") {
            filename = filename.replace(/[/\\?%*:|"<>]/g, '-'); // remove any invalid characters
        }
        resp.json({ success: true, state: "Stopped" });
    });
    function onValuePolled(value) {
        if (fileStream != null && fileStream.writable) {
            let power = value.StatusSNS.ENERGY.Voltage * value.StatusSNS.ENERGY.Current * value.StatusSNS.ENERGY.Factor;
            fileStream.write(new Date().getTime() + ";" + power.toFixed(2) + ";" + value.StatusSNS.ENERGY.Voltage + ";" + value.StatusSNS.ENERGY.Current + ";" + value.StatusSNS.ENERGY.Factor + "\n");
        }
        clientManager.notifyClients({
            "type": "poll",
            "data": value
        });
    }
    function onPollError(err) {
        console.warn("Unable to poll " + err.message);
    }
    app.post("/realtime/start", (req, resp) => {
        try {
            if (poller != null) {
                poller.start();
                clientManager.notifyClients({
                    "type": "start"
                });
                if (filename != null && filename != "") {
                    let filepath = path.join(DATA_FILE_BASEPATH, filename + ".csv");
                    if (fs.existsSync(filepath))
                        fs.unlinkSync(filepath);
                    fileStream = fs.createWriteStream(filepath, { flags: 'a' });
                }
                resp.json({ success: true, state: "Running" });
            }
            else {
                resp.json({ success: false });
            }
        }
        catch (e) {
            resp.json({ success: false });
        }
    });
    app.post("/realtime/stop", (req, resp) => {
        try {
            if (poller != null) {
                poller.stop();
                clientManager.notifyClients({
                    "type": "stop"
                });
                if (fileStream != null)
                    fileStream.end();
                resp.json({ success: true, state: "Stopped" });
            }
            else {
                resp.json({ success: false });
            }
        }
        catch (e) {
            resp.json({ success: false });
        }
    });
    app.post("/realtime/reset", (req, resp) => {
        try {
            if (poller != null) {
                poller.reset();
                clientManager.notifyClients({
                    "type": "reset"
                });
                if (filename != null && filename != "") {
                    let filepath = path.join(DATA_FILE_BASEPATH, filename + ".csv");
                    if (fs.existsSync(filepath))
                        fs.unlinkSync(filepath);
                    fileStream = fs.createWriteStream(filepath, { flags: 'a' });
                }
                resp.json({ success: true });
            }
            else {
                resp.json({ success: false });
            }
        }
        catch (e) {
            resp.json({ success: false });
        }
    });
}
exports.realtime = realtime;
//# sourceMappingURL=realtime.js.map