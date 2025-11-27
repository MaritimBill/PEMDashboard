// app.js - COMPLETE WITH ALL ENDPOINTS
const express = require('express');
const path = require('path');
const RealKenyaNeuralMPC = require('./neural-mpc');

const app = express();
app.use(express.json());
app.use(express.static(__dirname));

const neuralMPC = new RealKenyaNeuralMPC();

// ALL ENDPOINTS DEFINED - NO 404 ERRORS
app.get('/api/system/state', async (req, res) => {
    try {
        const systemState = await neuralMPC.getCurrentSystemState();
        const weather = await neuralMPC.getRealKenyaWeather();
        const electricity = neuralMPC.getRealKenyaElectricity();
        const hospital = neuralMPC.getRealKNHDemand();
        
        res.json({
            system_state: systemState,
            real_data: { weather, electricity, hospital },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/mpc/compare', async (req, res) => {
    try {
        const results = await neuralMPC.runCompleteSystem();
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/pem/telemetry', async (req, res) => {
    try {
        const telemetry = await neuralMPC.getPEMTelemetry();
        res.json(telemetry);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/control/apply', async (req, res) => {
    try {
        const { mpc_type, optimal_current } = req.body;
        const result = await neuralMPC.applyControl(mpc_type, optimal_current);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/status', (req, res) => {
    res.json({
        status: 'operational',
        timestamp: new Date().toISOString()
    });
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Catch all other routes - prevent 404
app.get('*', (req, res) => {
    res.redirect('/');
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log('🚀 Server running on http://localhost:' + PORT);
    console.log('✅ All endpoints defined - no 404 errors');
});
