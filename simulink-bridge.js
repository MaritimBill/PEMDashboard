// simulink-bridge.js - MATLAB BRIDGE ENHANCED
const mqttClient = require('./mqtt');

class SimulinkBridge {
    constructor() {
        this.matlabStatus = 'disconnected';
        this.lastPEMData = null;
    }

    connectToMATLAB() {
        console.log('🔗 Connecting to MATLAB PEM Simulation...');
        
        // Listen for PEM data from MATLAB
        mqttClient.onPEMData((data) => {
            this.lastPEMData = data;
            this.matlabStatus = 'connected';
            
            console.log('📊 MATLAB→Web: O₂=' + data.o2_production + 'L/min, Eff=' + data.efficiency + '%');
            
            // Update frontend via WebSocket or store in database
            this.broadcastToFrontend(data);
        });
        
        // Listen for neural controls to forward to MATLAB
        mqttClient.onNeuralControl((control) => {
            console.log('🎯 Web→MATLAB: Neural control received');
            this.forwardToMATLAB(control);
        });
    }

    broadcastToFrontend(data) {
        // Broadcast to all connected frontend clients
        if (global.io) {
            global.io.emit('pem_data', data);
        }
        
        // Update charts
        if (global.chartManager) {
            global.chartManager.updateAllCharts(data);
        }
    }

    forwardToMATLAB(control) {
        // Enhanced control forwarding with validation
        const validatedControl = {
            ...control,
            validated_at: new Date().toISOString(),
            safety_checked: this.safetyCheck(control)
        };
        
        mqttClient.sendToMATLAB(validatedControl);
    }

    safetyCheck(control) {
        // Basic safety validation
        if (control.optimal_current > 200 || control.optimal_current < 100) {
            console.log('🚨 Safety check failed: Current out of range');
            return false;
        }
        return true;
    }

    getSystemStatus() {
        return {
            matlab: this.matlabStatus,
            last_update: this.lastPEMData ? this.lastPEMData.timestamp : null,
            pem_performance: this.lastPEMData ? {
                o2_production: this.lastPEMData.o2_production,
                efficiency: this.lastPEMData.efficiency,
                temperature: this.lastPEMData.current_temp
            } : null
        };
    }
}

// Export singleton
const simulinkBridge = new SimulinkBridge();
module.exports = simulinkBridge;
