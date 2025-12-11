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

/** @type {EventSource | null} */
let eventSource = null;

/** @type {boolean} */
let sseConnected = false;

/**
 * Connect to Server-Sent Events for real-time updates
 * Falls back to polling if SSE is not available
 */
function connectSSE() {
	// Don't connect if already connected
	if (eventSource && sseConnected) {
		console.log('[SSE] Already connected');
		return;
	}

	// Clean up existing connection
	disconnectSSE();

	try {
		console.log('[SSE] Connecting to /api/events...');
		eventSource = new EventSource('/api/events');

		eventSource.addEventListener('connected', (event) => {
			console.log('[SSE] Connected successfully');
			sseConnected = true;
		});

		eventSource.addEventListener('preparation_started', (event) => {
			const data = JSON.parse(event.data);
			console.log('[SSE] Preparation started event received:', data);

			// If we receive a preparation_started event and we're not tracking it yet,
			// start tracking it automatically
			if (data.cocktailId) {
				cocktailStatus.update(state => {
					// Only update if we're not already tracking this cocktail
					if (!state.activeCocktailId || state.activeCocktailId !== data.cocktailId) {
						console.log(`[SSE] Auto-starting tracking for ${data.cocktailId}`);
						// Start polling for this cocktail
						// We do this in a setTimeout to avoid race conditions
						setTimeout(() => startStatusPolling(data.cocktailId), 0);
					}
					return state;
				});
			}
		});

		eventSource.addEventListener('state_update', (event) => {
			const data = JSON.parse(event.data);
			// Only update store if we have an active cocktail
			cocktailStatus.update(state => {
				if (state.activeCocktailId) {
					return {
						...state,
						robotState: data.robotState,
						isConnected: true,
						progress: calculateProgress(data.robotState, state.activeCocktailId, state.customIngredients),
						error: null
					};
				}
				return state;
			});
		});

		eventSource.addEventListener('drink_ready', async (event) => {
			console.log('[SSE] Drink ready event received');

			// Trigger reset if not already triggered
			if (!resetTriggered) {
				console.log('[SSE] Triggering reset from drink_ready event...');
				resetTriggered = true;
				try {
					await fetch('/api/reset-addresses', { method: 'POST' });
					console.log('[SSE] Reset triggered successfully');
				} catch (resetError) {
					console.error('[SSE] Failed to trigger reset:', resetError);
				}
			}
		});

		eventSource.addEventListener('robot_ready', (event) => {
			console.log('[SSE] Robot ready event received');

			// Only stop if reset was triggered (meaning preparation completed)
			if (resetTriggered) {
				console.log('[SSE] Stopping polling and closing modal');
				stopStatusPolling();
			}
		});

		eventSource.addEventListener('error', (event) => {
			console.error('[SSE] Connection error');
			sseConnected = false;

			// Don't try to reconnect immediately, let the browser handle reconnection
			// or fall back to polling
		});

		eventSource.onerror = (error) => {
			console.error('[SSE] EventSource error:', error);
			sseConnected = false;
		};

	} catch (error) {
		console.error('[SSE] Failed to create EventSource:', error);
		sseConnected = false;
		eventSource = null;
	}
}

/**
 * Disconnect from Server-Sent Events
 */
function disconnectSSE() {
	if (eventSource) {
		console.log('[SSE] Disconnecting');
		eventSource.close();
		eventSource = null;
		sseConnected = false;
	}
}

/**
 * Initialize SSE connection (call this on app load)
 */
export function initializeSSE() {
	// Only connect in browser environment
	if (typeof window !== 'undefined') {
		connectSSE();
	}
}

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

	// HYBRID APPROACH: SSE notifies us of state changes instantly,
	// but we maintain polling during active preparation for smooth progress updates
	// This ensures:
	// - SSE provides instant notifications when preparation starts/ends
	// - Polling provides smooth progress bar updates during preparation
	// - If SSE fails, polling acts as complete fallback (existing functionality)

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
			const err = /** @type {Error} */ (error);
			console.error('[Status] Polling error:', err.message);
			cocktailStatus.update(state => ({
				...state,
				error: err,
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
