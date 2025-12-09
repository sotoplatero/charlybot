import { json } from '@sveltejs/kit';
import { getModbusClient } from '$lib/services/modbusClient.js';

const MODBUS_WRITE_DELAY_MS = 50; // Delay between Modbus write operations

/**
 * Helper function to add delay between Modbus operations
 * @param {number} ms
 */
function delay(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Reset all Modbus addresses when drink is ready (91 = 1)
 * Called by frontend when it detects drinkReady state
 *
 * @type {import('./$types').RequestHandler}
 */
export async function POST() {
	try {
		const client = await getModbusClient();

		console.log('[Reset] Starting address reset (triggered by 91 = 1)...');

		// Reset cocktail addresses (100-107)
		const COCKTAIL_ADDRESSES = [100, 101, 102, 103, 104, 105, 106, 107];
		console.log('[Reset] Resetting cocktail addresses (100-107)...');

		for (const address of COCKTAIL_ADDRESSES) {
			try {
				await client.writeCoil(address, false);
				console.log(`[Reset]   ✓ Address ${address} = 0`);
				await delay(MODBUS_WRITE_DELAY_MS);
			} catch (err) {
				console.error(`[Reset]   ✗ Failed to reset address ${address}:`, err.message);
			}
		}

		// Reset ingredient addresses (132-143)
		const INGREDIENT_ADDRESSES = [132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143];
		console.log('[Reset] Resetting ingredient addresses (132-143)...');

		for (const address of INGREDIENT_ADDRESSES) {
			try {
				await client.writeCoil(address, false);
				console.log(`[Reset]   ✓ Ingredient address ${address} = 0`);
				await delay(MODBUS_WRITE_DELAY_MS);
			} catch (err) {
				console.error(`[Reset]   ✗ Failed to reset ingredient address ${address}:`, err.message);
			}
		}

		// Reset start signal (96)
		try {
			await client.writeCoil(96, false);
			console.log('[Reset]   ✓ Start signal (96) = 0');
		} catch (err) {
			console.error(`[Reset]   ✗ Failed to reset start signal:`, err.message);
		}

		console.log('[Reset] ✓ All addresses reset complete');

		return json({
			success: true,
			message: 'All addresses reset successfully'
		});

	} catch (error) {
		console.error('[Reset] Error:', error);
		return json({
			success: false,
			error: error.message || 'Failed to reset addresses'
		}, { status: 500 });
	}
}
