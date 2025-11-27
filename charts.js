// charts.js - ENHANCED WITH NEURAL VISUALIZATION
class NeuralCharts {
    constructor() {
        this.optimalCurrentChart = null;
        this.efficiencyChart = null;
        this.costChart = null;
        this.initCharts();
    }

    initCharts() {
        // Optimal Current Chart
        this.optimalCurrentChart = new Chart('optimal-current-chart', {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Neural Optimal Current (A)',
                    data: [],
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1
                }]
            }
        });

        // Efficiency Prediction Chart
        this.efficiencyChart = new Chart('efficiency-chart', {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Actual Efficiency (%)',
                        data: [],
                        borderColor: 'rgb(255, 99, 132)'
                    },
                    {
                        label: 'Neural Prediction (%)',
                        data: [],
                        borderColor: 'rgb(54, 162, 235)'
                    }
                ]
            }
        });

        // Cost Optimization Chart
        this.costChart = new Chart('cost-chart', {
            type: 'bar',
            data: {
                labels: ['Current', 'Neural Optimal'],
                datasets: [{
                    label: 'Cost (KES/m³ O₂)',
                    data: [0, 0],
                    backgroundColor: ['rgba(255, 99, 132, 0.5)', 'rgba(75, 192, 192, 0.5)']
                }]
            }
        });
    }

    updateNeuralOptimization(neuralData) {
        // Update optimal current chart
        this.updateChart(this.optimalCurrentChart, neuralData.optimal_current);
        
        // Update efficiency comparison
        this.updateEfficiencyComparison(neuralData.expected_efficiency);
        
        // Update cost comparison
        this.updateCostComparison(neuralData.cost_per_m3);
        
        console.log('📈 Charts updated with neural optimization');
    }

    updateEfficiencyComparison(predictedEfficiency) {
        // Add current actual efficiency from PEM data
        const currentEfficiency = this.getCurrentEfficiency(); // From PEM telemetry
        
        this.efficiencyChart.data.labels.push(new Date().toLocaleTimeString());
        this.efficiencyChart.data.datasets[0].data.push(currentEfficiency);
        this.efficiencyChart.data.datasets[1].data.push(predictedEfficiency);
        
        // Keep last 20 points
        if (this.efficiencyChart.data.labels.length > 20) {
            this.efficiencyChart.data.labels.shift();
            this.efficiencyChart.data.datasets[0].data.shift();
            this.efficiencyChart.data.datasets[1].data.shift();
        }
        
        this.efficiencyChart.update();
    }

    updateCostComparison(optimalCost) {
        const currentCost = this.calculateCurrentCost(); // From current operation
        
        this.costChart.data.datasets[0].data = [currentCost, optimalCost];
        this.costChart.update();
        
        // Show savings
        const savings = ((currentCost - optimalCost) / currentCost * 100).toFixed(1);
        document.getElementById('cost-savings').textContent = savings + '%';
    }

    calculateCurrentCost() {
        // Calculate current operational cost
        // This would use real-time data from PEM system
        return 4.2; // Example current cost
    }

    getCurrentEfficiency() {
        // Get current efficiency from PEM telemetry
        return 72.5; // Example current efficiency
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    window.neuralCharts = new NeuralCharts();
});
