import { json } from '@sveltejs/kit';
import { getModbusClient } from '$lib/services/modbusClient.js';
import { ingredientMapping, modbusControlAddresses } from '$lib/data/cocktails.js';

const MODBUS_WRITE_DELAY_MS = 50; // Delay between Modbus write operations (good practice)
const CUSTOM_COCKTAIL_ADDRESS = 107; // Modbus address for custom cocktails

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

		// Check if soda or coke is included
		const hasMixer = ingredients.includes('soda') || ingredients.includes('coke');
		const hasMint = ingredients.includes('mint');

		// Write each selected ingredient to Modbus
		for (const ingredientId of ingredients) {
			const ingredient = ingredientMapping[ingredientId];
			if (ingredient && ingredient.modbusWriteAddress) {
				await client.writeCoil(ingredient.modbusWriteAddress, true);
				console.log(`Custom drink: Activated ${ingredientId} at address ${ingredient.modbusWriteAddress}`);
				await delay(MODBUS_WRITE_DELAY_MS); // Prevent saturating Modbus server
			}
		}

		// If mint is selected, also activate muddling
		if (hasMint) {
			const muddling = ingredientMapping['muddling'];
			await client.writeCoil(muddling.modbusWriteAddress, true);
			console.log(`Custom drink: Activated muddling at address ${muddling.modbusWriteAddress}`);
			await delay(MODBUS_WRITE_DELAY_MS);
		}

		// If soda or coke is included, activate stirring and straw
		if (hasMixer) {
			const stirring = ingredientMapping['stirring'];
			await client.writeCoil(stirring.modbusWriteAddress, true);
			console.log(`Custom drink: Activated stirring at address ${stirring.modbusWriteAddress}`);
			await delay(MODBUS_WRITE_DELAY_MS);

			const straw = ingredientMapping['straw'];
			await client.writeCoil(straw.modbusWriteAddress, true);
			console.log(`Custom drink: Activated straw at address ${straw.modbusWriteAddress}`);
			await delay(MODBUS_WRITE_DELAY_MS);
		}

		// Write to custom drink address
		await client.writeCoil(CUSTOM_COCKTAIL_ADDRESS, true);
		console.log(`Custom drink: Activated custom address ${CUSTOM_COCKTAIL_ADDRESS}`);
		await delay(MODBUS_WRITE_DELAY_MS);

		// Write to start address to tell robot to begin
		await client.writeCoil(modbusControlAddresses.START, true);
		console.log(`Custom drink: Activated start signal at address ${modbusControlAddresses.START}`);

		// Note: Frontend will monitor status via /api/status polling
		// When DRINK_READY = 1, frontend calls /api/reset-addresses
		// Popup closes when WAITING_RECIPE = 1

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
