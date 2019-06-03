import { EventEmitter } from "events";
import * as http from "http";

interface Energy {
    Total: number;
    Yesterday: number;
    Today: number;
    Power: number;
    Factor: number;
    Voltage: number;
    Current: number;
}

interface SNS {
    Time: Date;
    ENERGY: Energy
}
export interface PollStatus {
    StatusSNS: SNS;
}

export class Poller extends EventEmitter {

    private values: PollStatus[] = [];
    private timer: NodeJS.Timer;
    private readyToPoll: boolean = true;

    constructor(private hostname: string, private pollInterval: number, private maxValuesToKeep: number) {
        super();
    }

    getHostName(): string {
        return this.hostname;
    }

    isRunning(): boolean {
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

    private poll() {
        if (!this.readyToPoll)
            return;
        this.readyToPoll = false;
        try {
            http.get("http://" + this.hostname + "/cm?cmnd=Status%208", (res: http.IncomingMessage) => {
                try {
                    let data = '';
                    res.on('data', (chunk) => {
                        data += chunk;
                    });

                    res.on('end', () => {
                        var obj: PollStatus = JSON.parse(data);
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
