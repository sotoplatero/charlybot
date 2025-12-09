import { json } from '@sveltejs/kit';
import ModbusRTU from 'modbus-serial';
import { closeConnection } from '$lib/services/modbusClient.js';

/**
 * Test Modbus connection with provided configuration
 * This temporarily closes the current connection to test new parameters
 * @type {import('./$types').RequestHandler}
 */
export async function POST({ request }) {
	let testClient = null;

	try {
		const { host, port, unitId, timeout } = await request.json();

		console.log('[Modbus Test] Received test request:', { host, port, unitId, timeout });

		// Validate parameters
		if (!host || !port) {
			console.error('[Modbus Test] Missing required parameters');
			return json({ success: false, message: 'Host and port are required' }, { status: 400 });
		}

		console.log(`[Modbus Test] Testing connection to ${host}:${port} (Unit ID: ${unitId})`);

		// Close existing connection temporarily
		console.log('[Modbus Test] Closing existing connection for test...');
		closeConnection();

		try {
			// Create a temporary client for testing
			testClient = new ModbusRTU();
			testClient.setTimeout(timeout || 5000);

			console.log(`[Modbus Test] Attempting connection to ${host}:${port}...`);
			await testClient.connectTCP(host, { port: Number(port) });
			testClient.setID(Number(unitId));

			console.log('[Modbus Test] Connection established, testing read operation...');

			// Try to read a register to verify connection is working
			// Reading address 92 (waitingRecipe) as a simple test
			try {
				await testClient.readCoils(92, 1);
				console.log('[Modbus Test] Read operation successful');
			} catch (readError) {
				console.warn('[Modbus Test] Read operation failed, but connection is OK:', readError.message);
				// Connection is OK even if read fails (might be address issue)
			}

			// Close the test connection
			testClient.close(() => {
				console.log('[Modbus Test] Test connection closed');
			});

			console.log('[Modbus Test] Connection test successful');

			return json({
				success: true,
				message: 'Connection successful - Robot is reachable',
				config: { host, port, unitId }
			});
		} catch (error) {
			// Close test connection if it was opened
			if (testClient && testClient.isOpen) {
				testClient.close(() => {});
			}

			// Provide user-friendly error messages
			let errorMessage = 'Connection failed';

			if (error.code === 'ECONNREFUSED') {
				errorMessage = `Cannot connect to ${host}:${port}. Please check if the robot is online and the address is correct.`;
			} else if (error.code === 'ETIMEDOUT') {
				errorMessage = `Connection timeout. The robot at ${host}:${port} is not responding.`;
			} else if (error.code === 'ENETUNREACH') {
				errorMessage = `Network unreachable. Cannot reach ${host}.`;
			} else if (error.code === 'EHOSTUNREACH') {
				errorMessage = `Host unreachable. ${host} is not reachable on the network.`;
			} else if (error.message) {
				errorMessage = error.message;
			}

			console.error('[Modbus Test] Connection test failed:', errorMessage);

			return json(
				{
					success: false,
					message: errorMessage,
					error: error.code || 'UNKNOWN'
				},
				{ status: 503 }
			);
		}
	} catch (error) {
		console.error('[Modbus Test] Request error:', error);
		return json(
			{
				success: false,
				message: 'Invalid request',
				error: error.message
			},
			{ status: 400 }
		);
	}
}
