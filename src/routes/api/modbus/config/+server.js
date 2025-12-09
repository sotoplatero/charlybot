import { json } from '@sveltejs/kit';
import { getConfig, updateConfig } from '$lib/server/modbusConfig.js';
import { forceReconnect } from '$lib/services/modbusClient.js';

/**
 * Get current Modbus configuration
 * @type {import('./$types').RequestHandler}
 */
export async function GET() {
	try {
		const config = getConfig();
		return json({
			success: true,
			config
		});
	} catch (error) {
		console.error('[Modbus Config API] Failed to get config:', error);
		return json(
			{
				success: false,
				message: 'Failed to get configuration',
				error: error.message
			},
			{ status: 500 }
		);
	}
}

/**
 * Update Modbus configuration and force reconnection
 * @type {import('./$types').RequestHandler}
 */
export async function POST({ request }) {
	try {
		const { host, port, unitId, timeout } = await request.json();

		console.log('[Modbus Config API] Received update request:', { host, port, unitId, timeout });

		// Validate parameters
		if (!host || !port) {
			return json({ success: false, message: 'Host and port are required' }, { status: 400 });
		}

		// Update configuration
		const newConfig = updateConfig({
			host,
			port: Number(port),
			unitId: Number(unitId),
			timeout: Number(timeout)
		});

		// Force reconnection with new configuration
		forceReconnect();

		console.log('[Modbus Config API] Configuration updated and reconnection forced');

		return json({
			success: true,
			message: 'Configuration updated successfully. Next connection will use new settings.',
			config: newConfig
		});
	} catch (error) {
		console.error('[Modbus Config API] Failed to update config:', error);
		return json(
			{
				success: false,
				message: 'Failed to update configuration',
				error: error.message
			},
			{ status: 500 }
		);
	}
}
