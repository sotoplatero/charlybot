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

        // 1. Dump all registers 0-99
        console.log('\n--- Register Dump (Non-Zero) ---');
        for (let i = 0; i < 100; i += 10) {
            try {
                const res = await client.readHoldingRegisters(i, 10);
                res.data.forEach((val, idx) => {
                    const addr = i + idx;
                    if (val !== 0) {
                        console.log(`Address ${addr}: ${val}`);
                    }
                });
            } catch (e) {
                console.log(`Error reading ${i}-${i + 9}: ${e.message}`);
            }
        }

        // 2. Check specific status registers
        console.log('\n--- Status Check ---');
        try {
            const system = await client.readHoldingRegisters(90, 3);
            console.log(`90 (Cup Holder): ${system.data[0]}`);
            console.log(`91 (Drink Ready): ${system.data[1]}`);
            console.log(`92 (Waiting Recipe): ${system.data[2]}`);
        } catch (e) { console.log('Error reading status:', e.message); }

        // 3. Try to force Ready (Write 1 to 92)
        console.log('\n--- Attempting to Force Ready (Write 1 to 92) ---');
        try {
            await client.writeRegister(92, 1);
            console.log('✓ Wrote 1 to 92');
            const check = await client.readHoldingRegisters(92, 1);
            console.log(`New 92 value: ${check.data[0]}`);
        } catch (e) { console.log('Error writing to 92:', e.message); }

        // 4. Test Write to Address 0 (Potential Trigger)
        console.log('\n--- Attempting to Write 1 to Address 0 ---');
        try {
            await client.writeRegister(0, 1);
            console.log('✓ Wrote 1 to 0');
            const check = await client.readHoldingRegisters(0, 1);
            console.log(`New 0 value: ${check.data[0]}`);
            // Reset to 0
            await client.writeRegister(0, 0);
            console.log('✓ Reset 0 to 0');
        } catch (e) { console.log('Error writing to 0:', e.message); }

    } catch (e) {
        console.error('Connection error:', e);
    } finally {
        client.close(() => { });
    }
}

test();
