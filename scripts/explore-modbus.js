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

        // Test Read Holding Registers (FC 3) on Address 100
        try {
            console.log('\n--- Testing FC 3 (readHoldingRegisters) on address 100 ---');
            const res = await client.readHoldingRegisters(100, 1);
            console.log('✓ FC 3 Address 100 Supported');
            console.log('Result:', res.data);
        } catch (e) {
            console.log(`✗ FC 3 Address 100 Failed: ${e.message}`);
            if (e.modbusCode) console.log(`  Modbus Code: ${e.modbusCode}`);
        }

        // Scan addresses 0-110
        console.log('\n--- Scanning Addresses 0-110 (FC 3) ---');
        for (let addr = 0; addr <= 110; addr += 10) {
            try {
                await client.readHoldingRegisters(addr, 1);
                console.log(`✓ Address ${addr}: OK`);
            } catch (e) {
                // console.log(`✗ Address ${addr}: ${e.message}`);
            }
        }

    } catch (e) {
        console.error('Connection error:', e);
    } finally {
        client.close(() => { });
    }
}

test();
