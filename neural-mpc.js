const tf = require('@tensorflow/tfjs');
const fs = require('fs');
const path = require('path');

class NeuralMPC {
    constructor() {
        this.model = null;
        this.isTrained = false;
        this.trainingHistory = [];
        this.modelPath = path.join(__dirname, 'models', 'neural-mpc-model');
        
        this.initializeModel();
        this.loadTrainingData();
    }

    initializeModel() {
        // Create a comprehensive neural network for MPC
        this.model = tf.sequential({
            layers: [
                // Input layer: [current, voltage, temperature, purity, setpoint, electricity_price]
                tf.layers.dense({ units: 64, activation: 'relu', inputShape: [6] }),
                tf.layers.dropout({ rate: 0.2 }),
                
                // Hidden layers
                tf.layers.dense({ units: 128, activation: 'relu' }),
                tf.layers.batchNormalization(),
                tf.layers.dropout({ rate: 0.3 }),
                
                tf.layers.dense({ units: 64, activation: 'relu' }),
                tf.layers.dropout({ rate: 0.2 }),
                
                tf.layers.dense({ units: 32, activation: 'relu' }),
                
                // Output layer: [optimal_current, efficiency, safety_risk, economic_value]
                tf.layers.dense({ units: 4, activation: 'linear' })
            ]
        });

        // Custom loss function for MPC objectives
        const customLoss = (yTrue, yPred) => {
            const trackingError = tf.losses.meanSquaredError(yTrue.slice([0, 0], [-1, 1]), yPred.slice([0, 0], [-1, 1]));
            const safetyPenalty = tf.losses.absoluteDifference(yTrue.slice([0, 2], [-1, 1]), yPred.slice([0, 2], [-1, 1]));
            const economicReward = tf.neg(tf.losses.meanSquaredError(yTrue.slice([0, 3], [-1, 1]), yPred.slice([0, 3], [-1, 1]));
            
            return tf.add(tf.add(trackingError, safetyPenalty), economicReward);
        };

        this.model.compile({
            optimizer: tf.train.adam(0.001),
            loss: customLoss,
            metrics: ['mae', 'mse']
        });

        console.log('🧠 Neural MPC model initialized');
    }

    async trainModel(epochs = 100, batchSize = 32) {
        if (!this.trainingData || this.trainingData.length === 0) {
            await this.generateTrainingData();
        }

        const { inputs, outputs } = this.prepareTrainingData();
        
        console.log('🚀 Starting Neural MPC training...');
        console.log(`📊 Training data: ${inputs.shape[0]} samples`);

        const history = await this.model.fit(inputs, outputs, {
            epochs: epochs,
            batchSize: batchSize,
            validationSplit: 0.2,
            callbacks: {
                onEpochEnd: (epoch, logs) => {
                    this.trainingHistory.push({ epoch, ...logs });
                    if (epoch % 10 === 0) {
                        console.log(`Epoch ${epoch}: loss = ${logs.loss.toFixed(4)}, val_loss = ${logs.val_loss.toFixed(4)}`);
                    }
                }
            }
        });

        this.isTrained = true;
        await this.saveModel();
        
        console.log('✅ Neural MPC training completed');
        return history;
    }

    async generateTrainingData() {
        console.log('📈 Generating training data for Neural MPC...');
        
        const numSamples = 10000;
        const inputs = [];
        const outputs = [];

        for (let i = 0; i < numSamples; i++) {
            const input = this.generateRandomInput();
            const output = await this.calculateOptimalOutput(input);
            
            inputs.push(input);
            outputs.push(output);
        }

        this.trainingData = { inputs, outputs };
        this.saveTrainingData();
        
        return this.trainingData;
    }

    generateRandomInput() {
        return [
            // Current (100-200A)
            Math.random() * 100 + 100,
            // Voltage (35-42V)
            Math.random() * 7 + 35,
            // Temperature (60-80°C)
            Math.random() * 20 + 60,
            // Purity (99.0-100%)
            Math.random() * 1 + 99,
            // Setpoint (0-100%)
            Math.random() * 100,
            // Electricity price (0.08-0.16 $/kWh)
            Math.random() * 0.08 + 0.08
        ];
    }

    async calculateOptimalOutput(input) {
        // Simulate MPC optimization for training data
        const [current, voltage, temperature, purity, setpoint, electricityPrice] = input;
        
        // Simple optimization logic for training data generation
        let optimalCurrent = setpoint * 2 + 100; // Basic mapping
        optimalCurrent = Math.max(100, Math.min(200, optimalCurrent));
        
        // Adjust based on constraints
        if (temperature > 75) optimalCurrent -= 20;
        if (purity < 99.3) optimalCurrent -= 15;
        if (electricityPrice > 0.14) optimalCurrent -= 10;
        
        const efficiency = 65 + (optimalCurrent - 150) * 0.1;
        const safetyRisk = this.calculateSafetyRisk(optimalCurrent, temperature, purity);
        const economicValue = this.calculateEconomicValue(optimalCurrent, electricityPrice);
        
        return [optimalCurrent, efficiency, safetyRisk, economicValue];
    }

    calculateSafetyRisk(current, temperature, purity) {
        let risk = 0;
        if (temperature > 70) risk += 0.3;
        if (temperature > 75) risk += 0.4;
        if (purity < 99.5) risk += 0.2;
        if (purity < 99.2) risk += 0.3;
        if (current > 180) risk += 0.2;
        
        return Math.min(1, risk);
    }

    calculateEconomicValue(current, electricityPrice) {
        const production = current * 0.00042 * 3600; // kg/h
        const value = production * 4.0; // $4/kg H2
        const cost = current * 38 / 1000 * electricityPrice; // $/h
        return value - cost;
    }

    prepareTrainingData() {
        const inputs = tf.tensor2d(this.trainingData.inputs);
        const outputs = tf.tensor2d(this.trainingData.outputs);
        return { inputs, outputs };
    }

    async predict(inputArray) {
        if (!this.isTrained) {
            throw new Error('Model not trained. Please train the model first.');
        }

        const input = tf.tensor2d([inputArray]);
        const prediction = this.model.predict(input);
        const result = await prediction.data();
        
        tf.dispose([input, prediction]);

        return {
            optimalCurrent: result[0],
            efficiency: result[1],
            safetyRisk: result[2],
            economicValue: result[3],
            confidence: this.calculatePredictionConfidence(inputArray)
        };
    }

    calculatePredictionConfidence(input) {
        // Calculate confidence based on input proximity to training data
        if (!this.trainingData) return 0.8;
        
        const distances = this.trainingData.inputs.map(trainInput => 
            this.euclideanDistance(input, trainInput)
        );
        
        const minDistance = Math.min(...distances);
        return Math.max(0.1, 1 - minDistance / 10); // Normalize confidence
    }

    euclideanDistance(a, b) {
        return Math.sqrt(a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0));
    }

    async saveModel() {
        try {
            await this.model.save(`file://${this.modelPath}`);
            console.log('💾 Neural MPC model saved');
        } catch (error) {
            console.warn('⚠️ Could not save model:', error.message);
        }
    }

    async loadModel() {
        try {
            this.model = await tf.loadLayersModel(`file://${this.modelPath}/model.json`);
            this.isTrained = true;
            console.log('📥 Neural MPC model loaded');
        } catch (error) {
            console.warn('⚠️ Could not load model, needs training:', error.message);
        }
    }

    saveTrainingData() {
        const dataPath = path.join(__dirname, 'data', 'training-data.json');
        const dir = path.dirname(dataPath);
        
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        fs.writeFileSync(dataPath, JSON.stringify(this.trainingData, null, 2));
        console.log('💾 Training data saved');
    }

    loadTrainingData() {
        const dataPath = path.join(__dirname, 'data', 'training-data.json');
        
        if (fs.existsSync(dataPath)) {
            this.trainingData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
            console.log('📥 Training data loaded');
        }
    }

    getTrainingHistory() {
        return this.trainingHistory;
    }

    getModelSummary() {
        return {
            isTrained: this.isTrained,
            layers: this.model.layers.map(layer => ({
                type: layer.getClassName(),
                units: layer.units,
                activation: layer.activation
            })),
            trainingSamples: this.trainingData ? this.trainingData.inputs.length : 0
        };
    }

    async realTimeAdaptation(newData) {
        // Online learning for model adaptation
        if (!this.isTrained) return;

        const adaptationRate = 0.01;
        const adaptationSamples = Math.min(100, newData.length);
        
        const adaptationData = newData.slice(-adaptationSamples);
        const { inputs, outputs } = this.prepareAdaptationData(adaptationData);

        await this.model.fit(inputs, outputs, {
            epochs: 1,
            batchSize: 32,
            verbose: 0
        });

        console.log('🔄 Neural MPC model adapted to new data');
    }

    prepareAdaptationData(data) {
        const inputs = data.map(d => d.input);
        const outputs = data.map(d => d.output);
        
        return {
            inputs: tf.tensor2d(inputs),
            outputs: tf.tensor2d(outputs)
        };
    }
}

module.exports = NeuralMPC;
