/**
 * Development Modbus Simulator for Testing
 * Simulates robot behavior when RobotStudio is not available or not configured
 *
 * Usage: node scripts/dev-simulator.js
 * Then set MODBUS_HOST=localhost and MODBUS_PORT=5502 in .env
 */

import ModbusRTU from 'modbus-serial';

// Simulated memory (coils/discrete inputs)
const coils = new Array(200).fill(false);
const discreteInputs = new Array(200).fill(false);
const holdingRegisters = new Array(200).fill(0);
const inputRegisters = new Array(200).fill(0);

// Initialize system state
discreteInputs[92] = true; // waitingRecipe = 1 (robot ready)
coils[92] = true;

// Track active cocktail simulation
let activeSimulation = null;

/**
 * Simulate cocktail preparation when start signal is received
 */
function simulateCocktailPreparation() {
	if (activeSimulation) {
		console.log('[Simulator] ⚠️  Already preparing a drink');
		return;
	}

	console.log('[Simulator] 🍹 Starting cocktail preparation simulation');

	// Set robot to busy
	discreteInputs[92] = false;
	coils[92] = false;

	// Collect active ingredients from write addresses (132-143)
	const steps = [];
	const stepMap = {
		132: 32,  // mint write → mint read
		133: 33,  // muddling write → muddling read
		134: 34,  // ice write → ice read
		135: 35,  // syrup write → syrup read
		136: 36,  // lime write → lime read
		137: 37,  // whiteRum write → whiteRum read
		138: 38,  // cognac write → cognac read
		139: 39,  // whiskey write → whiskey read
		140: 40,  // soda write → soda read
		141: 41,  // coke write → coke read
	};

	// Find which ingredients were requested
	for (const [writeAddr, readAddr] of Object.entries(stepMap)) {
		if (coils[writeAddr] === true) {
			steps.push({ writeAddr: Number(writeAddr), readAddr });
		}
	}

	if (steps.length === 0) {
		console.log('[Simulator] ⚠️  No ingredients selected');
		return;
	}

	console.log(`[Simulator] 📝 Preparing with ${steps.length} ingredients/steps`);

	// Simulate each step sequentially
	let stepIndex = 0;

	activeSimulation = setInterval(() => {
		if (stepIndex < steps.length) {
			const step = steps[stepIndex];
			discreteInputs[step.readAddr] = true;
			coils[step.readAddr] = true;
			console.log(`[Simulator] ✓ Step ${stepIndex + 1}/${steps.length} complete (address ${step.readAddr} = 1)`);
			stepIndex++;
		} else {
			// All steps done
			discreteInputs[91] = true; // drinkReady = 1
			coils[91] = true;
			console.log('[Simulator] 🎉 Drink ready! (address 91 = 1)');
			console.log('[Simulator] ⏳ Waiting for reset signal...');

			clearInterval(activeSimulation);
			activeSimulation = null;
		}
	}, 2000); // 2 seconds per step
}

/**
 * Handle writes to detect start signal and reset
 */
function handleWrite(address, value) {
	const oldValue = coils[address];
	coils[address] = value;

	// Start signal (96)
	if (address === 96 && value === true && oldValue === false) {
		console.log('[Simulator] 🚀 Start signal received (address 96 = 1)');
		simulateCocktailPreparation();
	}

	// Reset signal (addresses 96-107 and 132-143 all set to 0)
	if (value === false && (
		(address >= 96 && address <= 107) ||
		(address >= 132 && address <= 143)
	)) {
		// Check if this is part of a full reset
		const allIngredientsReset = [132, 133, 134, 135, 136, 137, 138, 139, 140, 141].every(addr => coils[addr] === false);
		const allCocktailsReset = [100, 101, 102, 103, 104, 105, 106, 107].every(addr => coils[addr] === false);
		const startReset = coils[96] === false;

		if (allIngredientsReset && allCocktailsReset && startReset) {
			console.log('[Simulator] 🔄 Reset detected - clearing all states');

			// Clear all step states (32-41)
			for (let i = 32; i <= 41; i++) {
				discreteInputs[i] = false;
				coils[i] = false;
			}

			// Clear system states
			discreteInputs[90] = false;
			coils[90] = false;
			discreteInputs[91] = false;
			coils[91] = false;

			// Set robot back to ready
			discreteInputs[92] = true;
			coils[92] = true;

			console.log('[Simulator] ✅ Robot ready for next order (address 92 = 1)');
		}
	}
}

// Create Modbus server
const serverTCP = new ModbusRTU.ServerTCP({}, {
	host: '0.0.0.0',
	port: 5502,
	debug: false,
	unitID: 1
});

// Configure server vectors
serverTCP.setCoils(coils);
serverTCP.setDiscreteInputs(discreteInputs);
serverTCP.setHoldingRegisters(holdingRegisters);
serverTCP.setInputRegisters(inputRegisters);

// Hook into writes
const originalWriteFC5 = serverTCP._server.writeFC5;
serverTCP._server.writeFC5 = function(address, value) {
	handleWrite(address, value);
	return originalWriteFC5.call(this, address, value);
};

// Start server
console.log('🤖 Modbus Development Simulator');
console.log('================================');
console.log('Listening on 0.0.0.0:5502');
console.log('');
console.log('Configuration:');
console.log('  MODBUS_HOST=127.0.0.1');
console.log('  MODBUS_PORT=5502');
console.log('');
console.log('Initial State:');
console.log('  Address 92 (waitingRecipe) = 1 (robot ready)');
console.log('');
console.log('Press Ctrl+C to stop');
console.log('================================\n');

// Handle graceful shutdown
process.on('SIGINT', () => {
	console.log('\n\n🛑 Shutting down simulator...');
	if (activeSimulation) {
		clearInterval(activeSimulation);
	}
	process.exit(0);
});
