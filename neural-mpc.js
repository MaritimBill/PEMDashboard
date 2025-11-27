// Enhanced Neural Training Data Generator
class NeuralTrainingData {
    generateTrainingData(samples = 10000) {
        const trainingData = {
            inputs: [],
            outputs: []
        };

        for (let i = 0; i < samples; i++) {
            const input = this.generateRealisticInput();
            const output = this.calculateOptimalOutput(input);
            
            trainingData.inputs.push(input);
            trainingData.outputs.push(output);
        }

        return trainingData;
    }

    generateRealisticInput() {
        // Realistic PEM electrolyzer operating conditions
        return [
            // Current (100-200A) - most operations between 120-180A
            Math.random() * 80 + 110,
            // Voltage (35-42V) - correlated with current
            36 + (Math.random() * 4) + (Math.random() - 0.5) * 2,
            // Temperature (60-75°C) - safe operating range
            62 + Math.random() * 13,
            // Purity (99.0-99.8%) - medical grade requirements
            99.2 + Math.random() * 0.6,
            // Setpoint (0-100%) - production target
            Math.random() * 100,
            // Electricity price ($0.08-0.16/kWh) - time-varying
            0.08 + Math.random() * 0.08,
            // Time of day (0-23) - for demand patterns
            Math.random() * 24,
            // System age (0-1000 hours) - degradation factor
            Math.random() * 1000
        ];
    }

    calculateOptimalOutput(input) {
        const [current, voltage, temperature, purity, setpoint, electricityPrice, timeOfDay, systemAge] = input;
        
        // Physics-based optimal control calculation
        let optimalCurrent = this.calculatePhysicsOptimal(current, temperature, purity, setpoint);
        
        // Economic optimization
        optimalCurrent = this.applyEconomicOptimization(optimalCurrent, electricityPrice, timeOfDay);
        
        // Safety constraints
        optimalCurrent = this.applySafetyConstraints(optimalCurrent, temperature, purity, systemAge);
        
        // Calculate expected outputs
        const efficiency = this.calculateEfficiency(optimalCurrent, temperature, systemAge);
        const safetyRisk = this.calculateSafetyRisk(optimalCurrent, temperature, purity);
        const economicValue = this.calculateEconomicValue(optimalCurrent, electricityPrice);
        
        return [optimalCurrent, efficiency, safetyRisk, economicValue];
    }

    calculatePhysicsOptimal(current, temperature, purity, setpoint) {
        // Basic production tracking
        let optimal = setpoint * 2 + 100;
        
        // Temperature compensation
        if (temperature > 70) optimal -= (temperature - 70) * 2;
        if (temperature < 65) optimal += (65 - temperature) * 1;
        
        // Purity constraints
        if (purity < 99.3) optimal -= (99.3 - purity) * 50;
        
        return Math.max(100, Math.min(200, optimal));
    }

    applyEconomicOptimization(current, electricityPrice, timeOfDay) {
        // Reduce production during high electricity prices
        const priceFactor = Math.max(0.7, 1.2 - electricityPrice / 0.12);
        
        // Time-based optimization (reduce during peak hours)
        const timeFactor = (timeOfDay >= 7 && timeOfDay <= 19) ? 0.9 : 1.1;
        
        return current * priceFactor * timeFactor;
    }

    applySafetyConstraints(current, temperature, purity, systemAge) {
        // Temperature constraints
        if (temperature > 75) current = Math.min(current, 160);
        if (temperature > 78) current = Math.min(current, 140);
        
        // Purity constraints
        if (purity < 99.5) current = Math.min(current, 170);
        if (purity < 99.2) current = Math.min(current, 150);
        
        // Age-based derating
        const ageFactor = Math.max(0.8, 1 - (systemAge / 10000));
        current *= ageFactor;
        
        return Math.max(100, Math.min(200, current));
    }

    calculateEfficiency(current, temperature, systemAge) {
        const baseEfficiency = 68;
        const currentEffect = (current - 150) * -0.1;
        const tempEffect = (temperature - 65) * 0.2;
        const ageEffect = -(systemAge / 10000) * 5;
        
        return Math.max(50, baseEfficiency + currentEffect + tempEffect + ageEffect);
    }

    calculateSafetyRisk(current, temperature, purity) {
        let risk = 0;
        
        if (current > 180) risk += 0.3;
        if (current > 190) risk += 0.2;
        
        if (temperature > 70) risk += 0.2;
        if (temperature > 75) risk += 0.3;
        
        if (purity < 99.5) risk += 0.2;
        if (purity < 99.2) risk += 0.3;
        
        return Math.min(1, risk);
    }

    calculateEconomicValue(current, electricityPrice) {
        const production = current * 0.00042 * 3600; // kg/h
        const value = production * 4.0; // $4/kg H2
        const cost = current * 38 / 1000 * electricityPrice; // $/h
        
        return value - cost;
    }
}
