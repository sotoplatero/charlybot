import { json } from '@sveltejs/kit';
import { getModbusClient } from '$lib/services/modbusClient.js';

const MODBUS_WRITE_DELAY_MS = 50; // Delay between Modbus write operations (good practice)

/**
 * Helper function to add delay between Modbus operations
 * Prevents saturating the Modbus server
 * @param {number} ms - Milliseconds to wait
 */
function delay(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	try {
		const { ingredients } = await request.json();

		if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
			return json({ error: true, message: 'No ingredients selected' }, { status: 400 });
		}

		const client = await getModbusClient();

		// Map ingredient IDs to Modbus addresses
		const ingredientMap = {
			'mint': 132,       // Mint
			'ice': 134,        // Ice
			'syrup': 135,      // Syrup
			'lime': 136,       // Lime
			'white-rum': 137,  // White Rum
			'dark-rum': 138,   // Dark Rum
			'whiskey': 139,    // Whiskey
			'soda': 140,       // Soda
			'coke': 141        // Coke
		};

		// Check if soda or coke is included
		const hasMixer = ingredients.includes('soda') || ingredients.includes('coke');
		const hasMint = ingredients.includes('mint');

		// Write each selected ingredient to Modbus
		for (const ingredientId of ingredients) {
			const address = ingredientMap[ingredientId];
			if (address) {
				await client.writeCoil(address, true);
				console.log(`Custom drink: Activated ${ingredientId} at address ${address}`);
				await delay(MODBUS_WRITE_DELAY_MS); // Prevent saturating Modbus server
			}
		}

		// If mint is selected, also activate muddling
		if (hasMint) {
			await client.writeCoil(133, true); // muddling
			console.log('Custom drink: Activated muddling at address 133');
			await delay(MODBUS_WRITE_DELAY_MS);
		}

		// If soda or coke is included, activate stirring and straw
		if (hasMixer) {
			await client.writeCoil(142, true); // stirring
			console.log('Custom drink: Activated stirring at address 142');
			await delay(MODBUS_WRITE_DELAY_MS);

			await client.writeCoil(143, true); // straw
			console.log('Custom drink: Activated straw at address 143');
			await delay(MODBUS_WRITE_DELAY_MS);
		}

		// Write to custom drink address (107)
		await client.writeCoil(107, true);
		console.log('Custom drink: Activated custom address 107');
		await delay(MODBUS_WRITE_DELAY_MS);

		// Write to start address (96) to tell robot to begin
		await client.writeCoil(96, true);
		console.log('Custom drink: Activated start signal at address 96');

		// Note: Frontend will monitor status via /api/status polling
		// When 91 = 1 (drinkReady), frontend calls /api/reset-addresses
		// Popup closes when 92 = 1 (waitingRecipe)

		console.log('Custom cocktail order placed successfully');

		return json({
			success: true,
			message: 'Custom cocktail order placed',
			ingredients: ingredients,
			extras: {
				muddling: hasMint,
				stirring: hasMixer,
				straw: hasMixer
			}
		});

	} catch (error) {
		console.error('Error ordering custom cocktail:', error);
		return json({
			error: true,
			message: error.message || 'Failed to order custom cocktail'
		}, { status: 500 });
	}
}
