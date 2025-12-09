import { json } from '@sveltejs/kit';
import { isConnected, resetReconnectAttempts } from '$lib/services/modbusClient.js';

/** @type {import('./$types').RequestHandler} */
export async function GET() {
	// Always return 200 OK for health check
	// The app is healthy even if Modbus is not connected

	const modbusConnected = isConnected();

	// Reset reconnect attempts so other endpoints can try again
	if (!modbusConnected) {
		resetReconnectAttempts();
	}

	return json({
		status: 'healthy',
		app: 'running',
		modbus: {
			connected: modbusConnected,
			message: modbusConnected ? 'Connected' : 'Disconnected (app still operational)'
		},
		timestamp: new Date().toISOString()
	});
}
