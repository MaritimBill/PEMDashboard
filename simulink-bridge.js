const net = require('net');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class SimulinkBridge {
    constructor() {
        this.server = null;
        this.clients = new Map();
        this.matlabProcess = null;
        this.isConnected = false;
        
        this.setupTCPServer();
        this.startMATLABBridge();
    }

    setupTCPServer() {
        this.server = net.createServer((socket) => {
            const clientId = `${socket.remoteAddress}:${socket.remotePort}`;
            console.log(`🔌 MATLAB/Arduino client connected: ${clientId}`);
            
            this.clients.set(clientId, socket);
            this.isConnected = true;

            socket.on('data', (data) => {
                this.handleIncomingData(data, clientId);
            });

            socket.on('error', (error) => {
                console.error(`❌ Socket error for ${clientId}:`, error.message);
            });

            socket.on('close', () => {
                console.log(`🔌 Client disconnected: ${clientId}`);
                this.clients.delete(clientId);
                this.isConnected = this.clients.size > 0;
            });
        });

        this.server.listen(8080, '0.0.0.0', () => {
            console.log('🔌 Simulink Bridge TCP server listening on port 8080');
        });

        this.server.on('error', (error) => {
            console.error('❌ TCP server error:', error.message);
        });
    }

    startMATLABBridge() {
        // Start MATLAB process for Simulink coordination
        const matlabScript = `
            % MATLAB Simulink Bridge
            try
                % Load PEM electrolyzer model
                modelName = 'PEM_Electrolyzer_Complete';
                if bdIsLoaded(modelName)
                    close_system(modelName, 0);
                end
                load_system(modelName);
                
                % Set up TCP communication
                t = tcpip('0.0.0.0', 8080, 'NetworkRole', 'server');
                fopen(t);
                disp('MATLAB TCP server ready for Simulink bridge');
                
                while true
                    if t.BytesAvailable > 0
                        data = fread(t, t.BytesAvailable);
                        jsonStr = char(data)';
                        disp(['Received: ' jsonStr]);
                        
                        % Parse JSON and update Simulink parameters
                        try
                            cmd = jsondecode(jsonStr);
                            if isfield(cmd, 'current')
                                set_param([modelName '/Current_Setpoint'], 'Value', num2str(cmd.current));
                            end
                            if isfield(cmd, 'simulationTime')
                                set_param(modelName, 'StopTime', num2str(cmd.simulationTime));
                            end
                            
                            % Run simulation if requested
                            if isfield(cmd, 'runSimulation') && cmd.runSimulation
                                simOut = sim(modelName);
                                
                                % Send results back
                                results = struct();
                                results.timestamp = datestr(now);
                                results.o2_rate = simOut.O2_Rate.Data(end);
                                results.h2_rate = simOut.H2_Rate.Data(end);
                                results.voltage = simOut.Voltage.Data(end);
                                results.o2_tank = simOut.O2_Tank.Data(end);
                                results.h2_tank = simOut.H2_Tank.Data(end);
                                
                                resultJson = jsonencode(results);
                                fwrite(t, resultJson);
                            end
                            
                        catch parseErr
                            disp(['JSON parse error: ' parseErr.message]);
                        end
                    end
                    pause(0.1);
                end
                
            catch err
                disp(['MATLAB Bridge Error: ' err.message]);
                fclose(t);
                delete(t);
            end
        `;

        // Write MATLAB script to file
        const scriptPath = path.join(__dirname, 'matlab_bridge.m');
        fs.writeFileSync(scriptPath, matlabScript);

        // Start MATLAB process (commented out for safety - uncomment when MATLAB is available)
        /*
        this.matlabProcess = spawn('matlab', [
            '-batch',
            `run('${scriptPath}')`
        ]);

        this.matlabProcess.stdout.on('data', (data) => {
            console.log(`MATLAB: ${data}`);
        });

        this.matlabProcess.stderr.on('data', (data) => {
            console.error(`MATLAB Error: ${data}`);
        });
        */
    }

    handleIncomingData(data, clientId) {
        try {
            const message = data.toString().trim();
            const jsonData = JSON.parse(message);
            
            console.log(`📨 Received from ${clientId}:`, jsonData);
            
            // Handle different message types
            if (jsonData.type === 'arduino_telemetry') {
                this.handleArduinoTelemetry(jsonData);
            } else if (jsonData.type === 'mpc_command') {
                this.handleMPCCommand(jsonData);
            } else if (jsonData.type === 'simulation_request') {
                this.handleSimulationRequest(jsonData, clientId);
            }
            
        } catch (error) {
            console.error('❌ Data handling error:', error.message);
        }
    }

    handleArduinoTelemetry(data) {
        // Broadcast to all dashboard clients
        this.broadcastToDashboard({
            type: 'arduino_telemetry',
            data: data,
            timestamp: new Date().toISOString()
        });

        // Log telemetry data
        this.logTelemetryData(data);
    }

    handleMPCCommand(data) {
        // Forward MPC commands to appropriate clients
        if (data.target === 'arduino') {
            this.sendToArduino(data);
        } else if (data.target === 'matlab') {
            this.sendToMATLAB(data);
        }
    }

    handleSimulationRequest(data, clientId) {
        // Handle Simulink simulation requests
        const response = {
            type: 'simulation_response',
            simulationId: data.simulationId,
            results: this.runSimulation(data.parameters),
            timestamp: new Date().toISOString()
        };

        this.sendToClient(clientId, response);
    }

    runSimulation(parameters) {
        // Simulate Simulink simulation results
        return {
            o2_production: parameters.current * 0.00021,
            h2_production: parameters.current * 0.00042,
            voltage: 1.8 + parameters.current * 0.02,
            efficiency: Math.max(60, 70 - (parameters.current - 150) * 0.1),
            temperature: 65 + (parameters.current - 150) * 0.05
        };
    }

    sendToArduino(data) {
        // Find Arduino client and send data
        for (const [clientId, socket] of this.clients) {
            if (clientId.includes('arduino') || data.forceSend) {
                this.sendToClient(clientId, data);
                break;
            }
        }
    }

    sendToMATLAB(data) {
        // Find MATLAB client and send data
        for (const [clientId, socket] of this.clients) {
            if (clientId.includes('matlab') || data.forceSend) {
                this.sendToClient(clientId, data);
                break;
            }
        }
    }

    sendToClient(clientId, data) {
        const client = this.clients.get(clientId);
        if (client && !client.destroyed) {
            try {
                const message = JSON.stringify(data);
                client.write(message + '\n');
                console.log(`📤 Sent to ${clientId}:`, data.type || 'data');
            } catch (error) {
                console.error(`❌ Send error to ${clientId}:`, error.message);
            }
        }
    }

    broadcastToDashboard(data) {
        // Broadcast to all connected clients (assuming they're dashboard clients)
        for (const [clientId, socket] of this.clients) {
            this.sendToClient(clientId, data);
        }
    }

    logTelemetryData(data) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            ...data
        };

        const logPath = path.join(__dirname, 'logs', 'telemetry.log');
        const logDir = path.dirname(logPath);
        
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }

        fs.appendFileSync(logPath, JSON.stringify(logEntry) + '\n');
    }

    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            connectedClients: this.clients.size,
            clientIds: Array.from(this.clients.keys())
        };
    }

    disconnectClient(clientId) {
        const client = this.clients.get(clientId);
        if (client) {
            client.destroy();
            this.clients.delete(clientId);
        }
    }

    shutdown() {
        console.log('🛑 Shutting down Simulink Bridge...');
        
        // Close all client connections
        for (const [clientId, socket] of this.clients) {
            socket.destroy();
        }
        this.clients.clear();

        // Close TCP server
        if (this.server) {
            this.server.close();
        }

        // Terminate MATLAB process
        if (this.matlabProcess) {
            this.matlabProcess.kill();
        }

        console.log('✅ Simulink Bridge shutdown complete');
    }
}

module.exports = SimulinkBridge;
