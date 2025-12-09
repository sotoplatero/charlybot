import { json } from '@sveltejs/kit';
import { getModbusClient, isConnected, resetReconnectAttempts } from '$lib/services/modbusClient.js';
import { cocktails } from '$lib/data/cocktails.js';

/**
 * Helper function to add delay between Modbus operations
 * Prevents saturating the Modbus server
 * @param {number} ms - Milliseconds to wait
 */
function delay(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check initial robot state on app load
 * - If address 92 = 1: Robot ready, write 0 to address 96, show menu
 * - If address 92 = 0: Robot busy, read 100-107 to detect active cocktail
 *
 * @type {import('./$types').RequestHandler}
 */
export async function GET() {
	try {
		if (!isConnected()) {
			// Try to connect
			await getModbusClient();
		}

		const client = await getModbusClient();

		// Read address 92 (waitingRecipe / robot ready)
		// All variables are COILS in RobotStudio
		const result = await client.readCoils(92, 1);
		const waitingRecipe = result.data[0] === true;

		console.log(`[Initial State] Address 92 (waitingRecipe) = ${waitingRecipe ? 1 : 0}`);

		// CASE 1: Robot ready (92 = 1)
		if (waitingRecipe === true) {
			// Reset start signal (write 0 to address 96)
			await delay(50); // Good practice: small delay before write
			await client.writeCoil(96, false);
			console.log('[Initial State] Robot ready - Reset start signal (96 = 0)');

			return json({
				robotReady: true,
				activeCocktailId: null,
				message: 'Robot ready to receive orders'
			});
		}

		// CASE 2: Robot busy (92 = 0) - Detect active cocktail
		console.log('[Initial State] Robot busy - Detecting active cocktail (reading 100-107)...');

		// Read cocktail addresses 100-107 (8 addresses) in one batch
		// All variables are COILS in RobotStudio
		const cocktailStates = await client.readCoils(100, 8);

		// Find which cocktail is active (value = 1)
		const activeCocktailAddress = cocktailStates.data.findIndex(value => value === true);

		if (activeCocktailAddress !== -1) {
			const address = 100 + activeCocktailAddress; // Convert index to actual address

			// Map address to cocktail ID
			const activeCocktail = cocktails.find(c => c.modbusAddress === address);

			// Check if it's custom (address 107)
			const cocktailId = address === 107 ? 'custom' : activeCocktail?.id;

			if (cocktailId) {
				console.log(`[Initial State] Active cocktail detected: ${cocktailId} (address ${address})`);

				return json({
					robotReady: false,
					activeCocktailId: cocktailId,
					message: `Robot is preparing ${cocktailId}`
				});
			}
		}

		// No active cocktail found but robot not ready - unusual state
		console.warn('[Initial State] Robot busy but no active cocktail detected');
		return json({
			robotReady: false,
			activeCocktailId: null,
			message: 'Robot in transitional state'
		});

	} catch (error) {
		console.error('[Initial State] Error:', error);

		// Reset reconnect attempts so next request can try again
		resetReconnectAttempts();

		return json({
			robotReady: false,
			activeCocktailId: null,
			error: error.message || 'Failed to check robot state',
			message: 'Connection error'
		}, { status: 500 });
	}
}
