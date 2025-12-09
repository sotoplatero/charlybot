import ModbusRTU from 'modbus-serial';

const client = new ModbusRTU();
const HOST = 'localhost';
const PORT = 502;
const UNIT_ID = 1;

async function test() {
    try {
        console.log(`Connecting to ${HOST}:${PORT}...`);
        await client.connectTCP(HOST, { port: PORT });
        client.setID(UNIT_ID);
        console.log('Connected.');

        // Test Write Register (FC 6) - Address 100
        try {
            console.log('\n--- Testing FC 6 (writeRegister) on address 100 ---');
            // Writing 0 should be safe(r) than 1
            const res = await client.writeRegister(100, 0);
            console.log('✓ FC 6 Supported');
            console.log('Result:', res);
        } catch (e) {
            console.log(`✗ FC 6 Failed: ${e.message}`);
            if (e.modbusCode) console.log(`  Modbus Code: ${e.modbusCode}`);
        }

    } catch (e) {
        console.error('Connection error:', e);
    } finally {
        client.close(() => { });
    }
}

test();
