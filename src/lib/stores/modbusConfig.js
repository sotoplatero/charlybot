import { writable } from 'svelte/store';

/**
 * @typedef {Object} ModbusConfig
 * @property {string} host - Modbus TCP host
 * @property {number} port - Modbus TCP port
 * @property {number} unitId - Slave/Unit ID
 * @property {number} timeout - Connection timeout in milliseconds
 */

// Default configuration
const DEFAULT_CONFIG = {
	host: '192.168.125.1',
	port: 502,
	unitId: 1,
	timeout: 5000
};

/**
 * Load configuration from localStorage or use defaults
 * @returns {ModbusConfig}
 */
function loadConfig() {
	if (typeof window === 'undefined') return DEFAULT_CONFIG;

	try {
		const stored = localStorage.getItem('modbusConfig');
		if (stored) {
			return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
		}
	} catch (error) {
		console.error('[ModbusConfig] Failed to load config:', error);
	}

	return DEFAULT_CONFIG;
}

/**
 * Save configuration to localStorage
 * @param {ModbusConfig} config
 */
function saveConfig(config) {
	if (typeof window === 'undefined') return;

	try {
		localStorage.setItem('modbusConfig', JSON.stringify(config));
		console.log('[ModbusConfig] Configuration saved:', config);
	} catch (error) {
		console.error('[ModbusConfig] Failed to save config:', error);
	}
}

/** @type {import('svelte/store').Writable<ModbusConfig>} */
export const modbusConfig = writable(loadConfig());

// Subscribe to changes and save to localStorage
modbusConfig.subscribe(config => {
	saveConfig(config);
});

/**
 * Update Modbus configuration
 * @param {Partial<ModbusConfig>} updates
 */
export function updateModbusConfig(updates) {
	modbusConfig.update(config => ({
		...config,
		...updates
	}));
}

/**
 * Reset configuration to defaults
 */
export function resetModbusConfig() {
	modbusConfig.set(DEFAULT_CONFIG);
}

/**
 * Get current configuration (for server-side use)
 * @returns {ModbusConfig}
 */
export function getModbusConfig() {
	return loadConfig();
}
