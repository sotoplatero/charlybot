/**
 * Modbus Diagnostic Script
 * Tests different register types and addresses to identify what the device supports
 */

import ModbusRTU from 'modbus-serial';

const client = new ModbusRTU();
const HOST = 'localhost';
const PORT = 502;
const UNIT_ID = 1;

// Addresses to test (including the ones used for cocktails and steps)
// Steps: 32-40 (muddling, syrup, lime, ice, whiteRum, cognac, soda, coke, whiskey)
// System: 90 (cupHolder), 91 (drinkReady), 92 (waitingRecipe)
// Cocktail triggers: 100-106
const TEST_ADDRESSES = [0, 1, 32, 33, 34, 35, 36, 37, 38, 39, 40, 90, 91, 92, 100, 101, 102, 103, 104, 106];

async function testFunction(name, fnCode, testFn, addresses) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Testing ${name} (FC ${fnCode})`);
    console.log('='.repeat(60));

    for (const addr of addresses) {
        try {
            const result = await testFn(addr);
            console.log(`  ✓ Address ${addr.toString().padStart(3, ' ')}: Success - Value: ${JSON.stringify(result.data)}`);
        } catch (e) {
            const modbusCodeMsg = e.modbusCode
                ? ` (Modbus Error ${e.modbusCode}: ${getModbusErrorName(e.modbusCode)})`
                : '';
            console.log(`  ✗ Address ${addr.toString().padStart(3, ' ')}: ${e.message}${modbusCodeMsg}`);
        }
    }
}

function getModbusErrorName(code) {
    const errors = {
        1: 'Illegal Function',
        2: 'Illegal Data Address',
        3: 'Illegal Data Value',
        4: 'Server Device Failure'
    };
    return errors[code] || 'Unknown Error';
}

async function test() {
    try {
        console.log('🔍 Modbus Device Diagnostic Tool\n');
        console.log(`Connecting to ${HOST}:${PORT} (Unit ID: ${UNIT_ID})...`);

        await client.connectTCP(HOST, { port: PORT });
        client.setID(UNIT_ID);
        client.setTimeout(5000);

        console.log('✅ Connected successfully!\n');

        console.log('ℹ️  RobotStudio Configuration: All variables are COILS\n');

        // Test Read Coils (the only function we use with RobotStudio)
        await testFunction(
            'Read Coils',
            1,
            (addr) => client.readCoils(addr, 1),
            TEST_ADDRESSES
        );

        // Test Write Functions (only on cocktail addresses to avoid affecting other systems)
        const WRITE_ADDRESSES = [100, 101, 102, 103, 104, 106, 107];

        await testFunction(
            'Write Single Coil',
            5,
            async (addr) => {
                await client.writeCoil(addr, true);
                // Immediately turn it off to avoid triggering actual cocktails
                await client.writeCoil(addr, false);
                return { data: [true] };
            },
            WRITE_ADDRESSES
        );

        console.log('\n' + '='.repeat(60));
        console.log('✅ Diagnostic Complete!');
        console.log('='.repeat(60));

    } catch (e) {
        console.error('\n❌ Connection error:', e.message);
        process.exit(1);
    } finally {
        client.close(() => {
            console.log('\n🔌 Connection closed');
        });
    }
}

test();
