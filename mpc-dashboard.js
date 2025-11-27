class Dashboard {
    constructor() {
        this.socket = io();
        this.currentData = null;
        this.charts = {};
        this.isInitialized = false;
        
        // MPC comparison state
        this.comparisonData = null;
        this.selectedAlgorithm = 'HENMPC';
        
        this.initialize();
    }

    initialize() {
        this.setupEventListeners();
        this.setupSocketListeners();
        this.initializeCharts();
        this.loadInitialData();
        
        this.isInitialized = true;
        console.log('🎛️ Dashboard initialized');
    }

    setupEventListeners() {
        // Control buttons
        document.getElementById('startSystem')?.addEventListener('click', () => this.sendControlCommand('START'));
        document.getElementById('stopSystem')?.addEventListener('click', () => this.sendControlCommand('STOP'));
        document.getElementById('emergencyStop')?.addEventListener('click', () => this.emergencyStop());

        // Mode selection
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.setMode(e.target.dataset.mode));
        });

        // Slider control
        const slider = document.getElementById('productionSlider');
        if (slider) {
            slider.addEventListener('input', (e) => this.handleSliderChange(e.target.value));
        }

        // MPC comparison
        document.getElementById('runComparison')?.addEventListener('click', () => this.runMPCComparison());
        
        // Algorithm selection
        document.querySelectorAll('.algorithm-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.selectAlgorithm(e.target.dataset.algorithm));
        });

        // Refresh data
        document.getElementById('refreshData')?.addEventListener('click', () => this.refreshData());
    }

    setupSocketListeners() {
        // Real-time data updates
        this.socket.on('real-time-data', (data) => {
            this.currentData = data;
            this.updateDashboard(data);
        });

        // Sensor updates
        this.socket.on('sensor-update', (data) => {
            this.updateSensorDisplays(data);
        });

        // Simulation updates
        this.socket.on('simulation-update', (data) => {
            this.updateSimulationDisplays(data);
        });

        // MPC comparison results
        this.socket.on('mpc-comparison-results', (data) => {
            this.comparisonData = data;
            this.updateMPCComparison(data);
        });

        // System alerts
        this.socket.on('system-alert', (alert) => {
            this.showAlert(alert);
        });

        // Connection status
        this.socket.on('connect', () => {
            this.updateConnectionStatus('connected');
        });

        this.socket.on('disconnect', () => {
            this.updateConnectionStatus('disconnected');
        });
    }

    initializeCharts() {
        // Initialize all charts using Chart.js
        this.initializeTimeSeriesChart();
        this.initializeMPCComparisonChart();
        this.initializeEfficiencyChart();
        this.initializeCostChart();
    }

    initializeTimeSeriesChart() {
        const ctx = document.getElementById('timeSeriesChart')?.getContext('2d');
        if (!ctx) return;

        this.charts.timeSeries = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Temperature (°C)',
                        data: [],
                        borderColor: 'rgb(255, 99, 132)',
                        backgroundColor: 'rgba(255, 99, 132, 0.1)',
                        yAxisID: 'y'
                    },
                    {
                        label: 'Current (A)',
                        data: [],
                        borderColor: 'rgb(54, 162, 235)',
                        backgroundColor: 'rgba(54, 162, 235, 0.1)',
                        yAxisID: 'y1'
                    },
                    {
                        label: 'Voltage (V)',
                        data: [],
                        borderColor: 'rgb(75, 192, 192)',
                        backgroundColor: 'rgba(75, 192, 192, 0.1)',
                        yAxisID: 'y'
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
                        type: 'time',
                        time: {
                            unit: 'minute'
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        grid: {
                            drawOnChartArea: false,
                        },
                    }
                }
            }
        });
    }

    initializeMPCComparisonChart() {
        const ctx = document.getElementById('mpcComparisonChart')?.getContext('2d');
        if (!ctx) return;

        this.charts.mpcComparison = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Performance', 'Stability', 'Speed', 'Efficiency', 'Cost Saving'],
                datasets: []
            },
            options: {
                responsive: true,
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

    initializeEfficiencyChart() {
        const ctx = document.getElementById('efficiencyChart')?.getContext('2d');
        if (!ctx) return;

        this.charts.efficiency = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Energy Used', 'System Losses', 'Useful Output'],
                datasets: [{
                    data: [70, 20, 10],
                    backgroundColor: [
                        'rgb(54, 162, 235)',
                        'rgb(255, 99, 132)',
                        'rgb(75, 192, 192)'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                    }
                }
            }
        });
    }

    initializeCostChart() {
        const ctx = document.getElementById('costChart')?.getContext('2d');
        if (!ctx) return;

        this.charts.cost = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['HENMPC', 'Standard', 'MI-MPC', 'Stochastic', 'HEMPC'],
                datasets: [{
                    label: 'Cost per hour (KES)',
                    data: [450, 520, 480, 470, 460],
                    backgroundColor: 'rgba(153, 102, 255, 0.6)'
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Cost (KES/hour)'
                        }
                    }
                }
            }
        });
    }

    updateDashboard(data) {
        // Update main metrics
        this.updateMetric('temperatureValue', `${data.temperature?.toFixed(1) || '--'}°C`);
        this.updateMetric('voltageValue', `${data.voltage?.toFixed(1) || '--'}V`);
        this.updateMetric('currentValue', `${data.current?.toFixed(1) || '--'}A`);
        this.updateMetric('purityValue', `${data.o2Purity?.toFixed(1) || '--'}%`);
        this.updateMetric('productionValue', `${data.productionRate?.toFixed(0) || '--'}%`);
        this.updateMetric('batteryValue', `${data.battery?.toFixed(0) || '--'}%`);
        
        // Update system status
        this.updateSystemStatus(data.mode, data.state);
        
        // Update time series chart
        this.updateTimeSeriesChart(data);
    }

    updateSensorDisplays(data) {
        // Update specific sensor values with animation
        this.animateValueChange('temperatureValue', data.temperature, '°C');
        this.animateValueChange('voltageValue', data.voltage, 'V');
        this.animateValueChange('currentValue', data.current, 'A');
        this.animateValueChange('purityValue', data.o2Purity, '%');
    }

    updateSimulationDisplays(data) {
        // Update simulation-specific displays
        this.updateMetric('h2Production', `${data.h2Production?.toFixed(2) || '--'} L/h`);
        this.updateMetric('o2Production', `${data.o2Production?.toFixed(2) || '--'} L/h`);
        this.updateMetric('efficiencyValue', `${data.systemEfficiency?.toFixed(1) || '--'}%`);
        this.updateMetric('powerValue', `${data.powerConsumption?.toFixed(2) || '--'} kW`);
    }

    updateMPCComparison(data) {
        if (!data || !data.algorithms) return;

        // Update comparison table
        this.updateComparisonTable(data.algorithms);
        
        // Update radar chart
        this.updateRadarChart(data.algorithms);
        
        // Update recommendations
        this.updateRecommendations(data.recommendations);
    }

    updateComparisonTable(algorithms) {
        const tableBody = document.getElementById('comparisonTableBody');
        if (!tableBody) return;

        tableBody.innerHTML = '';

        Object.entries(algorithms).forEach(([name, algo]) => {
            if (algo.error) return;

            const row = document.createElement('tr');
            if (name === this.selectedAlgorithm) {
                row.classList.add('table-primary');
            }

            row.innerHTML = `
                <td>${name}</td>
                <td>${algo.optimalCurrent?.toFixed(1) || '--'} A</td>
                <td>${algo.performance?.toFixed(1) || '--'}%</td>
                <td>${algo.stability?.toFixed(1) || '--'}%</td>
                <td>${algo.computationTime?.toFixed(0) || '--'} ms</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" 
                            onclick="dashboard.selectAlgorithm('${name}')">
                        Select
                    </button>
                </td>
            `;

            tableBody.appendChild(row);
        });
    }

    updateRadarChart(algorithms) {
        if (!this.charts.mpcComparison) return;

        const datasets = [];
        const colors = {
            HENMPC: 'rgb(255, 99, 132)',
            STANDARD_MPC: 'rgb(54, 162, 235)',
            MIXED_INTEGER_MPC: 'rgb(255, 205, 86)',
            STOCHASTIC_MPC: 'rgb(75, 192, 192)',
            HEMPC: 'rgb(153, 102, 255)'
        };

        Object.entries(algorithms).forEach(([name, algo]) => {
            if (algo.error) return;

            datasets.push({
                label: name,
                data: [
                    algo.performance || 70,
                    algo.stability || 70,
                    100 - Math.min((algo.computationTime || 50) / 100, 1) * 100,
                    algo.predictedEfficiency || 70,
                    algo.costSaving || 70
                ],
                backgroundColor: this.hexToRgba(colors[name] || 'rgb(128, 128, 128)', 0.2),
                borderColor: colors[name] || 'rgb(128, 128, 128)',
                pointBackgroundColor: colors[name] || 'rgb(128, 128, 128)'
            });
        });

        this.charts.mpcComparison.data.datasets = datasets;
        this.charts.mpcComparison.update();
    }

    updateRecommendations(recommendations) {
        const container = document.getElementById('recommendationsContainer');
        if (!container) return;

        container.innerHTML = '';

        if (recommendations && recommendations.bestAlgorithm) {
            const alert = document.createElement('div');
            alert.className = 'alert alert-success';
            alert.innerHTML = `
                <h5>🎯 Recommended Algorithm: ${recommendations.bestAlgorithm}</h5>
                <p class="mb-0">${recommendations.recommendation || 'This algorithm provides the best overall performance for current conditions.'}</p>
            `;
            container.appendChild(alert);
        }
    }

    updateTimeSeriesChart(data) {
        if (!this.charts.timeSeries) return;

        const now = new Date();
        const labels = this.charts.timeSeries.data.labels;
        const tempData = this.charts.timeSeries.data.datasets[0].data;
        const currentData = this.charts.timeSeries.data.datasets[1].data;
        const voltageData = this.charts.timeSeries.data.datasets[2].data;

        // Add new data point
        labels.push(now);
        tempData.push(data.temperature);
        currentData.push(data.current);
        voltageData.push(data.voltage);

        // Keep only last 50 points
        if (labels.length > 50) {
            labels.shift();
            tempData.shift();
            currentData.shift();
            voltageData.shift();
        }

        this.charts.timeSeries.update();
    }

    updateSystemStatus(mode, state) {
        const statusElement = document.getElementById('systemStatus');
        const modeElement = document.getElementById('systemMode');
        
        if (statusElement) {
            statusElement.textContent = state || 'UNKNOWN';
            statusElement.className = `status-${(state || '').toLowerCase()}`;
        }
        
        if (modeElement) {
            modeElement.textContent = mode || 'NO MODE';
        }
    }

    updateConnectionStatus(status) {
        const indicator = document.getElementById('connectionStatus');
        if (!indicator) return;

        indicator.textContent = status === 'connected' ? '🟢 Connected' : '🔴 Disconnected';
        indicator.className = `connection-${status}`;
    }

    updateMetric(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    }

    animateValueChange(elementId, newValue, unit) {
        const element = document.getElementById(elementId);
        if (!element || newValue === undefined) return;

        const oldValue = parseFloat(element.textContent) || 0;
        const difference = Math.abs(newValue - oldValue);

        if (difference > 0.1) {
            element.classList.add('value-changing');
            setTimeout(() => {
                element.textContent = `${newValue.toFixed(1)}${unit}`;
                element.classList.remove('value-changing');
            }, 300);
        }
    }

    // Control methods
    sendControlCommand(command) {
        this.socket.emit('control-command', {
            type: 'system_command',
            command: command,
            timestamp: new Date()
        });
        
        this.showToast(`Command sent: ${command}`, 'success');
    }

    setMode(mode) {
        this.socket.emit('set-mode', {
            mode: mode,
            setpoint: this.currentData?.productionRate || 30,
            timestamp: new Date()
        });
        
        // Update UI
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });
        
        this.showToast(`Mode changed to: ${mode}`, 'info');
    }

    handleSliderChange(value) {
        this.socket.emit('control-command', {
            type: 'production_rate',
            value: parseFloat(value),
            timestamp: new Date()
        });
        
        this.updateMetric('productionValue', `${value}%`);
    }

    selectAlgorithm(algorithm) {
        this.selectedAlgorithm = algorithm;
        
        // Update UI
        document.querySelectorAll('.algorithm-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.algorithm === algorithm);
        });
        
        // Send selection to server
        this.socket.emit('control-command', {
            type: 'algorithm_selection',
            algorithm: algorithm,
            timestamp: new Date()
        });
        
        this.showToast(`Algorithm selected: ${algorithm}`, 'info');
    }

    runMPCComparison() {
        this.socket.emit('control-command', {
            type: 'run_comparison',
            timestamp: new Date()
        });
        
        this.showToast('Running MPC algorithm comparison...', 'info');
    }

    emergencyStop() {
        if (confirm('Are you sure you want to perform an emergency stop? This will immediately shut down the system.')) {
            this.socket.emit('control-command', {
                type: 'emergency_stop',
                timestamp: new Date()
            });
            
            this.showToast('🛑 EMERGENCY STOP ACTIVATED', 'danger');
        }
    }

    refreshData() {
        this.socket.emit('control-command', {
            type: 'refresh_data',
            timestamp: new Date()
        });
        
        this.showToast('Refreshing system data...', 'info');
    }

    loadInitialData() {
        // Load any initial data needed
        this.showToast('Dashboard loaded successfully', 'success');
    }

    // Utility methods
    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(4, 6), 16);
        const g = parseInt(hex.slice(6, 8), 16);
        const b = parseInt(hex.slice(8, 10), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    showToast(message, type = 'info') {
        // Simple toast notification
        const toast = document.createElement('div');
        toast.className = `alert alert-${type} alert-dismissible fade show`;
        toast.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        const container = document.getElementById('toastContainer') || document.body;
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 5000);
    }

    showAlert(alert) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${alert.priority === 'high' ? 'danger' : 'warning'} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            <h5>🚨 ${alert.title || 'System Alert'}</h5>
            <p class="mb-2">${alert.message}</p>
            <small>${new Date(alert.timestamp).toLocaleString()}</small>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        const container = document.getElementById('alertsContainer');
        if (container) {
            container.appendChild(alertDiv);
        }
        
        // Also show as toast
        this.showToast(alert.message, alert.priority === 'high' ? 'danger' : 'warning');
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new Dashboard();
});
