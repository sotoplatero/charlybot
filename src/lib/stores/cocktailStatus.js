import { writable } from 'svelte/store';
import { getCocktailById } from '$lib/data/cocktails.js';

/**
 * @typedef {Object} RobotState
 * @property {boolean} mint - Address 32
 * @property {boolean} muddling - Address 33
 * @property {boolean} ice - Address 34
 * @property {boolean} syrup - Address 35
 * @property {boolean} lime - Address 36
 * @property {boolean} whiteRum - Address 37
 * @property {boolean} cognac - Address 38
 * @property {boolean} whiskey - Address 39
 * @property {boolean} soda - Address 40
 * @property {boolean} coke - Address 41
 * @property {boolean} cupHolder - Address 90
 * @property {boolean} drinkReady - Address 91
 * @property {boolean} waitingRecipe - Address 92
 */

/**
 * @typedef {Object} CocktailStatus
 * @property {string | null} activeCocktailId - Currently preparing cocktail
 * @property {string[] | null} customIngredients - Selected ingredients for custom drinks
 * @property {RobotState} robotState - Current robot state
 * @property {boolean} isConnected - Modbus connection status
 * @property {Error | null} error - Last error
 * @property {number} progress - Preparation progress (0-100)
 */

/** @type {import('svelte/store').Writable<CocktailStatus>} */
export const cocktailStatus = writable({
	activeCocktailId: null,
	customIngredients: null,
	robotState: {
		mint: false,         // Address 32
		muddling: false,     // Address 33
		ice: false,          // Address 34
		syrup: false,        // Address 35
		lime: false,         // Address 36
		whiteRum: false,     // Address 37
		cognac: false,      // Address 38
		whiskey: false,      // Address 39
		soda: false,         // Address 40
		coke: false,         // Address 41
		cupHolder: false,    // Address 90
		drinkReady: false,   // Address 91
		waitingRecipe: false // Address 92
	},
	isConnected: false,
	error: null,
	progress: 0
});

/** @type {number | null} */
let pollingInterval = null;

/** @type {boolean} */
let resetTriggered = false;

/**
 * Start polling Modbus status
 * @param {string} cocktailId
 * @param {string[] | null} [customIngredients] - Selected ingredients for custom drinks
 */
export function startStatusPolling(cocktailId, customIngredients = null) {
	resetTriggered = false; // Reset flag for new cocktail

	cocktailStatus.update(state => ({
		...state,
		activeCocktailId: cocktailId,
		customIngredients: customIngredients,
		progress: 0,
		error: null
	}));

	if (pollingInterval) {
		clearInterval(pollingInterval);
	}

	console.log(`[Status] Starting polling for ${cocktailId}`);

	// Poll every 3000ms (reduced frequency to avoid Modbus conflicts)
	pollingInterval = setInterval(async () => {
		try {
			console.log('[Status] Fetching /api/status...');
			const response = await fetch('/api/status', {
				// Add timeout to prevent hanging requests
				signal: AbortSignal.timeout(6000)
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({ message: 'Status fetch failed' }));
				throw new Error(errorData.message || 'Status fetch failed');
			}

			const data = await response.json();
			console.log(`[Status] Received - drinkReady: ${data.robotState.drinkReady ? 1 : 0}, waitingRecipe: ${data.robotState.waitingRecipe ? 1 : 0}`);
			console.log('[Status] Full robot state:', data.robotState);

			cocktailStatus.update(state => {
				console.log('[Status] Updating store with new state');
				return {
					...state,
					robotState: data.robotState,
					isConnected: data.isConnected,
					progress: calculateProgress(data.robotState, state.activeCocktailId, state.customIngredients),
					error: null // Clear error on success
				};
			});

			// When drink is ready (91 = 1), trigger reset ONCE
			if (data.robotState.drinkReady && !resetTriggered) {
				console.log('[Status] Drink ready detected (91 = 1), triggering reset...');
				resetTriggered = true; // Prevent multiple calls
				try {
					await fetch('/api/reset-addresses', { method: 'POST' });
					console.log('[Status] Reset triggered successfully');
				} catch (resetError) {
					console.error('[Status] Failed to trigger reset:', resetError);
				}
			}

			// Stop polling when robot returns to ready state (92 = 1)
			// Only check this AFTER reset has been triggered
			if (resetTriggered && data.robotState.waitingRecipe) {
				console.log('[Status] Robot ready (92 = 1), stopping polling and closing popup');
				stopStatusPolling();
			}
		} catch (error) {
			console.error('[Status] Polling error:', error.message);
			cocktailStatus.update(state => ({
				...state,
				error: error,
				isConnected: false
			}));
		}
	}, 3000);
}

/**
 * Stop polling and reset active cocktail
 */
export function stopStatusPolling() {
	console.log('[Status] Stopping polling');
	if (pollingInterval) {
		clearInterval(pollingInterval);
		pollingInterval = null;
	}

	// Reset flag for next cocktail
	resetTriggered = false;

	// Clear active cocktail ID and custom ingredients to fully reset state
	cocktailStatus.update(state => ({
		...state,
		activeCocktailId: null,
		customIngredients: null
	}));
}

/**
 * Calculate progress based on the current cocktail's steps
 * @param {RobotState} state
 * @param {string | null} cocktailId
 * @param {string[] | null} customIngredients
 * @returns {number} Progress percentage (0-100)
 */
function calculateProgress(state, cocktailId, customIngredients) {
	// If drink is ready, always return 100%
	if (state.drinkReady) {
		return 100;
	}

	// If no active cocktail, return 0
	if (!cocktailId) {
		return 0;
	}

	// Get the cocktail to access its specific steps
	const cocktail = getCocktailById(cocktailId, customIngredients);

	if (!cocktail || !cocktail.steps || cocktail.steps.length === 0) {
		return 0;
	}

	// Count completed steps from the cocktail's specific steps
	const completedSteps = cocktail.steps.filter(step => {
		// @ts-ignore - stateKey is a valid RobotState key from cocktail definition
		return state[step.stateKey] === true;
	}).length;

	const totalSteps = cocktail.steps.length;

	// Calculate percentage based on actual cocktail steps
	return Math.round((completedSteps / totalSteps) * 100);
}
