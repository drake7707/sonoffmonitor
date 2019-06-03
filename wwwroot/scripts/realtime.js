///<reference path="../../poller.ts">
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const MAX_POINTS = 2000;
var chartPower;
var chartVoltage;
var chartAmperage;
var chartPowerFactor;
function setupChart(elementId, type, color, initialData) {
    return Highcharts.chart(elementId, {
        chart: {
            zoomType: 'x',
            animation: false
        },
        title: {
            text: ''
        },
        xAxis: {
            type: 'datetime'
        },
        yAxis: {
            title: {
                text: type
            }
        },
        legend: {
            enabled: false
        },
        plotOptions: {
            area: {
                fillOpacity: 0.5,
                marker: {
                    enabled: false
                }
            }
        },
        credits: {
            enabled: false
        },
        series: [{
                type: 'area',
                color: color,
                data: initialData,
                name: type
            }]
    });
}
function setupConnection() {
    return __awaiter(this, void 0, void 0, function* () {
        let result = yield fetch("/realtime/data");
        if (result.ok) {
            let json = yield result.json();
            document.getElementById("lblStatus").textContent = json.state;
            document.getElementById("hostname").value = json.hostname;
            document.getElementById("filename").value = json.filename;
            let powerSeries = json.data.map(x => {
                return [
                    new Date(x.StatusSNS.Time).getTime(),
                    x.StatusSNS.ENERGY.Power
                ];
            });
            if (powerSeries.length > MAX_POINTS)
                powerSeries.splice(0, powerSeries.length - MAX_POINTS);
            chartPower = setupChart("chartPower", "Power", "#40bf55", powerSeries);
            let amperageSeries = json.data.map(x => {
                return [
                    new Date(x.StatusSNS.Time).getTime(),
                    x.StatusSNS.ENERGY.Current
                ];
            });
            if (amperageSeries.length > MAX_POINTS)
                amperageSeries.splice(0, amperageSeries.length - MAX_POINTS);
            chartAmperage = setupChart("chartAmperage", "Amperage", "#5540bf", amperageSeries);
            let voltageSeries = json.data.map(x => {
                return [
                    new Date(x.StatusSNS.Time).getTime(),
                    x.StatusSNS.ENERGY.Voltage
                ];
            });
            if (voltageSeries.length > MAX_POINTS)
                voltageSeries.splice(0, voltageSeries.length - MAX_POINTS);
            chartVoltage = setupChart("chartVoltage", "Voltage", "#bf8040", voltageSeries);
            let powerFactorSeries = json.data.map(x => {
                return [
                    new Date(x.StatusSNS.Time).getTime(),
                    x.StatusSNS.ENERGY.Factor
                ];
            });
            if (powerFactorSeries.length > MAX_POINTS)
                powerFactorSeries.splice(0, powerFactorSeries.length - MAX_POINTS);
            chartPowerFactor = setupChart("chartPowerFactor", "Power factor", "#000000", powerFactorSeries);
            for (const file of json.files) {
                let el = document.createElement("a");
                el.className = "dropdown-item";
                el.href = "/analysis.html?file=" + file;
                el.textContent = file;
                document.getElementById("existingFilesMenu").appendChild(el);
            }
            setupWebSocket();
        }
    });
}
function setupWebSocket() {
    const ws = new WebSocket('ws://' + document.location.host + '/');
    ws.onopen = () => console.log("Websocket connected");
    ws.onmessage = (ev) => {
        let obj = JSON.parse(ev.data);
        if (obj.type == "poll") {
            var pollStatus = obj.data;
            // fix rounded power
            pollStatus.StatusSNS.ENERGY.Power = pollStatus.StatusSNS.ENERGY.Voltage * pollStatus.StatusSNS.ENERGY.Current * pollStatus.StatusSNS.ENERGY.Factor;
            chartPower.series[0].addPoint([
                new Date(pollStatus.StatusSNS.Time).getTime(),
                pollStatus.StatusSNS.ENERGY.Power
            ], true, chartPower.series[0].data.length >= MAX_POINTS);
            document.getElementById("lblPower").textContent = pollStatus.StatusSNS.ENERGY.Power.toFixed(2) + " W";
            chartAmperage.series[0].addPoint([
                new Date(pollStatus.StatusSNS.Time).getTime(),
                pollStatus.StatusSNS.ENERGY.Current
            ], true, chartAmperage.series[0].data.length >= MAX_POINTS);
            document.getElementById("lblAmperage").textContent = pollStatus.StatusSNS.ENERGY.Current.toFixed(2) + " A";
            chartVoltage.series[0].addPoint([
                new Date(pollStatus.StatusSNS.Time).getTime(),
                pollStatus.StatusSNS.ENERGY.Voltage
            ], true, chartVoltage.series[0].data.length >= MAX_POINTS);
            document.getElementById("lblVoltage").textContent = pollStatus.StatusSNS.ENERGY.Voltage.toFixed(2) + " V";
            chartPowerFactor.series[0].addPoint([
                new Date(pollStatus.StatusSNS.Time).getTime(),
                pollStatus.StatusSNS.ENERGY.Factor
            ], true, chartPowerFactor.series[0].data.length >= MAX_POINTS);
            document.getElementById("lblPowerFactor").textContent = pollStatus.StatusSNS.ENERGY.Factor.toFixed(2) + "";
        }
    };
    ws.onclose = () => console.log("Websocket closed");
}
document.getElementById("btnSetup").onclick = function (ev) {
    fetch("/realtime/setup", {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            hostname: document.getElementById("hostname").value,
            filename: document.getElementById("filename").value
        }),
        method: "POST",
    }).then((resp) => __awaiter(this, void 0, void 0, function* () {
        let json = yield resp.json();
        document.getElementById("lblStatus").textContent = json.state;
    })).catch((err) => {
        //TODO
        console.error(err);
    });
    ev.preventDefault();
};
document.getElementById("btnStart").onclick = function (ev) {
    fetch("/realtime/start", {
        method: "POST",
    }).then((resp) => __awaiter(this, void 0, void 0, function* () {
        let json = yield resp.json();
        document.getElementById("lblStatus").textContent = json.state;
    })).catch((err) => {
        //TODO
        console.error(err);
    });
    ev.preventDefault();
};
document.getElementById("btnStop").onclick = function (ev) {
    fetch("/realtime/stop", {
        method: "POST",
    }).then((resp) => __awaiter(this, void 0, void 0, function* () {
        let json = yield resp.json();
        document.getElementById("lblStatus").textContent = json.state;
    })).catch((err) => {
        //TODO
        console.error(err);
    });
    ev.preventDefault();
};
document.getElementById("btnReset").onclick = function (ev) {
    fetch("/realtime/reset", {
        method: "POST",
    }).then(() => {
        chartVoltage.series[0].setData([]);
        chartPower.series[0].setData([]);
        chartAmperage.series[0].setData([]);
        chartPowerFactor.series[0].setData([]);
    }).catch((err) => {
        //TODO
        console.error(err);
    });
    ev.preventDefault();
};
setupConnection();
//# sourceMappingURL=realtime.js.map