const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const mqtt = require('./mqtt');
const MPCComparator = require('./mpc-comparator');
const NeuralMPC = require('./neural-mpc');

class PEMDashboard {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = socketIo(this.server);
        this.port = process.env.PORT || 3000;
        
        // Initialize components
        this.mqttClient = new mqtt.MQTTClient(this.io);
        this.mpcComparator = new MPCComparator();
        this.neuralMPC = new NeuralMPC();
        
        this.setupExpress();
        this.setupSocketIO();
        this.startDataSimulation();
    }

    setupExpress() {
        this.app.use(express.static(path.join(__dirname, 'public')));
        this.app.use(express.json());
        
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, 'views', 'index.html'));
        });

        this.app.get('/mpc-comparison', (req, res) => {
            res.sendFile(path.join(__dirname, 'views', 'mpc-comparator.html'));
        });

        this.app.get('/neural-mpc', (req, res) => {
            res.sendFile(path.join(__dirname, 'views', 'neural-mpc.html'));
        });

        // API endpoints
        this.app.post('/api/mpc/control', (req, res) => {
            this.handleMPCControl(req.body, res);
        });

        this.app.get('/api/system/status', (req, res) => {
            res.json(this.getSystemStatus());
        });

        this.app.post('/api/neural/train', async (req, res) => {
            try {
                await this.neuralMPC.trainModel();
                res.json({ success: true, message: 'Neural MPC model trained successfully' });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });
    }

    setupSocketIO() {
        this.io.on('connection', (socket) => {
            console.log('Client connected:', socket.id);

            socket.on('mpc-command', (data) => {
                this.handleMPCCommand(data, socket);
            });

            socket.on('neural-prediction', (data) => {
                this.handleNeuralPrediction(data, socket);
            });

            socket.on('disconnect', () => {
                console.log('Client disconnected:', socket.id);
            });
        });

        // Broadcast system data every second
        setInterval(() => {
            const systemData = this.generateSystemData();
            this.io.emit('system-update', systemData);
        }, 1000);
    }

    generateSystemData() {
        const timestamp = new Date().toISOString();
        
        return {
            timestamp,
            production: {
                h2_rate: 0.042 + Math.random() * 0.01,
                o2_rate: 0.021 + Math.random() * 0.005,
                current: 150 + Math.random() * 10,
                voltage: 38 + Math.random() * 2,
                efficiency: 65 + Math.random() * 5
            },
            storage: {
                h2_level: 50 + Math.random() * 20,
                o2_level: 50 + Math.random() * 20,
                pressure: 30 + Math.random() * 5
            },
            safety: {
                temperature: 65 + Math.random() * 5,
                purity: 99.5 + Math.random() * 0.3,
                status: 'NORMAL'
            },
            economics: {
                electricity_cost: 0.12 + Math.random() * 0.02,
                production_cost: 2.5 + Math.random() * 0.3,
                value_generated: 5.2 + Math.random() * 0.4
            }
        };
    }

    async handleMPCControl(data, res) {
        try {
            const mpcType = data.mpcType || 'HE_NMPC';
            const result = await this.mpcComparator.computeControl(mpcType, data);
            
            // Send control signal to Arduino via MQTT
            await this.mqttClient.publishControlSignal(result);
            
            res.json({
                success: true,
                mpcType,
                optimal_current: result.optimalCurrent,
                performance: result.performance
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    handleMPCCommand(data, socket) {
        this.mpcComparator.evaluateMPC(data.scenario)
            .then(results => {
                socket.emit('mpc-results', results);
            })
            .catch(error => {
                socket.emit('mpc-error', { error: error.message });
            });
    }

    async handleNeuralPrediction(data, socket) {
        try {
            const prediction = await this.neuralMPC.predict(data.inputs);
            socket.emit('neural-results', prediction);
        } catch (error) {
            socket.emit('neural-error', { error: error.message });
        }
    }

    getSystemStatus() {
        return {
            status: 'OPERATIONAL',
            mode: 'AUTO',
            uptime: process.uptime(),
            connections: this.io.engine.clientsCount,
            lastUpdate: new Date().toISOString()
        };
    }

    startDataSimulation() {
        // Simulate real-time data updates
        setInterval(() => {
            const comparisonData = this.mpcComparator.generateComparisonData();
            this.io.emit('mpc-comparison-update', comparisonData);
        }, 2000);
    }

    start() {
        this.server.listen(this.port, () => {
            console.log(`🏭 PEM Electrolyzer Dashboard running on port ${this.port}`);
            console.log(`📊 MPC Comparator: http://localhost:${this.port}/mpc-comparison`);
            console.log(`🧠 Neural MPC: http://localhost:${this.port}/neural-mpc`);
        });
    }
}

// Start the dashboard
const dashboard = new PEMDashboard();
dashboard.start();

module.exports = PEMDashboard;
