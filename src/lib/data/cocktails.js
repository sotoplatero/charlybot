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
		id: 'cognac',
		name: 'Cognac',
		imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Cognac_glass.jpg/1280px-Cognac_glass.jpg',
		modbusAddress: 102,
		category: 'rum',
		steps: [
			{ label: 'Pouring Cognac', stateKey: 'cognac', description: 'Pouring Cognac into the glass' }, // 38
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

// Map ingredient IDs to their configuration
// modbusReadAddress: address for reading status/monitoring (32-41)
// modbusWriteAddress: address for writing commands to activate ingredient (132-143)
export const ingredientMapping = {
	'mint': {
		label: 'Placing Mint',
		stateKey: 'mint',
		description: 'Placing mint leaves in the glass',
		modbusReadAddress: 32,
		modbusWriteAddress: 132
	},
	'muddling': {
		label: 'Muddling',
		stateKey: 'muddling',
		description: 'Muddling the ingredients',
		modbusReadAddress: 33,
		modbusWriteAddress: 133
	},
	'ice': {
		label: 'Adding Ice',
		stateKey: 'ice',
		description: 'Adding ice cubes to the glass',
		modbusReadAddress: 34,
		modbusWriteAddress: 134
	},
	'syrup': {
		label: 'Pouring Syrup',
		stateKey: 'syrup',
		description: 'Pouring syrup into the glass',
		modbusReadAddress: 35,
		modbusWriteAddress: 135
	},
	'lime': {
		label: 'Adding Lime',
		stateKey: 'lime',
		description: 'Pouring lime into the glass',
		modbusReadAddress: 36,
		modbusWriteAddress: 136
	},
	'white-rum': {
		label: 'Pouring White Rum',
		stateKey: 'whiteRum',
		description: 'Pouring white rum into the glass',
		modbusReadAddress: 37,
		modbusWriteAddress: 137
	},
	'cognac': {
		label: 'Pouring cognac',
		stateKey: 'cognac',
		description: 'Pouring cognac into the glass',
		modbusReadAddress: 38,
		modbusWriteAddress: 138
	},
	'whiskey': {
		label: 'Pouring Whiskey',
		stateKey: 'whiskey',
		description: 'Pouring whiskey into the glass',
		modbusReadAddress: 39,
		modbusWriteAddress: 139
	},
	'soda': {
		label: 'Adding Soda',
		stateKey: 'soda',
		description: 'Pouring soda into the glass',
		modbusReadAddress: 40,
		modbusWriteAddress: 140
	},
	'coke': {
		label: 'Adding Coke',
		stateKey: 'coke',
		description: 'Pouring coke into the glass',
		modbusReadAddress: 41,
		modbusWriteAddress: 141
	},
	'stirring': {
		label: 'Stirring',
		stateKey: 'stirring',
		description: 'Stirring the drink',
		modbusReadAddress: 42,
		modbusWriteAddress: 142
	},
	'straw': {
		label: 'Adding Straw',
		stateKey: 'straw',
		description: 'Adding a straw',
		modbusReadAddress: 43,
		modbusWriteAddress: 143
	}
};

// Cocktail recipes with ingredient write addresses for Modbus commands
export const cocktailRecipes = {
	'mojito': [
		ingredientMapping['mint'].modbusWriteAddress,       // 132
		ingredientMapping['muddling'].modbusWriteAddress,   // 133
		ingredientMapping['syrup'].modbusWriteAddress,      // 135
		ingredientMapping['lime'].modbusWriteAddress,       // 136
		ingredientMapping['ice'].modbusWriteAddress,        // 134
		ingredientMapping['white-rum'].modbusWriteAddress,  // 137
		ingredientMapping['soda'].modbusWriteAddress,       // 140
		ingredientMapping['stirring'].modbusWriteAddress,   // 142
		ingredientMapping['straw'].modbusWriteAddress       // 143
	],
	'cuba-libre': [
		ingredientMapping['ice'].modbusWriteAddress,        // 134
		ingredientMapping['white-rum'].modbusWriteAddress,  // 137
		ingredientMapping['lime'].modbusWriteAddress,       // 136
		ingredientMapping['coke'].modbusWriteAddress,       // 141
		ingredientMapping['stirring'].modbusWriteAddress,   // 142
		ingredientMapping['straw'].modbusWriteAddress       // 143
	],
	'cognac': [
		ingredientMapping['cognac'].modbusWriteAddress,   // 138
	],
	'whiskey-rocks': [
		ingredientMapping['ice'].modbusWriteAddress,        // 134
		ingredientMapping['whiskey'].modbusWriteAddress     // 139
	],
	'neat-whiskey': [
		ingredientMapping['whiskey'].modbusWriteAddress     // 139
	],
	'whiskey-highball': [
		ingredientMapping['ice'].modbusWriteAddress,        // 134
		ingredientMapping['whiskey'].modbusWriteAddress,    // 139
		ingredientMapping['soda'].modbusWriteAddress,       // 140
		ingredientMapping['stirring'].modbusWriteAddress,   // 142
		ingredientMapping['straw'].modbusWriteAddress       // 143
	],
	'whiskey-coke': [
		ingredientMapping['ice'].modbusWriteAddress,        // 134
		ingredientMapping['whiskey'].modbusWriteAddress,    // 139
		ingredientMapping['coke'].modbusWriteAddress,       // 141
		ingredientMapping['stirring'].modbusWriteAddress,   // 142
		ingredientMapping['straw'].modbusWriteAddress       // 143
	]
};

// Special Modbus control addresses
export const modbusControlAddresses = {
	START: 96,           // Write 1 to start the robot
	DRINK_READY: 91,     // Read: 1 when drink is ready
	WAITING_RECIPE: 92   // Read: 1 when robot is ready for new order, 0 when busy
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
			steps.sort((a, b) => (a.modbusReadAddress || 0) - (b.modbusReadAddress || 0));
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
