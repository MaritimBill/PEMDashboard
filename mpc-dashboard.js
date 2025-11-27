// PEM Electrolyzer MPC Dashboard - Frontend Controller
class MPCDashboard {
    constructor() {
        this.socket = null;
        this.charts = new PEMCharts();
        this.currentData = null;
        this.isConnected = false;
        this.simulationTime = 0;
        
        this.initializeDashboard();
        this.connectWebSocket();
        this.startDataSimulation();
    }

    initializeDashboard() {
        console.log('🏭 Initializing PEM Electrolyzer Dashboard...');
        
        // Initialize all charts
        this.charts.createProductionChart('production-chart');
        this.charts.createEconomicChart('economic-chart');
        this.charts.createSafetyChart('safety-chart');
        this.charts.createMPCComparisonChart('mpc-comparison-chart');
        this.charts.createEfficiencyChart('efficiency-chart');
        
        // Initialize event listeners
        this.initializeEventListeners();
        
        // Update initial display
        this.updateDisplay({
            production: { h2_rate: 0.042, current: 150, setpoint: 50 },
            economics: { energy_cost: 2.1, net_value: 2.4 },
            safety: { temperature: 65, purity: 99.5, efficiency: 65 }
        });
        
        console.log('✅ Dashboard initialized successfully');
    }

    initializeEventListeners() {
        // Control mode selection
        document.getElementById('control-mode').addEventListener('change', (e) => {
            this.handleControlModeChange(e.target.value);
        });

        // Production setpoint slider
        const setpointSlider = document.getElementById('production-setpoint');
        const setpointValue = document.getElementById('setpoint-value');
        
        setpointSlider.addEventListener('input', (e) => {
            const value = e.target.value;
            setpointValue.textContent = `${value}%`;
            this.handleSetpointChange(value);
        });

        // MPC type selection
        document.getElementById('mpc-type-select').addEventListener('change', (e) => {
            this.handleMPCTypeChange(e.target.value);
        });

        // Control buttons
        document.getElementById('start-system').addEventListener('click', () => {
            this.startSystem();
        });

        document.getElementById('stop-system').addEventListener('click', () => {
            this.stopSystem();
        });

        document.getElementById('run-mpc').addEventListener('click', () => {
            this.runMPC();
        });

        document.getElementById('apply-control').addEventListener('click', () => {
            this.applyControl();
        });

        // Neural MPC training
        document.getElementById('train-neural').addEventListener('click', () => {
            this.trainNeuralMPC();
        });
    }

    connectWebSocket() {
        try {
            this.socket = io();
            
            this.socket.on('connect', () => {
                console.log('✅ Connected to server');
                this.isConnected = true;
                this.updateConnectionStatus(true);
            });

            this.socket.on('disconnect', () => {
                console.log('❌ Disconnected from server');
                this.isConnected = false;
                this.updateConnectionStatus(false);
            });

            this.socket.on('system-update', (data) => {
                this.handleSystemUpdate(data);
            });

            this.socket.on('mpc-results', (data) => {
                this.handleMPCResults(data);
            });

            this.socket.on('neural-results', (data) => {
                this.handleNeuralResults(data);
            });

            this.socket.on('arduino-telemetry', (data) => {
                this.handleArduinoData(data);
            });

        } catch (error) {
            console.warn('WebSocket connection failed, running in demo mode:', error);
            this.isConnected = false;
            this.updateConnectionStatus(false);
        }
    }

    startDataSimulation() {
        // Simulate real-time data updates
        setInterval(() => {
            this.simulationTime += 1;
            this.generateSimulatedData();
        }, 1000);

        // Simulate MPC comparison updates
        setInterval(() => {
            this.updateMPCComparison();
        }, 3000);
    }

    generateSimulatedData() {
        const baseH2Rate = 0.042;
        const noise = (Math.random() - 0.5) * 0.008;
        const setpoint = parseInt(document.getElementById('production-setpoint').value) / 100;
        
        const simulatedData = {
            timestamp: new Date().toISOString(),
            production: {
                h2_rate: baseH2Rate * setpoint + noise,
                o2_rate: (baseH2Rate * setpoint + noise) * 0.5,
                current: 100 + (setpoint * 100) + (Math.random() - 0.5) * 10,
                voltage: 38 + (Math.random() - 0.5) * 2,
                efficiency: 65 + (Math.random() - 0.5) * 3,
                setpoint: setpoint
            },
            economics: {
                energy_cost: 2.1 + (Math.random() - 0.5) * 0.2,
                degradation_cost: 0.5 + (Math.random() - 0.5) * 0.1,
                h2_value: 4.2 + (Math.random() - 0.5) * 0.3,
                o2_value: 0.8 + (Math.random() - 0.5) * 0.1,
                net_value: 2.4 + (Math.random() - 0.5) * 0.2
            },
            safety: {
                temperature: 65 + (Math.random() - 0.5) * 4,
                purity: 99.5 + (Math.random() - 0.5) * 0.3,
                voltage: 38 + (Math.random() - 0.5) * 2,
                current: 150 + (Math.random() - 0.5) * 8,
                efficiency: 65 + (Math.random() - 0.5) * 3
            }
        };

        this.handleSystemUpdate(simulatedData);
    }

    handleSystemUpdate(data) {
        this.currentData = data;
        this.updateDisplay(data);
        this.updateCharts(data);
    }

    updateDisplay(data) {
        // Update real-time indicators
        if (data.production) {
            document.getElementById('h2-production').textContent = 
                (data.production.h2_rate * 3600).toFixed(1);
            document.getElementById('o2-production').textContent = 
                (data.production.o2_rate * 3600).toFixed(1);
            document.getElementById('stack-current').textContent = 
                data.production.current.toFixed(1);
            document.getElementById('stack-voltage').textContent = 
                data.production.voltage.toFixed(1);
            document.getElementById('cell-temperature').textContent = 
                data.safety.temperature.toFixed(1);
            document.getElementById('system-efficiency').textContent = 
                data.production.efficiency.toFixed(1);
        }

        // Update safety status
        this.updateSafetyStatus(data.safety);

        // Update economic display
        if (data.economics) {
            this.updateEconomicDisplay(data.economics);
        }
    }

    updateSafetyStatus(safetyData) {
        const safetyPanel = document.getElementById('safety-panel');
        const safetyStatus = document.getElementById('safety-status');
        
        let status = 'NORMAL';
        let statusClass = 'status-normal';
        let panelClass = 'safety-normal';

        if (safetyData.temperature > 75 || safetyData.purity < 99.3) {
            status = 'WARNING';
            statusClass = 'status-warning';
            panelClass = 'safety-warning';
        }
        
        if (safetyData.temperature > 78 || safetyData.purity < 99.0) {
            status = 'CRITICAL';
            statusClass = 'status-danger';
            panelClass = 'safety-critical';
        }

        safetyStatus.textContent = status;
        safetyStatus.className = `safety-status ${statusClass}`;
        safetyPanel.className = `safety-panel ${panelClass}`;

        // Update safety metrics
        document.getElementById('safety-temp').textContent = `${safetyData.temperature.toFixed(1)}°C`;
        document.getElementById('safety-purity').textContent = `${safetyData.purity.toFixed(1)}%`;
        document.getElementById('safety-voltage').textContent = `${safetyData.voltage.toFixed(1)}V`;
    }

    updateEconomicDisplay(economics) {
        const economicData = [
            economics.energy_cost,
            economics.degradation_cost,
            economics.h2_value,
            economics.o2_value,
            economics.net_value
        ];

        this.charts.updateChartData('economic-chart', {
            datasets: [{ data: economicData }]
        });
    }

    updateCharts(data) {
        // Update production chart
        this.charts.addDataPoint('production-chart', this.simulationTime, [
            data.production.h2_rate,
            data.production.setpoint * 0.05, // Scale setpoint to production rate
            data.production.current
        ]);

        // Update efficiency chart
        this.charts.addDataPoint('efficiency-chart', this.simulationTime, [
            data.production.efficiency,
            70 // Theoretical max
        ]);

        // Update safety radar chart
        const safetyMetrics = [
            data.safety.temperature,
            data.safety.purity,
            data.safety.voltage,
            data.safety.current,
            data.safety.efficiency
        ];

        this.charts.updateChartData('safety-chart', {
            datasets: [{ data: safetyMetrics }]
        });
    }

    updateMPCComparison() {
        // Simulate MPC performance updates
        const performanceScores = [
            75 + Math.random() * 10,
            80 + Math.random() * 8,
            78 + Math.random() * 9,
            85 + Math.random() * 7,
            90 + Math.random() * 6
        ];

        const computationTimes = [
            45 + Math.random() * 10,
            120 + Math.random() * 30,
            85 + Math.random() * 20,
            95 + Math.random() * 25,
            150 + Math.random() * 40
        ];

        this.charts.updateChartData('mpc-comparison-chart', {
            datasets: [
                { data: performanceScores },
                { data: computationTimes }
            ]
        });

        // Update HE-NMPC score display
        document.getElementById('he-nmpc-score').textContent = performanceScores[4].toFixed(1);
        document.getElementById('computation-time').textContent = Math.round(computationTimes[4]);
    }

    handleControlModeChange(mode) {
        console.log(`🎛️ Control mode changed to: ${mode}`);
        this.showNotification(`Control mode set to: ${mode}`, 'info');
        
        if (this.socket && this.isConnected) {
            this.socket.emit('control-mode', { mode: mode });
        }
    }

    handleSetpointChange(setpoint) {
        console.log(`🎯 Setpoint changed to: ${setpoint}%`);
        
        if (this.socket && this.isConnected) {
            this.socket.emit('setpoint-change', { setpoint: parseFloat(setpoint) });
        }
    }

    handleMPCTypeChange(mpcType) {
        console.log(`🧠 MPC type changed to: ${mpcType}`);
        this.showNotification(`MPC algorithm set to: ${mpcType}`, 'info');
    }

    startSystem() {
        console.log('🚀 Starting PEM Electrolyzer System...');
        this.showNotification('Starting system...', 'success');
        
        if (this.socket && this.isConnected) {
            this.socket.emit('system-command', { command: 'start' });
        }
        
        document.getElementById('system-status').textContent = 'RUNNING';
        document.getElementById('system-status').className = 'status-badge status-normal';
    }

    stopSystem() {
        console.log('🛑 Stopping PEM Electrolyzer System...');
        this.showNotification('Stopping system...', 'warning');
        
        if (this.socket && this.isConnected) {
            this.socket.emit('system-command', { command: 'stop' });
        }
        
        document.getElementById('system-status').textContent = 'STOPPED';
        document.getElementById('system-status').className = 'status-badge status-danger';
    }

    async runMPC() {
        const mpcType = document.getElementById('mpc-type-select').value;
        console.log(`🧠 Running ${mpcType}...`);
        
        this.showNotification(`Running ${mpcType} optimization...`, 'info');

        try {
            // Simulate MPC computation
            await this.simulateMPCComputation(mpcType);
            
            const result = this.generateMPCResult(mpcType);
            this.displayMPCResult(result);
            
        } catch (error) {
            console.error('MPC computation failed:', error);
            this.showNotification('MPC computation failed!', 'error');
        }
    }

    simulateMPCComputation(mpcType) {
        return new Promise((resolve) => {
            // Simulate computation time based on MPC type
            const computationTimes = {
                'DETERMINISTIC_MPC': 800,
                'STOCHASTIC_MPC': 1500,
                'ROBUST_MPC': 1200,
                'HYBRID_MPC': 1000,
                'HE_NMPC': 2000
            };
            
            setTimeout(resolve, computationTimes[mpcType] || 1000);
        });
    }

    generateMPCResult(mpcType) {
        const basePerformance = {
            'DETERMINISTIC_MPC': 75,
            'STOCHASTIC_MPC': 82,
            'ROBUST_MPC': 78,
            'HYBRID_MPC': 85,
            'HE_NMPC': 92
        };

        const performance = basePerformance[mpcType] + (Math.random() - 0.5) * 8;
        const current = 100 + Math.random() * 80;
        
        return {
            mpcType: mpcType,
            optimalCurrent: current,
            performance: performance,
            computationTime: 50 + Math.random() * 100,
            cost: {
                total: 1.5 + Math.random() * 1.0,
                energy: 2.0 + Math.random() * 0.5,
                netValue: 2.2 + Math.random() * 0.8
            },
            constraints: {
                temperature: 65 + Math.random() * 10,
                purity: 99.3 + Math.random() * 0.5,
                satisfied: Math.random() > 0.1
            }
        };
    }

    displayMPCResult(result) {
        const resultDiv = document.getElementById('mpc-result');
        
        resultDiv.innerHTML = `
            <h4>🎯 MPC Control Result</h4>
            <div class="result-grid">
                <div class="result-item">
                    <strong>Type:</strong> ${result.mpcType}
                </div>
                <div class="result-item">
                    <strong>Optimal Current:</strong> ${result.optimalCurrent.toFixed(1)} A
                </div>
                <div class="result-item">
                    <strong>Performance Score:</strong> ${result.performance.toFixed(1)}%
                </div>
                <div class="result-item">
                    <strong>Computation Time:</strong> ${result.computationTime.toFixed(0)} ms
                </div>
                <div class="result-item">
                    <strong>Economic Cost:</strong> $${result.cost.total.toFixed(3)}/h
                </div>
                <div class="result-item">
                    <strong>Constraints:</strong> 
                    <span class="${result.constraints.satisfied ? 'metric-good' : 'metric-danger'}">
                        ${result.constraints.satisfied ? 'SATISFIED' : 'VIOLATED'}
                    </span>
                </div>
            </div>
        `;
        
        resultDiv.style.display = 'block';
        this.showNotification(`${result.mpcType} completed successfully!`, 'success');
    }

    applyControl() {
        console.log('🔧 Applying MPC control...');
        this.showNotification('Applying optimal control...', 'success');
        
        // In real implementation, this would send the control signal to the Arduino
        setTimeout(() => {
            this.showNotification('Control applied successfully!', 'success');
        }, 500);
    }

    async trainNeuralMPC() {
        console.log('🧠 Training Neural MPC...');
        this.showNotification('Starting Neural MPC training...', 'info');

        try {
            // Simulate training process
            await this.simulateTraining();
            this.showNotification('Neural MPC training completed!', 'success');
            
        } catch (error) {
            console.error('Neural training failed:', error);
            this.showNotification('Neural training failed!', 'error');
        }
    }

    simulateTraining() {
        return new Promise((resolve) => {
            let progress = 0;
            const interval = setInterval(() => {
                progress += 5;
                this.updateTrainingProgress(progress);
                
                if (progress >= 100) {
                    clearInterval(interval);
                    resolve();
                }
            }, 200);
        });
    }

    updateTrainingProgress(progress) {
        const progressBar = document.getElementById('training-progress');
        const progressText = document.getElementById('training-progress-text');
        
        if (progressBar && progressText) {
            progressBar.style.width = `${progress}%`;
            progressText.textContent = `${progress}%`;
        }
    }

    handleMPCResults(data) {
        console.log('📊 Received MPC results:', data);
        this.displayMPCResult(data);
    }

    handleNeuralResults(data) {
        console.log('🧠 Received neural results:', data);
        this.showNotification('Neural prediction updated', 'info');
    }

    handleArduinoData(data) {
        console.log('🔌 Received Arduino data:', data);
        // Update display with real Arduino data
        this.updateDisplay({
            production: {
                h2_rate: data.h2ProductionRate || 0.042,
                current: data.appliedCurrent || 150,
                voltage: data.stackVoltage || 38,
                efficiency: 65
            },
            safety: {
                temperature: data.cellTemperature || 65,
                purity: data.o2Purity || 99.5
            }
        });
    }

    updateConnectionStatus(connected) {
        const statusElement = document.getElementById('connection-status');
        if (statusElement) {
            statusElement.textContent = connected ? 'CONNECTED' : 'DISCONNECTED';
            statusElement.className = `status-badge ${connected ? 'status-normal' : 'status-danger'}`;
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.remove()">×</button>
        `;

        // Add to notification container
        const container = document.getElementById('notification-container') || this.createNotificationContainer();
        container.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    createNotificationContainer() {
        const container = document.createElement('div');
        container.id = 'notification-container';
        container.className = 'notification-container';
        document.body.appendChild(container);
        return container;
    }

    // Utility method to get current setpoint
    getCurrentSetpoint() {
        return parseInt(document.getElementById('production-setpoint').value);
    }

    // Cleanup method
    destroy() {
        if (this.socket) {
            this.socket.disconnect();
        }
        this.charts.destroyAllCharts();
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.pemDashboard = new MPCDashboard();
});
