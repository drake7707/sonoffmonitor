/// <reference path="../../node_modules/moment/moment.d.ts" />
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
function readFile() {
    return __awaiter(this, void 0, void 0, function* () {
        let urlParams = new URLSearchParams(window.location.search);
        let filename = urlParams.get('file');
        let result = yield fetch("/analysis/file?filename=" + filename);
        if (result.ok) {
            let text = yield result.text();
            let lastIndex = 0;
            let index = text.indexOf('\n');
            let powerSeries = [];
            let amperageSeries = [];
            let voltageSeries = [];
            let factorSeries = [];
            let histogram = {};
            let totalEnergy = 0;
            let lastTime = -1;
            while (index > -1) {
                var line = text.substring(lastIndex, index);
                let parts = line.split(";");
                let time = parseInt(parts[0]);
                let power = parseFloat(parts[1]);
                let voltage = parseFloat(parts[2]);
                let amperage = parseFloat(parts[3]);
                let factor = parseFloat(parts[4]);
                if (lastTime != -1) {
                    let deltaHour = (time - lastTime) / (1000 * 3600);
                    totalEnergy += power / 1000 * deltaHour;
                }
                lastTime = time;
                powerSeries.push([time, power]);
                amperageSeries.push([time, amperage]);
                voltageSeries.push([time, voltage]);
                factorSeries.push([time, factor]);
                if (typeof histogram[Math.round(power)] === "undefined")
                    histogram[Math.round(power)] = 0;
                else
                    histogram[Math.round(power)]++;
                lastIndex = index + 1;
                index = text.indexOf('\n', lastIndex);
            }
            let min = Number.MAX_VALUE;
            let max = Number.MIN_VALUE;
            for (const key of Object.keys(histogram)) {
                if (min > parseInt(key))
                    min = parseInt(key);
                if (max < parseInt(key))
                    max = parseInt(key);
            }
            // fill in missing gaps
            for (let i = min; i <= max; i++) {
                if (typeof (histogram[i]) == "undefined")
                    histogram[i] = 0;
            }
            setupMainChart(powerSeries, voltageSeries, amperageSeries, factorSeries);
            setupHistogramChart(histogram);
            let sumPower = 0;
            let activeCount = 0;
            for (const pair of powerSeries) {
                if (pair[1] > 0) {
                    sumPower += pair[1];
                    activeCount++;
                }
            }
            let avgPower = powerSeries.length > 0 ? sumPower / powerSeries.length : 0;
            let avgPowerWhenActive = activeCount > 0 ? sumPower / activeCount : 0;
            let totalActiveDurationMS = 0;
            for (let i = 1; i < powerSeries.length; i++) {
                if (powerSeries[i][1] > 0)
                    totalActiveDurationMS += (powerSeries[i][0] - powerSeries[i - 1][0]);
            }
            let totalDurationMS = powerSeries[powerSeries.length - 1][0] - powerSeries[0][0];
            document.getElementById("lblPowerConsumption").textContent = totalEnergy.toFixed(4) + " kWh";
            //@ts-ignore
            document.getElementById("lblDuration").textContent = moment.duration(totalDurationMS).format("d [days] hh:mm:ss");
            //@ts-ignore
            document.getElementById("lblActiveDuration").textContent = moment.duration(totalActiveDurationMS).format("d [days] hh:mm:ss") + " (" + (totalActiveDurationMS / totalDurationMS * 100).toFixed(2) + "%)";
            document.getElementById("lblAveragePower").textContent = avgPower.toFixed(4) + " W";
            document.getElementById("lblAveragePowerWhenActive").textContent = avgPowerWhenActive.toFixed(4) + " W";
        }
    });
}
readFile();
function setupHistogramChart(histogram) {
    let powerHistogramSeries = [];
    let min = Number.MAX_VALUE;
    let max = Number.MIN_VALUE;
    for (const key of Object.keys(histogram)) {
        if (min > parseInt(key))
            min = parseInt(key);
        if (max < parseInt(key))
            max = parseInt(key);
    }
    let binSize = 5;
    let binnedHistogram = {};
    for (let i = min; i <= max; i++) {
        let idx = Math.floor((i - min) / binSize);
        if (typeof (binnedHistogram[idx]) == "undefined")
            binnedHistogram[idx] = histogram[i];
        else
            binnedHistogram[idx] += histogram[i];
    }
    let totalSamples = 0;
    for (const key of Object.keys(binnedHistogram)) {
        totalSamples += binnedHistogram[key];
    }
    for (const key of Object.keys(binnedHistogram)) {
        powerHistogramSeries.push([(parseInt(key) * binSize) + "W - " + (parseInt(key) * binSize + binSize - 1) + "W", Math.round((binnedHistogram[key] / totalSamples * 100) * 100) / 100]);
    }
    Highcharts.chart("powerHistogramChart", {
        chart: {},
        title: {
            text: ''
        },
        xAxis: {
            categories: powerHistogramSeries.map(val => val[0])
        },
        yAxis: {
            title: {
                text: "Percentage",
            },
            visible: true
        },
        legend: {
            enabled: true
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
                type: 'column',
                data: powerHistogramSeries.map(val => val[1]),
                name: "Power wattage frequency"
            }]
    });
}
function setupMainChart(powerSeries, voltageSeries, amperageSeries, factorSeries) {
    Highcharts.chart("mainChart", {
        chart: {
            zoomType: 'x',
        },
        // Enables boost without any other performance options
        boost: {
            enabled: true,
            useGPUTranslations: false,
            useAlpha: false
        },
        title: {
            text: ''
        },
        xAxis: {
            type: 'datetime'
        },
        yAxis: {
            title: {
                text: "Data"
            }
        },
        legend: {
            enabled: true
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
                color: "#bf8040",
                data: voltageSeries,
                name: "Voltage"
            }, {
                type: 'area',
                color: "#40bf55",
                data: powerSeries,
                name: "Power"
            }, {
                type: 'area',
                color: "#5540bf",
                data: amperageSeries,
                name: "Amperage"
            }, {
                type: 'area',
                color: "#000000",
                data: factorSeries,
                name: "Power factor"
            }]
    });
}
//# sourceMappingURL=analysis.js.map