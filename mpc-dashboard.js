// public/js/mpc-dashboard.js
class MPCDashboard {
    constructor() {
        this.charts = {};
        this.currentData = null;
        this.initCharts();
    }

    initCharts() {
        // Efficiency Comparison Chart
        this.charts.efficiency = new Chart('efficiencyChart', {
            type: 'bar',
            data: {
                labels: ['HE-NMPC', 'Standard', 'Mixed-Integer', 'Stochastic', 'HEMPC'],
                datasets: [{
                    label: 'Efficiency (%)',
                    data: [0, 0, 0, 0, 0],
                    backgroundColor: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7']
                }]
            }
        });

        // Cost Comparison Chart
        this.charts.cost = new Chart('costChart', {
            type: 'bar',
            data: {
                labels: ['HE-NMPC', 'Standard', 'Mixed-Integer', 'Stochastic', 'HEMPC'],
                datasets: [{
                    label: 'Cost (KES/m³)',
                    data: [0, 0, 0, 0, 0],
                    backgroundColor: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7']
                }]
            }
        });

        // Performance Radar Chart
        this.charts.performance = new Chart('performanceChart', {
            type: 'radar',
            data: {
                labels: ['Efficiency', 'Cost', 'Response Time', 'Stability', 'O₂ Production'],
                datasets: []
            }
        });
    }

    async runComparison() {
        try {
            const response = await fetch('/api/mpc/compare');
            const data = await response.json();
            this.currentData = data;
            this.updateDashboard(data);
        } catch (error) {
            console.error('MPC Comparison failed:', error);
        }
    }

    updateDashboard(data) {
        // Update ranking
        this.updateRanking(data.comparison.ranking);
        
        // Update MPC cards
        this.updateMPCCards(data.comparison.individual_results);
        
        // Update charts
        this.updateCharts(data.comparison.performance_metrics);
        
        // Update real data
        this.updateRealData(data.real_data);
    }

    updateRanking(ranking) {
        const rankingList = document.getElementById('ranking-list');
        rankingList.innerHTML = ranking.map((rank, index) => `
            <div class="ranking">
                ${index + 1}. ${rank.mpcType} (Score: ${rank.score.toFixed(3)})
            </div>
        `).join('');
    }

    updateMPCCards(mpcResults) {
        Object.keys(mpcResults).forEach(mpcType => {
            const result = mpcResults[mpcType];
            const card = document.querySelector(`.${mpcType.toLowerCase().replace('-', '')} .performance`);
            if (card) {
                card.innerHTML = `
                    Current: ${result.optimal_current}A<br>
                    Cost: ${result.cost?.toFixed(2) || result.total_cost?.toFixed(2)} KES<br>
                    Computation: ${result.computation_time?.toFixed(3)}s
                `;
            }
        });
    }

    updateCharts(metrics) {
        // Update efficiency chart
        this.charts.efficiency.data.datasets[0].data = [
            metrics['HE-NMPC'].efficiency,
            metrics['Standard-MPC'].efficiency,
            metrics['MixedInteger-MPC'].efficiency,
            metrics['Stochastic-MPC'].efficiency,
            metrics['HEMPC'].efficiency
        ];
        this.charts.efficiency.update();

        // Update cost chart
        this.charts.cost.data.datasets[0].data = [
            metrics['HE-NMPC'].cost,
            metrics['Standard-MPC'].cost,
            metrics['MixedInteger-MPC'].cost,
            metrics['Stochastic-MPC'].cost,
            metrics['HEMPC'].cost
        ];
        this.charts.cost.update();

        // Update radar chart
        this.charts.performance.data.datasets = Object.keys(metrics).map((mpcType, index) => ({
            label: mpcType,
            data: [
                metrics[mpcType].efficiency,
                1 / metrics[mpcType].cost * 10, // Normalize cost
                1 / metrics[mpcType].response_time * 10, // Normalize response time
                metrics[mpcType].stability * 100,
                metrics[mpcType].o2_production
            ],
            backgroundColor: this.getColor(mpcType, 0.2),
            borderColor: this.getColor(mpcType, 1),
            borderWidth: 2
        }));
        this.charts.performance.update();
    }

    updateRealData(realData) {
        document.getElementById('weather-data').textContent = 
            `Weather: ${realData.weather.current.temperature}°C, ${realData.weather.source}`;
        
        document.getElementById('electricity-data').textContent = 
            `Electricity: ${realData.electricity.current_price} KES/kWh (${realData.electricity.period})`;
        
        document.getElementById('hospital-data').textContent = 
            `Hospital Demand: ${realData.hospital.current_demand.toFixed(1)} m³/hour`;
    }

    getColor(mpcType, alpha) {
        const colors = {
            'HE-NMPC': `rgba(255, 107, 107, ${alpha})`,
            'Standard-MPC': `rgba(78, 205, 196, ${alpha})`,
            'MixedInteger-MPC': `rgba(69, 183, 209, ${alpha})`,
            'Stochastic-MPC': `rgba(150, 206, 180, ${alpha})`,
            'HEMPC': `rgba(255, 234, 167, ${alpha})`
        };
        return colors[mpcType] || `rgba(100, 100, 100, ${alpha})`;
    }
}

// Global functions for buttons
const dashboard = new MPCDashboard();

function runMPCComparison() {
    dashboard.runComparison();
}

function startRealTimeMonitoring() {
    setInterval(() => dashboard.runComparison(), 30000); // Every 30 seconds
}

// Initialize on load
document.addEventListener('DOMContentLoaded', function() {
    dashboard.runComparison();
});
