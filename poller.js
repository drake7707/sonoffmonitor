"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const http = require("http");
class Poller extends events_1.EventEmitter {
    constructor(hostname, pollInterval, maxValuesToKeep) {
        super();
        this.hostname = hostname;
        this.pollInterval = pollInterval;
        this.maxValuesToKeep = maxValuesToKeep;
        this.values = [];
        this.readyToPoll = true;
    }
    getHostName() {
        return this.hostname;
    }
    isRunning() {
        return this.timer != null;
    }
    start() {
        if (!this.isRunning())
            this.timer = setInterval(() => this.poll(), this.pollInterval);
    }
    stop() {
        if (this.isRunning()) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
    reset() {
        this.values.splice(0);
    }
    getValues() {
        return this.values;
    }
    poll() {
        if (!this.readyToPoll)
            return;
        this.readyToPoll = false;
        try {
            http.get("http://" + this.hostname + "/cm?cmnd=Status%208", (res) => {
                try {
                    let data = '';
                    res.on('data', (chunk) => {
                        data += chunk;
                    });
                    res.on('end', () => {
                        var obj = JSON.parse(data);
                        obj.StatusSNS.Time = new Date();
                        this.values.push(obj);
                        while (this.values.length > this.maxValuesToKeep)
                            this.values.shift();
                        console.log("Poll OK - V: " + obj.StatusSNS.ENERGY.Voltage + " A: " + obj.StatusSNS.ENERGY.Current + " P: " + obj.StatusSNS.ENERGY.Power + " PF: " + obj.StatusSNS.ENERGY.Factor);
                        this.emit("poll", obj);
                        this.readyToPoll = true;
                    });
                }
                catch (err) {
                    this.emit("error", err);
                    this.readyToPoll = true;
                }
            }).on("error", (err) => {
                this.emit("error", err);
                this.readyToPoll = true;
            });
        }
        catch (err) {
            this.emit("error", err);
            this.readyToPoll = true;
        }
    }
}
exports.Poller = Poller;
//# sourceMappingURL=poller.js.map