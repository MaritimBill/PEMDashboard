// Browser-compatible Chart.js utilities for PEM Electrolyzer Dashboard
class PEMCharts {
    constructor() {
        this.charts = new Map();
        this.colors = {
            primary: 'rgb(75, 192, 192)',
            secondary: 'rgb(255, 99, 132)',
            tertiary: 'rgb(54, 162, 235)',
            success: 'rgb(75, 192, 120)',
            warning: 'rgb(255, 159, 64)',
            danger: 'rgb(255, 99, 100)'
        };
        
        this.initializeRealTimePlugin();
    }

    initializeRealTimePlugin() {
        // Custom real-time chart plugin
        Chart.register({
            id: 'realtime',
            beforeInit: function(chart) {
                chart.realtime = {
                    data: [],
                    duration: 60000,
                    refresh: 1000,
                    delay: 2000
                };
            }
        });
    }

    createProductionChart(canvasId) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'H₂ Production Rate',
                        data: [],
                        borderColor: this.colors.primary,
                        backgroundColor: this.withAlpha(this.colors.primary, 0.1),
                        tension: 0.4,
                        fill: true,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Setpoint',
                        data: [],
                        borderColor: this.colors.secondary,
                        borderDash: [5, 5],
                        tension: 0.4,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Stack Current',
                        data: [],
                        borderColor: this.colors.tertiary,
                        tension: 0.4,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                scales: {
                    x: {
                        type: 'linear',
                        display: true,
                        title: {
                            display: true,
                            text: 'Time (s)'
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Production Rate (L/s)'
                        },
                        min: 0,
                        max: 0.06
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Current (A)'
                        },
                        min: 100,
                        max: 200,
                        grid: {
                            drawOnChartArea: false
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Real-time Production Monitoring'
                    },
                    legend: {
                        display: true,
                        position: 'top'
                    }
                }
            }
        });

        this.charts.set(canvasId, chart);
        return chart;
    }

    createEconomicChart(canvasId) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        const chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Energy Cost', 'Degradation', 'H₂ Value', 'O₂ Value', 'Net Value'],
                datasets: [{
                    label: 'Economic Breakdown ($/h)',
                    data: [2.1, 0.5, 4.2, 0.8, 2.4],
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.8)',
                        'rgba(255, 159, 64, 0.8)',
                        'rgba(75, 192, 192, 0.8)',
                        'rgba(54, 162, 235, 0.8)',
                        'rgba(75, 192, 120, 0.8)'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Economic Performance'
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'USD per Hour'
                        }
                    }
                }
            }
        });

        this.charts.set(canvasId, chart);
        return chart;
    }

    createSafetyChart(canvasId) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        const chart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Temperature', 'Purity', 'Voltage', 'Current', 'Efficiency'],
                datasets: [{
                    label: 'Safety Metrics',
                    data: [80, 95, 85, 75, 90],
                    fill: true,
                    backgroundColor: this.withAlpha(this.colors.primary, 0.2),
                    borderColor: this.colors.primary,
                    pointBackgroundColor: this.colors.primary,
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: this.colors.primary
                }]
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
                        suggestedMax: 100,
                        ticks: {
                            stepSize: 20
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Safety Status'
                    }
                }
            }
        });

        this.charts.set(canvasId, chart);
        return chart;
    }

    createMPCComparisonChart(canvasId) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        const chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['DETERMINISTIC', 'STOCHASTIC', 'ROBUST', 'HYBRID', 'HE_NMPC'],
                datasets: [
                    {
                        label: 'Performance Score',
                        data: [75, 82, 78, 85, 92],
                        backgroundColor: this.colors.primary,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Computation Time (ms)',
                        data: [45, 120, 85, 95, 150],
                        backgroundColor: this.colors.secondary,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'MPC Type'
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Performance Score'
                        },
                        min: 0,
                        max: 100
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Computation Time (ms)'
                        },
                        min: 0,
                        grid: {
                            drawOnChartArea: false
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'MPC Algorithm Comparison'
                    }
                }
            }
        });

        this.charts.set(canvasId, chart);
        return chart;
    }

    createEfficiencyChart(canvasId) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'System Efficiency (%)',
                        data: [],
                        borderColor: this.colors.success,
                        backgroundColor: this.withAlpha(this.colors.success, 0.1),
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Theoretical Max',
                        data: [],
                        borderColor: this.colors.warning,
                        borderDash: [5, 5],
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        min: 50,
                        max: 80,
                        title: {
                            display: true,
                            text: 'Efficiency (%)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Time (s)'
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'System Efficiency Over Time'
                    }
                }
            }
        });

        this.charts.set(canvasId, chart);
        return chart;
    }

    // Utility methods
    addDataPoint(chartId, label, datasetsData) {
        const chart = this.charts.get(chartId);
        if (!chart) return;

        chart.data.labels.push(label);
        
        datasetsData.forEach((data, index) => {
            if (chart.data.datasets[index]) {
                chart.data.datasets[index].data.push(data);
            }
        });

        // Keep only last 50 data points
        if (chart.data.labels.length > 50) {
            chart.data.labels.shift();
            chart.data.datasets.forEach(dataset => {
                dataset.data.shift();
            });
        }

        chart.update('none');
    }

    updateChartData(chartId, newData) {
        const chart = this.charts.get(chartId);
        if (!chart) return;

        if (newData.labels) {
            chart.data.labels = newData.labels;
        }
        
        if (newData.datasets) {
            newData.datasets.forEach((dataset, index) => {
                if (chart.data.datasets[index]) {
                    Object.assign(chart.data.datasets[index], dataset);
                }
            });
        }

        chart.update();
    }

    updateGaugeValue(gaugeId, value, maxValue = 100) {
        const element = document.getElementById(gaugeId);
        if (element) {
            const percentage = (value / maxValue) * 100;
            element.style.background = `conic-gradient(
                ${this.getColorForValue(value/maxValue)} 0% ${percentage}%, 
                #e0e0e0 ${percentage}% 100%
            )`;
            element.querySelector('.gauge-value').textContent = value.toFixed(1);
        }
    }

    getColorForValue(value) {
        if (value < 0.3) return this.colors.danger;
        if (value < 0.7) return this.colors.warning;
        return this.colors.success;
    }

    withAlpha(color, alpha) {
        if (color.startsWith('rgb')) {
            const rgb = color.match(/\d+/g);
            return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
        }
        return color;
    }

    destroyChart(chartId) {
        const chart = this.charts.get(chartId);
        if (chart) {
            chart.destroy();
            this.charts.delete(chartId);
        }
    }

    destroyAllCharts() {
        this.charts.forEach((chart, chartId) => {
            this.destroyChart(chartId);
        });
    }
}
