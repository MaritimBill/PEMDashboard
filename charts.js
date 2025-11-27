const Chart = require('chart.js');

// Custom real-time chart plugin
const realTimePlugin = {
    id: 'realtime',
    beforeInit: function(chart) {
        chart.realtime = {
            data: [],
            duration: 60000,
            refresh: 1000,
            delay: 2000,
            onRefresh: null
        };
    },
    afterUpdate: function(chart) {
        if (chart.config.options.scales.x.type === 'realtime') {
            const realtime = chart.realtime;
            const now = Date.now();
            
            // Remove old data
            const cutoff = now - realtime.duration;
            let firstIndex = 0;
            
            while (firstIndex < chart.data.labels.length) {
                const labelTime = new Date(chart.data.labels[firstIndex]).getTime();
                if (labelTime > cutoff) break;
                firstIndex++;
            }
            
            if (firstIndex > 0) {
                chart.data.labels.splice(0, firstIndex);
                chart.data.datasets.forEach(dataset => {
                    dataset.data.splice(0, firstIndex);
                });
            }
        }
    }
};

Chart.register(realTimePlugin);

class PEMCharts {
    constructor() {
        this.charts = {};
        this.colors = {
            primary: 'rgb(75, 192, 192)',
            secondary: 'rgb(255, 99, 132)',
            tertiary: 'rgb(54, 162, 235)',
            success: 'rgb(75, 192, 120)',
            warning: 'rgb(255, 159, 64)',
            danger: 'rgb(255, 99, 100)'
        };
    }

    createRealTimeChart(canvasId, config) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        const defaultConfig = {
            type: 'line',
            data: {
                labels: [],
                datasets: []
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 0
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    x: {
                        type: 'realtime',
                        realtime: {
                            duration: 60000,
                            refresh: 1000,
                            delay: 2000,
                            onRefresh: this.onRefresh
                        }
                    },
                    y: {
                        beginAtZero: true
                    }
                }
            }
        };

        const mergedConfig = this.deepMerge(defaultConfig, config);
        this.charts[canvasId] = new Chart(ctx, mergedConfig);
        
        return this.charts[canvasId];
    }

    createGaugeChart(canvasId, value, maxValue, label) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        const data = {
            datasets: [{
                data: [value, maxValue - value],
                backgroundColor: [
                    this.getColorForValue(value / maxValue),
                    'rgba(200, 200, 200, 0.2)'
                ],
                borderWidth: 0
            }]
        };

        const config = {
            type: 'doughnut',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '75%',
                circumference: 180,
                rotation: 270,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        enabled: false
                    }
                }
            },
            plugins: [{
                id: 'gaugeLabel',
                afterDraw: (chart) => {
                    const { ctx, chartArea: { width, height } } = chart;
                    ctx.save();
                    ctx.font = 'bold 16px Arial';
                    ctx.fillStyle = '#333';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(label, width / 2, height / 2 + 10);
                    ctx.font = 'bold 24px Arial';
                    ctx.fillText(value.toFixed(1), width / 2, height / 2 - 10);
                    ctx.restore();
                }
            }]
        };

        this.charts[canvasId] = new Chart(ctx, config);
        return this.charts[canvasId];
    }

    createRadarChart(canvasId, labels, datasets) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        const config = {
            type: 'radar',
            data: {
                labels: labels,
                datasets: datasets.map((dataset, index) => ({
                    label: dataset.label,
                    data: dataset.data,
                    fill: true,
                    backgroundColor: this.withAlpha(this.colors.primary, 0.2),
                    borderColor: this.colors.primary,
                    pointBackgroundColor: this.colors.primary,
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: this.colors.primary
                }))
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                elements: {
                    line: {
                        borderWidth: 3
                    }
                },
                scales: {
                    r: {
                        angleLines: {
                            display: true
                        },
                        suggestedMin: 0,
                        suggestedMax: 100
                    }
                }
            }
        };

        this.charts[canvasId] = new Chart(ctx, config);
        return this.charts[canvasId];
    }

    createComparisonChart(canvasId, comparisonData) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        const mpcTypes = Object.keys(comparisonData);
        const metrics = ['Performance', 'Cost Efficiency', 'Computation Time', 'Reliability'];
        
        const datasets = metrics.map((metric, metricIndex) => ({
            label: metric,
            data: mpcTypes.map(type => comparisonData[type].scores[metricIndex]),
            backgroundColor: this.getColorByIndex(metricIndex)
        }));

        const config = {
            type: 'bar',
            data: {
                labels: mpcTypes,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        stacked: false
                    },
                    y: {
                        stacked: false,
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        };

        this.charts[canvasId] = new Chart(ctx, config);
        return this.charts[canvasId];
    }

    updateChartData(canvasId, newData) {
        const chart = this.charts[canvasId];
        if (!chart) return;

        chart.data = newData;
        chart.update();
    }

    addDataPoint(canvasId, label, dataPoints) {
        const chart = this.charts[canvasId];
        if (!chart) return;

        chart.data.labels.push(label);
        
        dataPoints.forEach((dataPoint, index) => {
            if (chart.data.datasets[index]) {
                chart.data.datasets[index].data.push(dataPoint);
            }
        });

        // Remove old data if needed
        if (chart.data.labels.length > 100) {
            chart.data.labels.shift();
            chart.data.datasets.forEach(dataset => {
                dataset.data.shift();
            });
        }

        chart.update('none');
    }

    updateGaugeValue(canvasId, newValue) {
        const chart = this.charts[canvasId];
        if (!chart) return;

        chart.data.datasets[0].data = [newValue, chart.data.datasets[0].data[1] + chart.data.datasets[0].data[0] - newValue];
        chart.update();
    }

    getColorForValue(value) {
        if (value < 0.3) return this.colors.success;
        if (value < 0.7) return this.colors.warning;
        return this.colors.danger;
    }

    getColorByIndex(index) {
        const colors = [
            this.colors.primary,
            this.colors.secondary,
            this.colors.tertiary,
            this.colors.success,
            this.colors.warning
        ];
        return colors[index % colors.length];
    }

    withAlpha(color, alpha) {
        if (color.startsWith('rgb')) {
            const rgb = color.match(/\d+/g);
            return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
        }
        return color;
    }

    deepMerge(target, source) {
        const output = Object.assign({}, target);
        
        if (this.isObject(target) && this.isObject(source)) {
            Object.keys(source).forEach(key => {
                if (this.isObject(source[key])) {
                    if (!(key in target)) {
                        Object.assign(output, { [key]: source[key] });
                    } else {
                        output[key] = this.deepMerge(target[key], source[key]);
                    }
                } else {
                    Object.assign(output, { [key]: source[key] });
                }
            });
        }
        
        return output;
    }

    isObject(item) {
        return item && typeof item === 'object' && !Array.isArray(item);
    }

    destroyChart(canvasId) {
        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
            delete this.charts[canvasId];
        }
    }

    destroyAllCharts() {
        Object.keys(this.charts).forEach(canvasId => {
            this.destroyChart(canvasId);
        });
    }
}

module.exports = PEMCharts;
