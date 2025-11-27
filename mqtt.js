const mqtt = require('mqtt');
const axios = require('axios');
const moment = require('moment');

class MQTTManager {
  constructor() {
    this.client = null;
    this.io = null;
    this.isConnected = false;
    
    // MQTT Configuration
    this.config = {
      brokerUrl: process.env.MQTT_BROKER || 'mqtt://localhost:1883',
      topics: {
        arduinoTelemetry: 'pem/arduino/telemetry',
        arduinoCommands: 'pem/arduino/commands',
        simulinkData: 'pem/simulink/data',
        mpcCommands: 'pem/mpc/commands',
        systemAlerts: 'pem/system/alerts'
      }
    };

    // System state
    this.systemState = {
      mode: 'STANDBY',
      temperature: 0,
      voltage: 0,
      current: 0,
      o2Purity: 0,
      productionRate: 0,
      battery: 0,
      lastUpdate: null
    };

    // External data sources
    this.weatherData = null;
    this.tariffData = null;
    this.demandData = null;
  }

  initialize(io) {
    this.io = io;
    this.connect();
    this.startDataCollection();
  }

  connect() {
    try {
      this.client = mqtt.connect(this.config.brokerUrl, {
        clientId: 'pem-dashboard-' + Math.random().toString(16).substr(2, 8),
        clean: true,
        connectTimeout: 4000,
        reconnectPeriod: 1000
      });

      this.client.on('connect', () => {
        console.log('✅ MQTT Connected to broker');
        this.isConnected = true;
        
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

      this.client.on('error', (err) => {
        console.error('❌ MQTT Error:', err);
        this.isConnected = false;
      });

      this.client.on('close', () => {
        console.log('🔌 MQTT Connection closed');
        this.isConnected = false;
      });

    } catch (error) {
      console.error('❌ MQTT Connection failed:', error);
    }
  }

  handleMessage(topic, message) {
    try {
      const data = JSON.parse(message);
      
      switch (topic) {
        case this.config.topics.arduinoTelemetry:
          this.handleArduinoTelemetry(data);
          break;
          
        case this.config.topics.simulinkData:
          this.handleSimulinkData(data);
          break;
          
        case this.config.topics.systemAlerts:
          this.handleSystemAlerts(data);
          break;
          
        default:
          console.log('Received message on topic:', topic, data);
      }
    } catch (error) {
      console.error('Error parsing MQTT message:', error);
    }
  }

  handleArduinoTelemetry(data) {
    // Update system state
    this.systemState = {
      ...this.systemState,
      ...data,
      lastUpdate: new Date()
    };

    // Broadcast to all connected clients
    if (this.io) {
      this.io.emit('real-time-data', this.systemState);
      this.io.emit('sensor-update', data);
    }

    // Log for debugging
    console.log('📊 Arduino Telemetry:', {
      temp: data.temperature,
      voltage: data.voltage,
      current: data.current,
      purity: data.o2Purity
    });
  }

  handleSimulinkData(data) {
    // Process Simulink simulation data
    if (this.io) {
      this.io.emit('simulation-data', data);
    }
  }

  handleSystemAlerts(data) {
    // Handle system alerts and notifications
    if (this.io) {
      this.io.emit('system-alert', {
        ...data,
        timestamp: new Date(),
        priority: data.priority || 'medium'
      });
    }

    // Log critical alerts
    if (data.priority === 'high') {
      console.warn('🚨 CRITICAL ALERT:', data.message);
    }
  }

  publishControlCommand(command) {
    if (this.isConnected) {
      this.client.publish(
        this.config.topics.arduinoCommands,
        JSON.stringify({
          ...command,
          timestamp: new Date().toISOString(),
          source: 'dashboard'
        })
      );
      console.log('📤 Control command sent:', command);
    }
  }

  publishModeChange(modeData) {
    if (this.isConnected) {
      this.client.publish(
        this.config.topics.mpcCommands,
        JSON.stringify({
          type: 'mode_change',
          mode: modeData.mode,
          setpoint: modeData.setpoint,
          timestamp: new Date().toISOString()
        })
      );
    }
  }

  // External data collection for neural MPC
  async startDataCollection() {
    // Collect weather data (Nairobi)
    setInterval(async () => {
      try {
        const weatherResponse = await axios.get(
          'https://api.openweathermap.org/data/2.5/weather?q=Nairobi,KE&appid=demo_key&units=metric'
        );
        this.weatherData = weatherResponse.data;
      } catch (error) {
        // Fallback to simulated weather data
        this.weatherData = this.generateSimulatedWeather();
      }
    }, 300000); // Every 5 minutes

    // Collect tariff data (simulated KPLC)
    setInterval(() => {
      this.tariffData = this.generateTariffData();
    }, 900000); // Every 15 minutes

    // Collect demand patterns
    setInterval(() => {
      this.demandData = this.generateDemandData();
    }, 600000); // Every 10 minutes
  }

  generateSimulatedWeather() {
    const now = new Date();
    const hour = now.getHours();
    
    return {
      temperature: 20 + 5 * Math.sin(hour * Math.PI / 12),
      humidity: 60 + 20 * Math.random(),
      pressure: 1013 + 10 * Math.random(),
      timestamp: now
    };
  }

  generateTariffData() {
    const now = new Date();
    const hour = now.getHours();
    let tariff;
    
    // KPLC time-of-use tariffs (simplified)
    if (hour >= 7 && hour <= 10) tariff = 25.33; // Morning peak
    else if (hour >= 18 && hour <= 22) tariff = 25.33; // Evening peak
    else if (hour >= 23 || hour <= 6) tariff = 12.50; // Off-peak
    else tariff = 18.69; // Standard
    
    return {
      tariff,
      period: this.getTariffPeriod(hour),
      timestamp: now
    };
  }

  generateDemandData() {
    const now = new Date();
    const hour = now.getHours();
    
    // Hospital oxygen demand patterns
    let baseDemand = 50; // Base demand in L/min
    let variation = 0;
    
    if (hour >= 6 && hour <= 8) variation = 20; // Morning rounds
    else if (hour >= 14 && hour <= 16) variation = 15; // Afternoon
    else if (hour >= 20 && hour <= 22) variation = 10; // Evening
    else if (hour >= 0 && hour <= 5) variation = -15; // Night low
    
    return {
      currentDemand: baseDemand + variation + (Math.random() * 10 - 5),
      predictedDemand: baseDemand + variation + 5,
      timestamp: now
    };
  }

  getTariffPeriod(hour) {
    if (hour >= 7 && hour <= 10) return 'Morning Peak';
    if (hour >= 18 && hour <= 22) return 'Evening Peak';
    if (hour >= 23 || hour <= 6) return 'Off-Peak';
    return 'Standard';
  }

  getExternalData() {
    return {
      weather: this.weatherData,
      tariff: this.tariffData,
      demand: this.demandData
    };
  }
}

module.exports = new MQTTManager();
