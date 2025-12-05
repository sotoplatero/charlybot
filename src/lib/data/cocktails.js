/**
 * @typedef {Object} CocktailStep
 * @property {string} label - Display name of the step
 * @property {string} stateKey - Robot state key to monitor
 * @property {string} description - Description of what happens
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
		imageUrl: 'https://www.thecocktaildb.com/images/media/drink/rw8cw21582485096.jpg',
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
		imageUrl: 'https://www.thecocktaildb.com/images/media/drink/5s22081504883416.jpg',
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
		imageUrl: 'https://www.thecocktaildb.com/images/media/drink/n0sx531504372951.jpg',
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
		imageUrl: 'https://www.thecocktaildb.com/images/media/drink/wzupxr1580737578.jpg',
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

/**
 * Get cocktail by ID
 * @param {string} id
 * @returns {Cocktail | undefined}
 */
export function getCocktailById(id) {
	// Handle custom cocktail
	if (id === 'custom') {
		return {
			id: 'custom',
			name: 'Custom Drink',
			imageUrl: '',
			modbusAddress: 107,
			category: 'custom',
			steps: [
				{ label: 'Preparing', stateKey: 'preparing', description: 'Preparing your custom drink' },
				{ label: 'Drink Ready', stateKey: 'drinkReady', description: 'Your custom drink is ready!' }
			]
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
