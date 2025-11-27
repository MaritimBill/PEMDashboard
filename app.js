const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const mqtt = require('./mqtt');
const simulinkBridge = require('./simulink-bridge');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      connectSrc: ["'self'", "ws:", "wss:"]
    }
  }
}));
app.use(compression());
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Serve static files
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// API Routes
app.get('/api/system-status', (req, res) => {
  res.json({
    status: 'operational',
    timestamp: new Date().toISOString(),
    hospital: 'Kenyatta National Hospital',
    location: 'Nairobi, Kenya',
    version: '2.0.0'
  });
});

// Socket.io for real-time communication
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Send initial system data
  socket.emit('system-data', {
    temperature: 65.2,
    voltage: 38.1,
    current: 150.5,
    o2Purity: 99.6,
    productionRate: 30,
    battery: 85,
    mode: 'MPC'
  });

  // Handle control commands
  socket.on('control-command', (data) => {
    console.log('Control command received:', data);
    // Forward to Arduino via MQTT
    mqtt.publishControlCommand(data);
    
    // Send to Simulink bridge
    simulinkBridge.sendCommand(data);
  });

  socket.on('set-mode', (data) => {
    console.log('Mode change:', data);
    mqtt.publishModeChange(data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Initialize modules
mqtt.initialize(io);
simulinkBridge.initialize(io);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`
  🏥 PEM Electrolysis System - Kenyatta National Hospital
  ==================================================
  📡 Server running on port ${PORT}
  🌐 Dashboard: http://localhost:${PORT}
  📊 Real-time monitoring active
  🤖 MPC Controller: Online
  🔗 MQTT Bridge: Connected
  ⚡ Simulink Integration: Ready
  `);
});

module.exports = app;
