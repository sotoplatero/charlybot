import { json } from '@sveltejs/kit';
import { getModbusClient } from '$lib/services/modbusClient.js';

/** @type {import('./$types').RequestHandler} */
export async function GET() {
	const results = {
		connection: false,
		tests: []
	};

	try {
		const client = await getModbusClient();
		results.connection = true;

		// Test 1: Read Holding Registers (Function Code 3) - Address 32
		try {
			await client.readHoldingRegisters(32, 1);
			results.tests.push({ name: 'readHoldingRegisters', code: 3, status: 'supported', address: 32 });
		} catch (err) {
			results.tests.push({
				name: 'readHoldingRegisters',
				code: 3,
				status: 'failed',
				error: err.message,
				modbusCode: err.modbusCode,
				address: 32
			});
		}

		// Test 2: Write Single Register (Function Code 6) - Address 100
		try {
			// Write 0 to be safe (assuming 0 is "off" or "idle")
			await client.writeRegister(100, 0);
			results.tests.push({ name: 'writeRegister', code: 6, status: 'supported', address: 100 });
		} catch (err) {
			results.tests.push({
				name: 'writeRegister',
				code: 6,
				status: 'failed',
				error: err.message,
				modbusCode: err.modbusCode,
				address: 100
			});
		}

		return json(results);

	} catch (err) {
		results.connection = false;
		results.error = err.message;
		return json(results, { status: 500 });
	}
}
