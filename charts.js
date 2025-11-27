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
        const ctx = document.getElementById('efficiencyChart')?.getContext
