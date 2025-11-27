// mpc-comparator.js - REAL PERFORMANCE COMPARISON
class MPCComparator {
    constructor() {
        this.mpcAlgorithms = new MPCAlgorithms();
        this.performanceHistory = [];
        this.metrics = [
            'efficiency', 'cost', 'response_time', 'computation_time', 
            'stability', 'constraint_violations', 'o2_production'
        ];
    }

    async runAllMPCComparison(currentState, operatingConditions) {
        const results = {};
        
        // Run all MPC variants in parallel
        const promises = [
            this.mpcAlgorithms.standardMPC(currentState, operatingConditions.setpoints, operatingConditions.constraints),
            this.mpcAlgorithms.mixedIntegerMPC(currentState, operatingConditions.setpoints, operatingConditions.constraints),
            this.mpcAlgorithms.stochasticMPC(currentState, operatingConditions.setpoints, operatingConditions.uncertainty),
            this.mpcAlgorithms.hierarchicalEconomicMPC(currentState, operatingConditions.economicData, operatingConditions.constraints),
            this.mpcAlgorithms.heNMPC(currentState, operatingConditions.weatherData, operatingConditions.economicData, operatingConditions.hospitalDemand)
        ];

        const mpcResults = await Promise.all(promises);
        
        // Store results
        mpcResults.forEach(result => {
            results[result.type] = result;
        });

        // Calculate performance metrics
        const performanceMetrics = this.calculatePerformanceMetrics(results);
        
        // Update history
        this.performanceHistory.push({
            timestamp: new Date(),
            results: results,
            metrics: performanceMetrics
        });

        return {
            individual_results: results,
            performance_metrics: performanceMetrics,
            ranking: this.rankMPCAlgorithms(performanceMetrics)
        };
    }

    calculatePerformanceMetrics(results) {
        const metrics = {};
        
        Object.keys(results).forEach(mpcType => {
            const result = results[mpcType];
            metrics[mpcType] = {
                efficiency: result.predicted_states ? result.predicted_states[1][1] : 75,
                cost: result.cost || result.total_cost || 4.0,
                response_time: result.computation_time || 0.1,
                computation_time: result.computation_time || 0.1,
                stability: this.calculateStability(result),
                constraint_violations: this.checkConstraintViolations(result),
                o2_production: this.estimateO2Production(result.optimal_current)
            };
        });
        
        return metrics;
    }

    calculateStability(mpcResult) {
        // Calculate control stability from trajectory
        if (!mpcResult.predicted_states) return 0.9;
        
        const temperatures = mpcResult.predicted_states.map(state => state[0]);
        const variations = this.calculateVariation(temperatures);
        return Math.max(0, 1 - variations / 10); // Normalize to 0-1
    }

    checkConstraintViolations(mpcResult) {
        // Check for constraint violations
        let violations = 0;
        if (mpcResult.optimal_current < 100 || mpcResult.optimal_current > 200) violations++;
        // Add more constraint checks
        return violations;
    }

    estimateO2Production(current) {
        // Simple O2 production model
        return current * 0.21; // L/min
    }

    rankMPCAlgorithms(metrics) {
        // Rank algorithms based on weighted score
        const scores = {};
        
        Object.keys(metrics).forEach(mpcType => {
            const mpcMetrics = metrics[mpcType];
            const score = 
                mpcMetrics.efficiency * 0.25 +
                (1 / mpcMetrics.cost) * 0.25 +
                (1 / mpcMetrics.response_time) * 0.15 +
                mpcMetrics.stability * 0.20 +
                (1 - mpcMetrics.constraint_violations) * 0.15;
            
            scores[mpcType] = score;
        });

        // Sort by score
        return Object.entries(scores)
            .sort(([,a], [,b]) => b - a)
            .map(([mpcType, score]) => ({ mpcType, score }));
    }

    getStatisticalComparison() {
        if (this.performanceHistory.length === 0) return null;
        
        const statisticalResults = {};
        const mpcTypes = Object.keys(this.performanceHistory[0].metrics);
        
        mpcTypes.forEach(mpcType => {
            const allMetrics = this.performanceHistory.map(entry => entry.metrics[mpcType]);
            
            statisticalResults[mpcType] = {
                mean_efficiency: this.calculateMean(allMetrics.map(m => m.efficiency)),
                std_efficiency: this.calculateStd(allMetrics.map(m => m.efficiency)),
                mean_cost: this.calculateMean(allMetrics.map(m => m.cost)),
                best_performance: Math.max(...allMetrics.map(m => m.efficiency)),
                worst_performance: Math.min(...allMetrics.map(m => m.efficiency)),
                reliability: this.calculateReliability(allMetrics)
            };
        });
        
        return statisticalResults;
    }

    calculateMean(values) {
        return values.reduce((a, b) => a + b, 0) / values.length;
    }

    calculateStd(values) {
        const mean = this.calculateMean(values);
        const squareDiffs = values.map(value => Math.pow(value - mean, 2));
        return Math.sqrt(this.calculateMean(squareDiffs));
    }

    calculateReliability(metrics) {
        const stableCount = metrics.filter(m => m.stability > 0.8).length;
        return stableCount / metrics.length;
    }
}

module.exports = MPCComparator;
