/**
 * @typedef {Object} CocktailStep
 * @property {string} label - Display name of the step
 * @property {string} stateKey - Robot state key to monitor
 * @property {string} description - Description of what happens
 * @property {number} [modbusAddress] - Optional Modbus address for ordering custom ingredients
 */

/**
 * @typedef {Object} Cocktail
 * @property {string} id
 * @property {string} name
 * @property {string} imageUrl
 * @property {number} modbusAddress
 * @property {string} category
 * @property {CocktailStep[]} steps - Preparation steps
 */

/** @type {Cocktail[]} */
export const cocktails = [
	{
		id: 'mojito',
		name: 'Mojito',
		imageUrl: 'https://www.thecocktaildb.com/images/media/drink/metwgh1606770327.jpg',
		modbusAddress: 100,
		category: 'rum',
		steps: [
			{ label: 'Placing Mint', stateKey: 'mint', description: 'Placing mint leaves in the glass' }, // 32
			{ label: 'Muddling', stateKey: 'muddling', description: 'Muddling the mint leaves' }, // 33
			{ label: 'Adding Ice', stateKey: 'ice', description: 'Adding ice cubes to the glass' }, // 34
			{ label: 'Pouring Syrup', stateKey: 'syrup', description: 'Pouring syrup into a glass' }, // 35
			{ label: 'Adding Lime', stateKey: 'lime', description: 'Pouring lime into a glass' }, // 36
			{ label: 'Pouring White Rum', stateKey: 'whiteRum', description: 'Pouring white rum into a glass' }, // 37
			{ label: 'Adding Soda', stateKey: 'soda', description: 'Pouring soda into a glass' }, // 40
			{ label: 'Drink Ready', stateKey: 'drinkReady', description: 'The process is finished' } // 91
		]
	},
	{
		id: 'cuba-libre',
		name: 'Cuba Libre',
		imageUrl: 'https://www.thecocktaildb.com/images/media/drink/ck6d0p1504388696.jpg',
		modbusAddress: 101,
		category: 'rum',
		steps: [
			{ label: 'Adding Ice', stateKey: 'ice', description: 'Adding ice cubes to the glass' }, // 34
			{ label: 'Adding Lime', stateKey: 'lime', description: 'Pouring lime into a glass' }, // 36
			{ label: 'Pouring White Rum', stateKey: 'whiteRum', description: 'Pouring white rum into the glass' }, // 37
			{ label: 'Adding Coke', stateKey: 'coke', description: 'Pouring coke into the glass' }, // 41
			{ label: 'Drink Ready', stateKey: 'drinkReady', description: 'The process is finished' } // 91
		]
	},
	{
		id: 'cubata',
		name: 'Cubata',
		imageUrl: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&q=80',
		modbusAddress: 102,
		category: 'rum',
		steps: [
			{ label: 'Adding Ice', stateKey: 'ice', description: 'Adding ice cubes to the glass' }, // 34
			{ label: 'Pouring Dark Rum', stateKey: 'darkRum', description: 'Pouring dark rum into the glass' }, // 38
			{ label: 'Adding Coke', stateKey: 'coke', description: 'Pouring coke into the glass' }, // 41
			{ label: 'Drink Ready', stateKey: 'drinkReady', description: 'The process is finished' } // 91
		]
	},
	{
		id: 'whiskey-rocks',
		name: 'Whiskey on the Rocks',
		imageUrl: 'https://www.thecocktaildb.com/images/media/drink/rtpxqw1468877562.jpg',
		modbusAddress: 103,
		category: 'whiskey',
		steps: [
			{ label: 'Adding Ice', stateKey: 'ice', description: 'Adding ice cubes to the glass' }, // 34
			{ label: 'Pouring Whiskey', stateKey: 'whiskey', description: 'Pouring whiskey into the glass' }, // 39
			{ label: 'Drink Ready', stateKey: 'drinkReady', description: 'The process is finished' } // 91
		]
	},
	{
		id: 'neat-whiskey',
		name: 'Neat Whiskey',
		imageUrl: 'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400&q=80',
		modbusAddress: 104,
		category: 'whiskey',
		steps: [
			{ label: 'Pouring Whiskey', stateKey: 'whiskey', description: 'Pouring whiskey into the glass' }, // 39
			{ label: 'Drink Ready', stateKey: 'drinkReady', description: 'The process is finished' } // 91
		]
	},
	{
		id: 'whiskey-highball',
		name: 'Whiskey Highball',
		imageUrl: 'https://bevvyco.s3.amazonaws.com/img/drinks/wa/nmwa/highball-4de45d79d99c54d28ae535e11a5526dc-lg.jpg',
		modbusAddress: 105,
		category: 'whiskey',
		steps: [
			{ label: 'Adding Ice', stateKey: 'ice', description: 'Adding ice cubes to the glass' }, // 34
			{ label: 'Pouring Whiskey', stateKey: 'whiskey', description: 'Pouring whiskey into the glass' }, // 39
			{ label: 'Adding Soda', stateKey: 'soda', description: 'Pouring soda into the glass' }, // 40
			{ label: 'Drink Ready', stateKey: 'drinkReady', description: 'The process is finished' } // 91
		]
	},
	{
		id: 'whiskey-coke',
		name: 'Whiskey and Coke',
		imageUrl: 'https://bevvyco.s3.amazonaws.com/img/drinks/aa/liaa/whiskey-and-coke-5b5766b04fd7d1673ac4b7af52062899-lg.jpg?ts=1496502632000',
		modbusAddress: 106,
		category: 'whiskey',
		steps: [
			{ label: 'Adding Ice', stateKey: 'ice', description: 'Adding ice cubes to the glass' }, // 34
			{ label: 'Pouring Whiskey', stateKey: 'whiskey', description: 'Pouring whiskey into the glass' }, // 39
			{ label: 'Adding Coke', stateKey: 'coke', description: 'Pouring coke into the glass' }, // 41
			{ label: 'Drink Ready', stateKey: 'drinkReady', description: 'The process is finished' } // 91
		]
	}
];

// Map ingredient IDs to their configuration with modbus addresses for ordering
const ingredientMapping = {
	'mint': { label: 'Placing Mint', stateKey: 'mint', description: 'Placing mint leaves in the glass', modbusAddress: 32 },
	'ice': { label: 'Adding Ice', stateKey: 'ice', description: 'Adding ice cubes to the glass', modbusAddress: 34 },
	'syrup': { label: 'Pouring Syrup', stateKey: 'syrup', description: 'Pouring syrup into the glass', modbusAddress: 35 },
	'lime': { label: 'Adding Lime', stateKey: 'lime', description: 'Pouring lime into the glass', modbusAddress: 36 },
	'white-rum': { label: 'Pouring White Rum', stateKey: 'whiteRum', description: 'Pouring white rum into the glass', modbusAddress: 37 },
	'dark-rum': { label: 'Pouring Dark Rum', stateKey: 'darkRum', description: 'Pouring dark rum into the glass', modbusAddress: 38 },
	'whiskey': { label: 'Pouring Whiskey', stateKey: 'whiskey', description: 'Pouring whiskey into the glass', modbusAddress: 39 },
	'soda': { label: 'Adding Soda', stateKey: 'soda', description: 'Pouring soda into the glass', modbusAddress: 40 },
	'coke': { label: 'Adding Coke', stateKey: 'coke', description: 'Pouring coke into the glass', modbusAddress: 41 }
};

/**
 * Get cocktail by ID
 * @param {string} id
 * @param {string[] | null} [customIngredients] - Selected ingredients for custom drinks
 * @returns {Cocktail | undefined}
 */
export function getCocktailById(id, customIngredients = null) {
	// Handle custom cocktail
	if (id === 'custom') {
		/** @type {CocktailStep[]} */
		const steps = [];

		// Generate steps based on selected ingredients
		if (customIngredients && customIngredients.length > 0) {
			customIngredients.forEach(ingredientId => {
				// @ts-ignore - ingredientId is a valid key from CustomCocktailModal
				const ingredient = ingredientMapping[ingredientId];
				if (ingredient) {
					steps.push(ingredient);
				}
			});

			// Sort steps by modbus address to show them in the correct execution order
			steps.sort((a, b) => a.modbusAddress - b.modbusAddress);
		}

		// Always add "Drink Ready" as the final step
		steps.push({ label: 'Drink Ready', stateKey: 'drinkReady', description: 'Your custom drink is ready!' });

		return {
			id: 'custom',
			name: 'Custom Drink',
			imageUrl: '',
			modbusAddress: 107,
			category: 'custom',
			steps: steps
		};
	}
	return cocktails.find(c => c.id === id);
}

/**
 * Get cocktails by category
 * @param {string} category
 * @returns {Cocktail[]}
 */
export function getCocktailsByCategory(category) {
	return cocktails.filter(c => c.category === category);
}
