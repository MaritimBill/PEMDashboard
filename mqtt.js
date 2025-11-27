const mqtt = require('mqtt');
const axios = require('axios');

class MQTTClient {
    constructor(io) {
        this.io = io;
        this.client = null;
        this.connected = false;
        this.arduinoData = {};
        
        this.config = {
            brokerUrl: process.env.MQTT_BROKER || 'mqtt://localhost:1883',
            topics: {
                arduinoTelemetry: 'pem/arduino/telemetry',
                arduinoControl: 'pem/arduino/control',
                matlabBridge: 'pem/matlab/bridge',
                mpcCommands: 'pem/mpc/commands'
            }
        };
        
        this.connect();
    }

    connect() {
        try {
            this.client = mqtt.connect(this.config.brokerUrl);
            
            this.client.on('connect', () => {
                console.log('✅ MQTT Connected to broker');
                this.connected = true;
                
                // Subscribe to topics
                Object.values(this.config.topics).forEach(topic => {
                    this.client.subscribe(topic, (err) => {
                        if (!err) {
                            console.log(`📡 Subscribed to ${topic}`);
                        }
                    });
                });
            });

            this.client.on('message', (topic, message) => {
                this.handleMessage(topic, message.toString());
            });

            this.client.on('error', (error) => {
                console.error('❌ MQTT Error:', error);
                this.connected = false;
            });

        } catch (error) {
            console.error('❌ MQTT Connection failed:', error);
        }
    }

    handleMessage(topic, message) {
        try {
            const data = JSON.parse(message);
            
            switch(topic) {
                case this.config.topics.arduinoTelemetry:
                    this.handleArduinoTelemetry(data);
                    break;
                    
                case this.config.topics.matlabBridge:
                    this.handleMatlabData(data);
                    break;
                    
                case this.config.topics.mpcCommands:
                    this.handleMPCCommands(data);
                    break;
            }
        } catch (error) {
            console.error('❌ MQTT Message parsing error:', error);
        }
    }

    handleArduinoTelemetry(data) {
        this.arduinoData = { ...this.arduinoData, ...data };
        
        // Broadcast to all connected dashboard clients
        this.io.emit('arduino-telemetry', {
            ...data,
            timestamp: new Date().toISOString()
        });

        // Forward to MATLAB if needed
        this.forwardToMatlab(data);
    }

    handleMatlabData(data) {
        // Process MATLAB simulation data
        this.io.emit('matlab-data', data);
    }

    handleMPCCommands(data) {
        // Handle MPC control commands
        this.io.emit('mpc-command', data);
    }

    async publishControlSignal(controlData) {
        if (!this.connected) {
            console.warn('⚠️ MQTT not connected, cannot publish control signal');
            return false;
        }

        try {
            const message = JSON.stringify({
                ...controlData,
                timestamp: new Date().toISOString(),
                type: 'MPC_CONTROL'
            });

            this.client.publish(this.config.topics.arduinoControl, message);
            console.log('📤 MQTT Control signal published:', controlData.optimalCurrent);
            return true;
        } catch (error) {
            console.error('❌ MQTT Publish error:', error);
            return false;
        }
    }

    async forwardToMatlab(data) {
        // Forward data to MATLAB via HTTP bridge
        try {
            await axios.post('http://localhost:8080/telemetry', data);
        } catch (error) {
            // MATLAB bridge might not be running, this is normal
        }
    }

    getArduinoData() {
        return this.arduinoData;
    }

    isConnected() {
        return this.connected;
    }
}

module.exports = { MQTTClient };
