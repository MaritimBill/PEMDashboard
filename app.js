// app.js - FIXED ENDPOINTS - NO 404 ERRORS
const express = require('express');
const path = require('path');
const RealKenyaNeuralMPC = require('./neural-mpc');

const app = express();
app.use(express.json());
app.use(express.static(__dirname));

const neuralMPC = new RealKenyaNeuralMPC();

// FIXED: Proper endpoint that actually exists
app.get('/api/system/state', async (req, res) => {
    try {
        console.log('📡 Fetching REAL system state...');
        
        // Get REAL data from all sources
        const [systemState, weather, electricity, hospital] = await Promise.all([
            neuralMPC.getCurrentSystemState(),
            neuralMPC.getRealKenyaWeather(),
            neuralMPC.getRealKenyaElectricity(),
            neuralMPC.getRealKNHDemand()
        ]);
        
        res.json({
            success: true,
            system_state: systemState,
            real_data: { weather, electricity, hospital },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ System state error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            system_state: await neuralMPC.getCurrentSystemState(), // Fallback to basic state
            timestamp: new Date().toISOString()
        });
    }
});

// FIXED: MPC comparison endpoint
app.get('/api/mpc/compare', async (req, res) => {
    try {
        console.log('🧠 Starting REAL MPC comparison...');
        const startTime = Date.now();
        
        const results = await neuralMPC.runCompleteSystem();
        const computationTime = Date.now() - startTime;
        
        console.log(`✅ MPC comparison completed in ${computationTime}ms`);
        
        res.json({
            success: true,
            ...results,
            computation_time: computationTime
        });
        
    } catch (error) {
        console.error('❌ MPC comparison error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// NEW: Real-time PEM telemetry endpoint
app.get('/api/pem/telemetry', async (req, res) => {
    try {
        const telemetry = await neuralMPC.getPEMTelemetry();
        res.json({
            success: true,
            ...telemetry
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// NEW: Apply control command
app.post('/api/control/apply', async (req, res) => {
    try {
        const { mpc_type, optimal_current } = req.body;
        const result = await neuralMPC.applyControl(mpc_type, optimal_current);
        res.json({ success: true, ...result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log('🚀 KNH REAL MPC SYSTEM - NO FAKE DATA');
    console.log('=======================================');
    console.log(`📍 Dashboard: http://localhost:${PORT}`);
    console.log(`❤️  Health: http://localhost:${PORT}/health`);
    console.log('');
    console.log('✅ ENDPOINTS:');
    console.log('   GET  /api/system/state    - Real system state');
    console.log('   GET  /api/mpc/compare     - Real MPC comparison');
    console.log('   GET  /api/pem/telemetry   - Real PEM data');
    console.log('   POST /api/control/apply   - Apply controls');
});
