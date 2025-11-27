const Chart = require('chart.js');
const RealTimeMPC = require('./mpc-comparator');

class MPCDashboard {
    constructor() {
        this.charts = {};
        this.realTimeData = [];
        this.mpcComparator = new RealTimeMPC();
        this.isRunning = false;
        
        this.initializeDashboard();
    }

    initializeDashboard() {
        this.createProductionChart();
        this.createEconomicChart();
        this.createSafetyChart();
        this.createMPCComparisonChart();
        this.startRealTimeUpdates();
    }

    createProductionChart() {
        const ctx = document.getElementById('production-chart').getContext('2d');
        
        this.charts.production = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'H₂ Production Rate',
                        data: [],
                        borderColor: 'rgb(75, 192, 192)',
                        tension: 0.1,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Setpoint',
                        data: [],
                        borderColor: 'rgb(255, 99, 132)',
                        borderDash: [5, 5],
                        tension: 0.1,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Current',
                        data: [],
                        borderColor: 'rgb(54, 162, 235)',
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                scales: {
                    x: {
                        type: 'realtime',
                        realtime: {
                            duration: 60000,
                            refresh: 1000,
                            delay: 2000
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Production Rate (L/s)'
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
                }
            }
        });
    }

    createEconomicChart() {
        const ctx = document.getElementById('economic-chart').getContext('2d');
        
        this.charts.economic = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Energy Cost', 'Degradation', 'H₂ Value', 'Net Value'],
                datasets: [{
                    label: 'Economic Breakdown ($/h)',
                    data: [0, 0, 0, 0],
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.8)',
                        'rgba(255, 159, 64, 0.8)',
                        'rgba(75, 192, 192, 0.8)',
                        'rgba(54, 162, 235, 0.8)'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Economic Performance'
                    }
                }
            }
        });
    }

    createSafetyChart() {
        const ctx = document.getElementById('safety-chart').getContext('2d');
        
        this.charts.safety = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Temperature', 'Purity', 'Voltage', 'Current', 'Efficiency'],
                datasets: [{
                    label: 'Safety Metrics',
                    data: [80, 95, 85, 75, 90],
                    fill: true,
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgb(255, 99, 132)',
                    pointBackgroundColor: 'rgb(255, 99, 132)'
                }]
            },
            options: {
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
        });
    }

    createMPCComparisonChart() {
        const ctx = document.getElementById('mpc-comparison-chart').getContext('2d');
        
        this.charts.mpcComparison = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['DETERMINISTIC', 'STOCHASTIC', 'ROBUST', 'HYBRID', 'HE_NMPC'],
                datasets: [
                    {
                        label: 'Performance Score',
                        data: [0, 0, 0, 0, 0],
                        backgroundColor: 'rgba(75, 192, 192, 0.8)',
                        yAxisID: 'y'
                    },
                    {
                        label: 'Computation Time (ms)',
                        data: [0, 0, 0, 0, 0],
                        backgroundColor: 'rgba(255, 99, 132, 0.8)',
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
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
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Computation Time (ms)'
                        },
                        grid: {
                            drawOnChartArea: false
                        }
                    }
                }
            }
        });
    }

    async startRealTimeUpdates() {
        this.isRunning = true;
        
        while (this.isRunning) {
            await this.updateDashboard();
            await this.delay(1000); // Update every second
        }
    }

    async updateDashboard() {
        const systemData = await this.fetchSystemData();
        const mpcComparison = await this.fetchMPCComparison();
        
        this.updateProductionChart(systemData);
        this.updateEconomicChart(systemData);
        this.updateSafetyChart(systemData);
        this.updateMPCComparisonChart(mpcComparison);
        this.updateStatusPanel(systemData);
    }

    async fetchSystemData() {
        // Simulate fetching data from backend
        return {
            timestamp: new Date().toISOString(),
            production: {
                h2_rate: 0.042 + Math.random() * 0.01,
                o2_rate: 0.021 + Math.random() * 0.005,
                current: 150 + Math.random() * 10,
                setpoint: 50
            },
            economics: {
                energy_cost: 2.1 + Math.random() * 0.2,
                degradation_cost: 0.5 + Math.random() * 0.1,
                h2_value: 4.2 + Math.random() * 0.3,
                net_value: 1.6 + Math.random() * 0.2
            },
            safety: {
                temperature: 65 + Math.random() * 5,
                purity: 99.5 + Math.random() * 0.3,
                voltage: 38 + Math.random() * 2,
                current: 150 + Math.random() * 10,
                efficiency: 65 + Math.random() * 5
            }
        };
    }

    async fetchMPCComparison() {
        const setpoint = { productionRate: 50 };
        const results = {};
        
        for (const mpcType of ['DETERMINISTIC_MPC', 'STOCHASTIC_MPC', 'ROBUST_MPC', 'HYBRID_MPC', 'HE_NMPC']) {
            results[mpcType] = await this.mpcComparator.computeControl(mpcType, setpoint);
        }
        
        return results;
    }

    updateProductionChart(data) {
        const chart = this.charts.production;
        const timestamp = new Date().toLocaleTimeString();
        
        // Add new data point
        chart.data.labels.push(timestamp);
        chart.data.datasets[0].data.push(data.production.h2_rate);
        chart.data.datasets[1].data.push(data.production.setpoint);
        chart.data.datasets[2].data.push(data.production.current);
        
        // Remove old data
        if (chart.data.labels.length > 50) {
            chart.data.labels.shift();
            chart.data.datasets.forEach(dataset => dataset.data.shift());
        }
        
        chart.update('none');
    }

    updateEconomicChart(data) {
        const chart = this.charts.economic;
        
        chart.data.datasets[0].data = [
            data.economics.energy_cost,
            data.economics.degradation_cost,
            data.economics.h2_value,
            data.economics.net_value
        ];
        
        chart.update();
    }

    updateSafetyChart(data) {
        const chart = this.charts.safety;
        
        chart.data.datasets[0].data = [
            data.safety.temperature,
            data.safety.purity,
            data.safety.voltage,
            data.safety.current,
            data.safety.efficiency
        ];
        
        chart.update();
    }

    updateMPCComparisonChart(comparisonData) {
        const chart = this.charts.mpcComparison;
        const mpcTypes = ['DETERMINISTIC_MPC', 'STOCHASTIC_MPC', 'ROBUST_MPC', 'HYBRID_MPC', 'HE_NMPC'];
        
        const performanceScores = mpcTypes.map(type => 
            comparisonData[type]?.performance.setpointAchievement || 0
        );
        
        const computationTimes = mpcTypes.map(type => 
            comparisonData[type]?.computationTime || 0
        );
        
        chart.data.datasets[0].data = performanceScores;
        chart.data.datasets[1].data = computationTimes;
        
        chart.update();
    }

    updateStatusPanel(data) {
        // Update HTML elements with current status
        document.getElementById('current-value').textContent = data.production.current.toFixed(1);
        document.getElementById('voltage-value').textContent = data.safety.voltage.toFixed(1);
        document.getElementById('temperature-value').textContent = data.safety.temperature.toFixed(1);
        document.getElementById('purity-value').textContent = data.safety.purity.toFixed(1);
        document.getElementById('efficiency-value').textContent = data.safety.efficiency.toFixed(1);
        
        // Update status indicator
        const statusIndicator = document.getElementById('status-indicator');
        if (data.safety.temperature > 75 || data.safety.purity < 99.3) {
            statusIndicator.className = 'status-warning';
            statusIndicator.textContent = 'WARNING';
        } else {
            statusIndicator.className = 'status-normal';
            statusIndicator.textContent = 'NORMAL';
        }
    }

    async handleMPCSelection(mpcType) {
        const setpoint = this.getCurrentSetpoint();
        
        try {
            const result = await this.mpcComparator.computeControl(mpcType, setpoint);
            this.displayMPCResult(result);
            
            // Send control signal to system
            await this.sendControlSignal(result.optimalCurrent);
            
        } catch (error) {
            this.displayError(`MPC Control Error: ${error.message}`);
        }
    }

    getCurrentSetpoint() {
        const slider = document.getElementById('production-setpoint');
        return { productionRate: parseFloat(slider.value) };
    }

    displayMPCResult(result) {
        const resultDiv = document.getElementById('mpc-result');
        
        resultDiv.innerHTML = `
            <h4>MPC Control Result</h4>
            <p><strong>Type:</strong> ${result.mpcType}</p>
            <p><strong>Optimal Current:</strong> ${result.optimalCurrent.toFixed(1)} A</p>
            <p><strong>Performance:</strong> ${result.performance.setpointAchievement.toFixed(1)}%</p>
            <p><strong>Computation Time:</strong> ${result.computationTime} ms</p>
            <p><strong>Economic Cost:</strong> $${result.cost.total.toFixed(3)}/h</p>
        `;
    }

    displayError(message) {
        const errorDiv = document.getElementById('error-message');
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    }

    async sendControlSignal(current) {
        // Send control signal to backend/Arduino
        try {
            const response = await fetch('/api/mpc/control', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    current: current,
                    timestamp: new Date().toISOString()
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to send control signal');
            }
            
            console.log(`🔧 Control signal sent: ${current}A`);
        } catch (error) {
            console.error('❌ Control signal error:', error);
            this.displayError(`Control Signal Error: ${error.message}`);
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    stop() {
        this.isRunning = false;
        
        // Destroy all charts
        Object.values(this.charts).forEach(chart => {
            chart.destroy();
        });
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.mpcDashboard = new MPCDashboard();
});

module.exports = MPCDashboard;
