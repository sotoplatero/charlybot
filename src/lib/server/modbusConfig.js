import { env } from '$env/dynamic/private';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

/**
 * @typedef {Object} ModbusConfig
 * @property {string} host
 * @property {number} port
 * @property {number} unitId
 * @property {number} timeout
 */

const CONFIG_FILE_PATH = join(process.cwd(), 'modbus-config.json');

// Default configuration
const DEFAULT_CONFIG = {
	host: env.MODBUS_HOST || '192.168.125.1',
	port: parseInt(env.MODBUS_PORT || '502'),
	unitId: parseInt(env.MODBUS_UNIT_ID || '1'),
	timeout: parseInt(env.MODBUS_TIMEOUT || '5000')
};

/** @type {ModbusConfig | null} */
let currentConfig = null;

/**
 * Load configuration from file or use defaults
 * @returns {ModbusConfig}
 */
function loadConfig() {
	try {
		if (existsSync(CONFIG_FILE_PATH)) {
			const data = readFileSync(CONFIG_FILE_PATH, 'utf-8');
			const config = JSON.parse(data);
			console.log('[ModbusConfig] Loaded configuration from file:', config);
			return { ...DEFAULT_CONFIG, ...config };
		}
	} catch (error) {
		const err = /** @type {Error} */ (error);
		console.error('[ModbusConfig] Failed to load config file:', err.message);
	}

	console.log('[ModbusConfig] Using default configuration:', DEFAULT_CONFIG);
	return DEFAULT_CONFIG;
}

/**
 * Save configuration to file
 * @param {ModbusConfig} config
 */
function saveConfig(config) {
	try {
		writeFileSync(CONFIG_FILE_PATH, JSON.stringify(config, null, 2), 'utf-8');
		console.log('[ModbusConfig] Configuration saved to file:', config);
	} catch (error) {
		const err = /** @type {Error} */ (error);
		console.error('[ModbusConfig] Failed to save config file:', err.message);
		throw error;
	}
}

/**
 * Get current Modbus configuration
 * @returns {ModbusConfig}
 */
export function getConfig() {
	if (!currentConfig) {
		currentConfig = loadConfig();
	}
	return currentConfig;
}

/**
 * Update Modbus configuration and save to file
 * @param {Partial<ModbusConfig>} updates
 * @returns {ModbusConfig}
 */
export function updateConfig(updates) {
	currentConfig = {
		...getConfig(),
		...updates
	};
	saveConfig(currentConfig);
	console.log('[ModbusConfig] Configuration updated:', currentConfig);
	return currentConfig;
}

/**
 * Reset configuration to defaults
 * @returns {ModbusConfig}
 */
export function resetConfig() {
	currentConfig = { ...DEFAULT_CONFIG };
	saveConfig(currentConfig);
	console.log('[ModbusConfig] Configuration reset to defaults');
	return currentConfig;
}
