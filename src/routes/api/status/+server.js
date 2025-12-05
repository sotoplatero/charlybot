import { json, error } from '@sveltejs/kit';
import { getModbusClient, isConnected } from '$lib/services/modbusClient.js';

/**
 * Read robot state from Modbus addresses in batches for better performance
 * Tries discrete inputs first, then falls back to coils
 * @param {import('modbus-serial')} client
 * @returns {Promise<Object>}
 */
async function readRobotState(client) {
	const state = {};

	try {
		// Read step states in one batch (addresses 32-41: 10 consecutive addresses)
		// All variables are COILS in RobotStudio
		console.log('[Status] Reading step states (32-41) as coils...');
		let stepStates = await client.readCoils(32, 10);
		console.log('[Status] Step states read successfully');

		// Map step states to keys (according to Modbus table)
		state.mint = stepStates.data[0] === true;        // Address 32
		state.muddling = stepStates.data[1] === true;    // Address 33
		state.ice = stepStates.data[2] === true;         // Address 34
		state.syrup = stepStates.data[3] === true;       // Address 35
		state.lime = stepStates.data[4] === true;        // Address 36
		state.whiteRum = stepStates.data[5] === true;    // Address 37
		state.darkRum = stepStates.data[6] === true;     // Address 38
		state.whiskey = stepStates.data[7] === true;     // Address 39
		state.soda = stepStates.data[8] === true;        // Address 40
		state.coke = stepStates.data[9] === true;        // Address 41

		// Log which steps are active
		const activeSteps = [];
		if (state.mint) activeSteps.push('mint(32)');
		if (state.muddling) activeSteps.push('muddling(33)');
		if (state.ice) activeSteps.push('ice(34)');
		if (state.syrup) activeSteps.push('syrup(35)');
		if (state.lime) activeSteps.push('lime(36)');
		if (state.whiteRum) activeSteps.push('whiteRum(37)');
		if (state.darkRum) activeSteps.push('darkRum(38)');
		if (state.whiskey) activeSteps.push('whiskey(39)');
		if (state.soda) activeSteps.push('soda(40)');
		if (state.coke) activeSteps.push('coke(41)');
		console.log(`[Status] Active steps: ${activeSteps.length > 0 ? activeSteps.join(', ') : 'none'}`);

	} catch (stepError) {
		// Silently set defaults on error to avoid spam
		if (!stepError.message.includes('Timed out')) {
			console.warn('[Modbus] Could not read step states (32-41):', stepError.message);
		}
		// Set all step states to false on error
		state.mint = false;
		state.muddling = false;
		state.ice = false;
		state.syrup = false;
		state.lime = false;
		state.whiteRum = false;
		state.darkRum = false;
		state.whiskey = false;
		state.soda = false;
		state.coke = false;
	}

	try {
		// Read system states in one batch (addresses 90-92: 3 consecutive addresses)
		// All variables are COILS in RobotStudio
		console.log('[Status] Reading system states (90-92) as coils...');
		let systemStates = await client.readCoils(90, 3);
		console.log('[Status] System states read successfully');

		// Map system states to keys
		state.cupHolder = systemStates.data[0] === true;
		state.drinkReady = systemStates.data[1] === true;
		state.waitingRecipe = systemStates.data[2] === true;

	} catch (systemError) {
		console.warn('[Modbus] Could not read system states (90-92):', systemError.message);
		// Set all system states to false on error
		state.cupHolder = false;
		state.drinkReady = false;
		state.waitingRecipe = false;
	}

	return state;
}

/** @type {import('./$types').RequestHandler} */
export async function GET() {
	try {
		console.log('[Status] Polling robot state...');

		if (!isConnected()) {
			console.log('[Status] Not connected, returning default state');
			return json({
				isConnected: false,
				robotState: getDefaultState(),
				error: 'Not connected to robot'
			});
		}

		const client = await getModbusClient();

		// Read state addresses using discrete inputs or coils (not holding registers)
		// Step addresses: 32-41 (10 addresses)
		// System addresses: 90-92 (3 addresses)
		const robotState = await readRobotState(client);

		console.log(`[Status] State read - drinkReady: ${robotState.drinkReady ? 1 : 0}, waitingRecipe: ${robotState.waitingRecipe ? 1 : 0}`);

		return json({
			isConnected: true,
			robotState,
			timestamp: new Date().toISOString()
		});

	} catch (err) {
		console.error('[Status] Polling error:', err);

		// Return a more graceful error response instead of throwing
		// This prevents the frontend from completely failing on transient errors
		return json({
			isConnected: false,
			robotState: getDefaultState(),
			error: err.message || 'Failed to read robot status',
			timestamp: new Date().toISOString()
		}, { status: 200 }); // Return 200 with error info instead of 500
	}
}

function getDefaultState() {
	return {
		mint: false,         // Address 32
		muddling: false,     // Address 33
		ice: false,          // Address 34
		syrup: false,        // Address 35
		lime: false,         // Address 36
		whiteRum: false,     // Address 37
		darkRum: false,      // Address 38
		whiskey: false,      // Address 39
		soda: false,         // Address 40
		coke: false,         // Address 41
		cupHolder: false,    // Address 90
		drinkReady: false,   // Address 91
		waitingRecipe: false // Address 92
	};
}
