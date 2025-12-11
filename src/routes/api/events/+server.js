import { getModbusClient, isConnected } from '$lib/services/modbusClient.js';

/**
 * Server-Sent Events endpoint for real-time robot state updates
 * Broadcasts state changes to all connected clients
 *
 * @type {import('./$types').RequestHandler}
 */
export async function GET({ request }) {
	// Create a ReadableStream for SSE
	const stream = new ReadableStream({
		async start(controller) {
			console.log('[SSE] New client connected');

			// Helper to send SSE messages
			const sendEvent = (event, data) => {
				const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
				try {
					controller.enqueue(new TextEncoder().encode(message));
				} catch (error) {
					console.error('[SSE] Error sending event:', error);
				}
			};

			// Send initial connection success
			sendEvent('connected', { timestamp: new Date().toISOString() });

			let pollingInterval = null;
			let lastState = null;
			let isActive = true;

			// Function to read and broadcast robot state
			const pollRobotState = async () => {
				if (!isActive) return;

				try {
					if (!isConnected()) {
						console.log('[SSE] Not connected to robot');
						sendEvent('error', {
							message: 'Not connected to robot',
							timestamp: new Date().toISOString()
						});
						return;
					}

					const client = await getModbusClient();

					// Read step states (32-41: 10 consecutive addresses)
					let stepStates = await client.readCoils(32, 10);

					// Read system states (90-92: 3 consecutive addresses)
					let systemStates = await client.readCoils(90, 3);

					// Build current state object
					const currentState = {
						// Step states
						mint: stepStates.data[0] === true,        // Address 32
						muddling: stepStates.data[1] === true,    // Address 33
						ice: stepStates.data[2] === true,         // Address 34
						syrup: stepStates.data[3] === true,       // Address 35
						lime: stepStates.data[4] === true,        // Address 36
						whiteRum: stepStates.data[5] === true,    // Address 37
						cognac: stepStates.data[6] === true,      // Address 38
						whiskey: stepStates.data[7] === true,     // Address 39
						soda: stepStates.data[8] === true,        // Address 40
						coke: stepStates.data[9] === true,        // Address 41

						// System states
						cupHolder: systemStates.data[0] === true,    // Address 90
						drinkReady: systemStates.data[1] === true,   // Address 91
						waitingRecipe: systemStates.data[2] === true // Address 92
					};

					// Detect state changes
					if (lastState) {
						// Check if preparation just started (waitingRecipe: true → false)
						if (lastState.waitingRecipe === true && currentState.waitingRecipe === false) {
							console.log('[SSE] 🚀 Preparation started detected');

							// Read cocktail addresses to detect which one started
							const cocktailStates = await client.readCoils(100, 8);
							const activeCocktailAddress = cocktailStates.data.findIndex(value => value === true);

							let cocktailId = null;
							if (activeCocktailAddress !== -1) {
								const address = 100 + activeCocktailAddress;
								// Map address to cocktail ID (this matches initial-state logic)
								const cocktailMap = {
									100: 'mojito',
									101: 'cuba-libre',
									102: 'old-fashioned',
									103: 'whiskey-sour',
									104: 'whiskey-cola',
									105: 'sidecar',
									106: 'cognac-cola',
									107: 'custom'
								};
								cocktailId = cocktailMap[address];
							}

							sendEvent('preparation_started', {
								cocktailId,
								timestamp: new Date().toISOString()
							});
						}

						// Check if drink just became ready (drinkReady: false → true)
						if (lastState.drinkReady === false && currentState.drinkReady === true) {
							console.log('[SSE] ✅ Drink ready detected');
							sendEvent('drink_ready', {
								timestamp: new Date().toISOString()
							});
						}

						// Check if robot returned to ready state (waitingRecipe: false → true)
						// This happens AFTER reset-addresses is called
						if (lastState.waitingRecipe === false && currentState.waitingRecipe === true) {
							console.log('[SSE] 🏁 Robot returned to ready state');
							sendEvent('robot_ready', {
								timestamp: new Date().toISOString()
							});
						}
					}

					// Always send state update (for progress tracking during active preparation)
					sendEvent('state_update', {
						robotState: currentState,
						timestamp: new Date().toISOString()
					});

					// Update last state
					lastState = currentState;

				} catch (error) {
					console.error('[SSE] Polling error:', error.message);
					sendEvent('error', {
						message: error.message,
						timestamp: new Date().toISOString()
					});
				}
			};

			// Start polling every 2 seconds (faster than regular polling for better real-time feel)
			pollingInterval = setInterval(pollRobotState, 2000);

			// Send initial state immediately
			await pollRobotState();

			// Handle client disconnect
			request.signal.addEventListener('abort', () => {
				console.log('[SSE] Client disconnected');
				isActive = false;
				if (pollingInterval) {
					clearInterval(pollingInterval);
				}
				try {
					controller.close();
				} catch (error) {
					// Controller might already be closed
				}
			});
		}
	});

	// Return SSE response with proper headers
	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			'Connection': 'keep-alive',
			// CORS headers if needed for development
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET',
			'Access-Control-Allow-Headers': 'Content-Type'
		}
	});
}
