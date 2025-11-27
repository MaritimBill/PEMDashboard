const tf = require('@tensorflow/tfjs-node');
const axios = require('axios');
const moment = require('moment');

class NeuralMPC {
  constructor() {
    this.model = null;
    this.isTrained = false;
    this.trainingHistory = [];
    
    // Data buffers for training
    this.sensorDataBuffer = [];
    this.weatherDataBuffer = [];
    this.tariffDataBuffer = [];
    this.demandDataBuffer = [];
    
    // MPC parameters
    this.mpcConfig = {
      predictionHorizon: 10,
      controlHorizon: 5,
      sampleTime: 1,
      maxIterations: 100,
      tolerance: 1e-4
    };
  }

  async initialize() {
    console.log('🧠 Initializing Neural MPC...');
    await this.loadOrCreateModel();
    this.startDataCollection();
    this.startTrainingLoop();
  }

  async loadOrCreateModel() {
    try {
      // Try to load pre-trained model
      this.model = await tf.loadLayersModel('file://./models/neural-mpc/model.json');
      this.isTrained = true;
      console.log('✅ Pre-trained Neural MPC model loaded');
    } catch (error) {
      // Create new model
      console.log('🆕 Creating new Neural MPC model');
      await this.createModel();
    }
  }

  async createModel() {
    this.model = tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [15], // 15 input features
          units: 64,
          activation: 'relu'
        }),
        tf.layers.dense({
          units: 128,
          activation: 'relu'
        }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({
          units: 64,
          activation: 'relu'
        }),
        tf.layers.dense({
          units: 5, // 5 output: optimal_current, predicted_temp, voltage, o2_purity, efficiency
          activation: 'linear'
        })
      ]
    });

    this.model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['mae']
    });

    console.log('✅ Neural MPC model created');
  }

  async trainModel(trainingData) {
    if (!this.model || trainingData.length < 100) {
      console.log('⚠️ Not enough data for training');
      return;
    }

    console.log('🎯 Training Neural MPC with', trainingData.length, 'samples...');

    const inputs = [];
    const targets = [];

    // Prepare training data
    trainingData.forEach(sample => {
      inputs.push(this.prepareInputFeatures(sample));
      targets.push(this.prepareTargetOutput(sample));
    });

    const inputTensor = tf.tensor2d(inputs);
    const targetTensor = tf.tensor2d(targets);

    const history = await this.model.fit(inputTensor, targetTensor, {
      epochs: 50,
      batchSize: 32,
      validationSplit: 0.2,
      verbose: 0,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          if (epoch % 10 === 0) {
            console.log(`Epoch ${epoch}: loss = ${logs.loss.toFixed(4)}`);
          }
        }
      }
    });

    this.trainingHistory.push(history);
    this.isTrained = true;

    // Cleanup
    inputTensor.dispose();
    targetTensor.dispose();

    console.log('✅ Neural MPC training completed');
  }

  prepareInputFeatures(data) {
    // Combine all relevant features for prediction
    return [
      data.temperature || 65,
      data.voltage || 38,
      data.current || 150,
      data.o2Purity || 99.5,
      data.productionRate || 30,
      data.weather?.temperature || 25,
      data.weather?.humidity || 60,
      data.tariff?.tariff || 18.69,
      data.demand?.currentDemand || 50,
      data.demand?.predictedDemand || 55,
      new Date().getHours() / 24, // Time of day
      new Date().getDay() / 7,    // Day of week
      data.battery || 85,
      data.systemEfficiency || 70,
      data.powerConsumption || 5.7
    ];
  }

  prepareTargetOutput(data) {
    // Target values for training
    return [
      data.optimalCurrent || 150,    // Optimal current
      data.temperature || 65,        // Predicted temperature
      data.voltage || 38,            // Predicted voltage
      data.o2Purity || 99.5,         // Predicted O2 purity
      data.systemEfficiency || 70    // Predicted efficiency
    ];
  }

  async predictOptimalControl(currentState, externalData) {
    if (!this.isTrained) {
      console.log('⚠️ Model not trained, returning default control');
      return this.getDefaultControl(currentState);
    }

    try {
      const inputFeatures = this.prepareInputFeatures({
        ...currentState,
        ...externalData
      });

      const inputTensor = tf.tensor2d([inputFeatures]);
      const prediction = this.model.predict(inputTensor);
      const results = await prediction.data();
      
      inputTensor.dispose();
      prediction.dispose();

      return {
        optimalCurrent: results[0],
        predictedTemperature: results[1],
        predictedVoltage: results[2],
        predictedO2Purity: results[3],
        predictedEfficiency: results[4],
        confidence: this.calculateConfidence(results),
        timestamp: new Date()
      };

    } catch (error) {
      console.error('❌ Prediction error:', error);
      return this.getDefaultControl(currentState);
    }
  }

  calculateConfidence(predictions) {
    // Simple confidence calculation based on prediction variance
    const mean = predictions.reduce((a, b) => a + b) / predictions.length;
    const variance = predictions.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / predictions.length;
    return Math.max(0, 100 - variance * 10);
  }

  getDefaultControl(state) {
    // Fallback control strategy
    return {
      optimalCurrent: 150,
      predictedTemperature: state.temperature || 65,
      predictedVoltage: state.voltage || 38,
      predictedO2Purity: state.o2Purity || 99.5,
      predictedEfficiency: 70,
      confidence: 50,
      timestamp: new Date(),
      note: 'Using default control strategy'
    };
  }

  startDataCollection() {
    // Collect data from various sources
    setInterval(() => {
      this.collectTrainingData();
    }, 30000); // Every 30 seconds
  }

  async collectTrainingData() {
    try {
      const mqttManager = require('./mqtt');
      const externalData = mqttManager.getExternalData();
      
      // Get current system state from MQTT
      const systemState = mqttManager.systemState;
      
      const trainingSample = {
        timestamp: new Date(),
        ...systemState,
        ...externalData
      };

      this.sensorDataBuffer.push(trainingSample);
      
      // Keep buffer size manageable
      if (this.sensorDataBuffer.length > 10000) {
        this.sensorDataBuffer = this.sensorDataBuffer.slice(-5000);
      }

    } catch (error) {
      console.error('Error collecting training data:', error);
    }
  }

  startTrainingLoop() {
    // Retrain model periodically with new data
    setInterval(async () => {
      if (this.sensorDataBuffer.length >= 500) {
        await this.trainModel(this.sensorDataBuffer);
        
        // Save model periodically
        await this.saveModel();
      }
    }, 3600000); // Retrain every hour
  }

  async saveModel() {
    if (this.model && this.isTrained) {
      try {
        await this.model.save('file://./models/neural-mpc');
        console.log('💾 Neural MPC model saved');
      } catch (error) {
        console.error('Error saving model:', error);
      }
    }
  }

  // Economic optimization considering KPLC tariffs
  optimizeForCost(controlSignal, externalData) {
    const currentTariff = externalData.tariff?.tariff || 18.69;
    const currentHour = new Date().getHours();
    
    // Adjust control based on electricity cost
    let costFactor = 1.0;
    
    if (currentTariff > 20) {
      // High tariff period - reduce energy consumption
      costFactor = 0.9;
    } else if (currentTariff < 15) {
      // Low tariff period - can increase production
      costFactor = 1.1;
    }
    
    return {
      ...controlSignal,
      optimalCurrent: controlSignal.optimalCurrent * costFactor,
      costOptimized: true,
      tariff: currentTariff,
      optimizationNote: `Cost optimization applied (factor: ${costFactor.toFixed(2)})`
    };
  }

  // Demand-based optimization for hospital needs
  optimizeForDemand(controlSignal, externalData) {
    const currentDemand = externalData.demand?.currentDemand || 50;
    const predictedDemand = externalData.demand?.predictedDemand || 55;
    
    // Adjust production based on hospital oxygen demand
    const demandFactor = predictedDemand / 50; // Normalize to base demand
    
    return {
      ...controlSignal,
      optimalCurrent: controlSignal.optimalCurrent * demandFactor,
      demandOptimized: true,
      currentDemand,
      predictedDemand,
      optimizationNote: `Demand optimization applied (factor: ${demandFactor.toFixed(2)})`
    };
  }
}

module.exports = new NeuralMPC();
