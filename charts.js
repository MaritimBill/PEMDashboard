class ChartManager {
    constructor() {
        this.charts = {};
        this.dataBuffers = {};
    }

    initializeAllCharts() {
        this.initializeSystemOverviewChart();
        this.initializeProductionChart();
        this.initializeEfficiencyChart();
        this.initializeCostAnalysisChart();
        this.initializeMPCPerformanceChart();
        this.initializeHistoricalTrendsChart();
    }

    initializeSystemOverviewChart() {
        const ctx = document.getElementById('systemOverviewChart')?.getContext('2d');
        if (!ctx) return;

        this.charts.systemOverview = new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.generateTimeLabels(24),
                datasets: [
                    {
                        label: 'Temperature (°C)',
                        data: this.generateRandomData(24, 60, 70),
                        borderColor: '#dc3545',
                        backgroundColor: 'rgba(220, 53, 69, 0.1)',
                        tension: 0.4,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Current (A)',
                        data: this.generateRandomData(24, 140, 160),
                        borderColor: '#0d6efd',
                        backgroundColor: 'rgba(13, 110, 253, 0.1)',
                        tension: 0.4,
                        yAxisID: 'y1'
                    },
                    {
                        label: 'Voltage (V)',
                        data: this.generateRandomData(24, 37, 39),
                        borderColor: '#198754',
                        backgroundColor: 'rgba(25, 135, 84, 0.1)',
                        tension: 0.4,
                        yAxisID: 'y'
                    }
                ]
            },
            options: {
                responsive: true,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'hour',
                            displayFormats: {
                                hour: 'HH:mm'
                            }
                        },
                        title: {
                            display: true,
                            text: 'Time'
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Temperature (°C) / Voltage (V)'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Current (A)'
                        },
                        grid: {
                            drawOnChartArea: false
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'System Overview - Last 24 Hours'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                }
            }
        });
    }

    initializeProductionChart() {
        const ctx = document.getElementById('productionChart')?.getContext('2d');
        if (!ctx) return;

        this.charts.production = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
                datasets: [
                    {
                        label: 'O₂ Production (L/h)',
                        data: [120, 180, 220, 210, 190, 160],
                        backgroundColor: 'rgba(54, 162, 235, 0.8)',
                        borderColor: 'rgb(54, 162, 235)',
                        borderWidth: 1
                    },
                    {
                        label: 'H₂ Production (L/h)',
                        data: [240, 360, 440, 420, 380, 320],
                        backgroundColor: 'rgba(255, 99, 132, 0.8)',
                        borderColor: 'rgb(255, 99, 132)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Production Rate (L/h)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Time of Day'
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Gas Production Rates'
                    }
                }
            }
        });
    }

    initializeEfficiencyChart() {
        const ctx = document.getElementById('efficiencyChart')?.getContext('2d');
        if (!ctx) return;

        this.charts.efficiency = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Useful Energy', 'Stack Losses', 'Cooling System', 'Control System'],
                datasets: [{
                    data: [65, 20, 10, 5],
                    backgroundColor: [
                        'rgb(75, 192, 192)',
                        'rgb(255, 99, 132)',
                        'rgb(255, 205, 86)',
                        'rgb(54, 162, 235)'
                    ],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    title: {
                        display: true,
                        text: 'Energy Distribution'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.label}: ${context.raw}%`;
                            }
                        }
                    }
                }
            }
        });
    }

    initializeCostAnalysisChart() {
        const ctx = document.getElementById('costAnalysisChart')?.getContext('2d');
        if (!ctx) return;

        this.charts.costAnalysis = new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.generateTimeLabels(7),
                datasets: [
                    {
                        label: 'Electricity Cost (KES)',
                        data: this.generateRandomData(7, 400, 600),
                        borderColor: '#ff6384',
                        backgroundColor: 'rgba(255, 99, 132, 0.1)',
                        yAxisID: 'y',
                        tension: 0.4
                    },
                    {
                        label: 'O₂ Production (L)',
                        data: this.generateRandomData(7, 2000, 3000),
                        borderColor: '#36a2eb',
                        backgroundColor: 'rgba(54, 162, 235, 0.1)',
                        yAxisID: 'y1',
                        tension: 0.4
                    },
                    {
                        label: 'KPLC Tariff (KES/kWh)',
                        data: [18.69, 25.33, 18.69, 18.69, 25.33, 12.50, 12.50],
                        borderColor: '#4bc0c0',
                        backgroundColor: 'rgba(75, 192, 192, 0.1)',
                        yAxisID: 'y2',
                        tension: 0.4,
                        borderDash: [5, 5]
                    }
                ]
            },
            options: {
                responsive: true,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'day'
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Cost (KES)'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Production (L)'
                        },
                        grid: {
                            drawOnChartArea: false
                        }
                    },
                    y2: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Tariff (KES/kWh)'
                        },
                        grid: {
                            drawOnChartArea: false
                        },
                        offset: true
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Cost Analysis & KPLC Tariff Impact'
                    }
                }
            }
        });
    }

    initializeMPCPerformanceChart() {
        const ctx = document.getElementById('mpcPerformanceChart')?.getContext('2d');
        if (!ctx) return;

        this.charts.mpcPerformance = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: [
                    'Control Accuracy', 
                    'Response Time', 
                    'Energy Efficiency',
                    'Stability',
                    'Cost Optimization',
                    'Adaptability'
                ],
                datasets: [
                    {
                        label: 'HENMPC',
                        data: [95, 85, 90, 92, 88, 94],
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        borderColor: 'rgb(255, 99, 132)',
                        pointBackgroundColor: 'rgb(255, 99, 132)'
                    },
                    {
                        label: 'Standard MPC',
                        data: [75, 90, 70, 80, 65, 70],
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        borderColor: 'rgb(54, 162, 235)',
                        pointBackgroundColor: 'rgb(54, 162, 235)'
                    },
                    {
                        label: 'Mixed Integer MPC',
                        data: [82, 65, 75, 78, 80, 75],
                        backgroundColor: 'rgba(255, 205, 86, 0.2)',
                        borderColor: 'rgb(255, 205, 86)',
                        pointBackgroundColor: 'rgb(255, 205, 86)'
                    }
                ]
            },
            options: {
                responsive: true,
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
                        text: 'MPC Algorithm Performance Comparison'
                    },
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    initializeHistoricalTrendsChart() {
        const ctx = document.getElementById('historicalTrendsChart')?.getContext('2d');
        if (!ctx) return;

        this.charts.historicalTrends = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
                datasets: [
                    {
                        label: 'Total O₂ Production (m³)',
                        data: [12500, 13200, 14100, 15800, 14900, 16300, 17500],
                        borderColor: '#36a2eb',
                        backgroundColor: 'rgba(54, 162, 235, 0.1)',
                        yAxisID: 'y',
                        fill: true
                    },
                    {
                        label: 'Energy Cost (KES ×1000)',
                        data: [85, 88, 92, 105, 98, 110, 115],
                        borderColor: '#ff6384',
                        backgroundColor: 'rgba(255, 99, 132, 0.1)',
                        yAxisID: 'y1',
                        fill: true
                    },
                    {
                        label: 'System Efficiency (%)',
                        data: [68, 69, 71, 72, 70, 73, 74],
                        borderColor: '#4bc0c0',
                        backgroundColor: 'rgba(75, 192, 192, 0.1)',
                        yAxisID: 'y2',
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Month'
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'O₂ Production (m³)'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Energy Cost (KES ×1000)'
                        },
                        grid: {
                            drawOnChartArea: false
                        }
                    },
                    y2: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Efficiency (%)'
                        },
                        grid: {
                            drawOnChartArea: false
                        },
                        offset: true
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Historical Performance Trends - Kenyatta National Hospital'
                    }
                }
            }
        });
    }

    // Utility methods
    generateTimeLabels(count) {
        const labels = [];
        const now = new Date();
        
        for (let i = count - 1; i >= 0; i--) {
            const time = new Date(now);
            time.setHours(time.getHours() - i);
            labels.push(time);
        }
        
        return labels;
    }

    generateRandomData(count, min, max) {
        const data = [];
        for (let i = 0; i < count; i++) {
            data.push(min + Math.random() * (max - min));
        }
        return data;
    }

    updateRealTimeData(sensorData) {
        // Update all charts with new real-time data
        this.updateSystemOverview(sensorData);
        this.updateEfficiency(sensorData);
    }

    updateSystemOverview(data) {
        const chart = this.charts.systemOverview;
        if (!chart) return;

        const now = new Date();
        
        // Add new data point
        chart.data.labels.push(now);
        chart.data.datasets[0].data.push(data.temperature);
        chart.data.datasets[1].data.push(data.current);
        chart.data.datasets[2].data.push(data.voltage);

        // Keep only last 50 points
        if (chart.data.labels.length > 50) {
            chart.data.labels.shift();
            chart.data.datasets.forEach(dataset => dataset.data.shift());
        }

        chart.update('none');
    }

    updateEfficiency(data) {
        const chart = this.charts.efficiency;
        if (!chart) return;

        // Update efficiency distribution based on current data
        const usefulEnergy = data.systemEfficiency || 65;
        const stackLosses = 20;
        const cooling = 10;
        const control = 5;

        chart.data.datasets[0].data = [usefulEnergy, stackLosses, cooling, control];
        chart.update();
    }

    updateMPCComparison(comparisonData) {
        const chart = this.charts.mpcPerformance;
        if (!chart || !comparisonData?.algorithms) return;

        const datasets = [];
        const colors = {
            HENMPC: { border: 'rgb(255, 99, 132)', background: 'rgba(255, 99, 132, 0.2)' },
            STANDARD_MPC: { border: 'rgb(54, 162, 235)', background: 'rgba(54, 162, 235, 0.2)' },
            MIXED_INTEGER_MPC: { border: 'rgb(255, 205, 86)', background: 'rgba(255, 205, 86, 0.2)' },
            STOCHASTIC_MPC: { border: 'rgb(75, 192, 192)', background: 'rgba(75, 192, 192, 0.2)' },
            HEMPC: { border: 'rgb(153, 102, 255)', background: 'rgba(153, 102, 255, 0.2)' }
        };

        Object.entries(comparisonData.algorithms).forEach(([name, algo]) => {
            if (algo.error) return;

            const color = colors[name] || { border: 'rgb(128, 128, 128)', background: 'rgba(128, 128, 128, 0.2)' };
            
            datasets.push({
                label: name,
                data: [
                    algo.performance || 70,
                    100 - Math.min((algo.computationTime || 50) / 100, 1) * 100, // Convert to performance metric
                    algo.predictedEfficiency || 70,
                    algo.stability || 70,
                    algo.costSaving || 70,
                    80 + Math.random() * 15 // Adaptability score
                ],
                backgroundColor: color.background,
                borderColor: color.border,
                pointBackgroundColor: color.border
            });
        });

        chart.data.datasets = datasets;
        chart.update();
    }

    // Export chart data
    exportChartData(chartName) {
        const chart = this.charts[chartName];
        if (!chart) return null;

        return {
            labels: chart.data.labels,
            datasets: chart.data.datasets.map(dataset => ({
                label: dataset.label,
                data: dataset.data
            }))
        };
    }

    // Reset specific chart
    resetChart(chartName) {
        const chart = this.charts[chartName];
        if (chart) {
            chart.data.labels = [];
            chart.data.datasets.forEach(dataset => dataset.data = []);
            chart.update();
        }
    }
}

// Initialize chart manager
document.addEventListener('DOMContentLoaded', () => {
    window.chartManager = new ChartManager();
    window.chartManager.initializeAllCharts();
});
