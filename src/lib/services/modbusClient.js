import ModbusRTU from 'modbus-serial';
import { getConfig } from '$lib/server/modbusConfig.js';

/** @typedef {Object} ModbusConnectionConfig
 * @property {string} host - Modbus TCP host
 * @property {number} port - Modbus TCP port
 * @property {number} unitId - Slave/Unit ID
 */

/** @type {ModbusRTU | null} */
let client = null;
let isConnecting = false;
/** @type {Promise<ModbusRTU> | null} */
let connectionPromise = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 3;

/**
 * Get current configuration (always fresh from file)
 */
function getModbusConfig() {
	const config = getConfig();
	return {
		...config,
		reconnectInterval: 3000
	};
}

// Log configuration on startup (once)
const initialConfig = getModbusConfig();
console.log(`[Modbus] Initial Configuration: ${initialConfig.host}:${initialConfig.port} (Unit ID: ${initialConfig.unitId}, Timeout: ${initialConfig.timeout}ms)`);

/**
 * Get or create Modbus client connection (singleton pattern)
 * @returns {Promise<ModbusRTU>}
 */
export async function getModbusClient() {
	// Return existing connection if available
	if (client && client.isOpen) {
		reconnectAttempts = 0; // Reset on successful connection
		return client;
	}

	// Wait for pending connection
	if (isConnecting && connectionPromise) {
		return connectionPromise;
	}

	// Check reconnect attempts
	if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
		throw new Error(`Failed to connect after ${MAX_RECONNECT_ATTEMPTS} attempts. Please check robot connection.`);
	}

	// Create new connection
	isConnecting = true;
	connectionPromise = connect();

	try {
		client = await connectionPromise;
		reconnectAttempts = 0;
		return client;
	} catch (error) {
		reconnectAttempts++;
		throw error;
	} finally {
		isConnecting = false;
		connectionPromise = null;
	}
}

/**
 * Establish Modbus TCP connection
 * @returns {Promise<ModbusRTU>}
 */
async function connect() {
	const CONFIG = getModbusConfig();
	const newClient = new ModbusRTU();
	newClient.setTimeout(CONFIG.timeout);

	try {
		console.log(`[Modbus] Attempting connection to ${CONFIG.host}:${CONFIG.port}...`);
		await newClient.connectTCP(CONFIG.host, { port: CONFIG.port });
		newClient.setID(CONFIG.unitId);
		console.log(`[Modbus] ✓ Connected to ${CONFIG.host}:${CONFIG.port}`);

		// Handle connection errors
		newClient.on('error', (err) => {
			console.error('[Modbus] ✗ Connection error:', err);
			closeConnection();
		});

		newClient.on('close', () => {
			console.warn('[Modbus] Connection closed');
			closeConnection();
		});

		return newClient;
	} catch (error) {
		console.error('[Modbus] ✗ Failed to connect:', error);

		// Provide user-friendly error messages
		if (error.code === 'ECONNREFUSED') {
			throw new Error(`Robot is offline. Unable to connect to ${CONFIG.host}:${CONFIG.port}`);
		} else if (error.code === 'ETIMEDOUT') {
			throw new Error(`Connection timeout. Robot may be busy or unreachable.`);
		} else if (error.code === 'ENETUNREACH') {
			throw new Error(`Network unreachable. Check network connection.`);
		} else {
			throw new Error(`Connection failed: ${error.message}`);
		}
	}
}

/**
 * Close Modbus connection
 */
export function closeConnection() {
	if (client) {
		try {
			client.close(() => {
				console.log('[Modbus] Connection closed gracefully');
			});
		} catch (error) {
			console.error('[Modbus] Error closing connection:', error);
		}
		client = null;
	}
}

/**
 * Force reconnection with new configuration
 * Closes current connection and clears cached client
 */
export function forceReconnect() {
	console.log('[Modbus] Forcing reconnection with new configuration...');
	closeConnection();
	isConnecting = false;
	connectionPromise = null;
	reconnectAttempts = 0;
	const newConfig = getModbusConfig();
	console.log(`[Modbus] New configuration loaded: ${newConfig.host}:${newConfig.port} (Unit ID: ${newConfig.unitId})`);
}

/**
 * Check if connected
 * @returns {boolean}
 */
export function isConnected() {
	return client !== null && client.isOpen;
}

/**
 * Reset reconnection attempts
 */
export function resetReconnectAttempts() {
	reconnectAttempts = 0;
}
