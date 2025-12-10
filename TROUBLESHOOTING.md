# Troubleshooting Guide

## Current Issue: RobotStudio Not Responding to Modbus Reads

### Problem Summary

The diagnostic test (`pnpm modbus:test`) revealed that **RobotStudio's Modbus server at 127.0.0.1:502 is not responding to read operations**:

```
✅ Connection successful to 127.0.0.1:502
✗ Read Coils (FC 1) - All addresses TIMEOUT
✗ Read Discrete Inputs (FC 2) - All addresses TIMEOUT
✗ Read Holding Registers (FC 3) - All addresses TIMEOUT
✗ Read Input Registers (FC 4) - All addresses TIMEOUT
```

### Why This Breaks the Application

1. `/api/status` endpoint tries to read:
   - Addresses 32-41 (step states: mint, muddling, ice, etc.)
   - Addresses 90-92 (system states: cupHolder, drinkReady, waitingRecipe)

2. All reads timeout after 5000ms

3. On timeout, code defaults all values to `false`

4. **Result:**
   - Popup never shows progress (all steps stay at `false`)
   - Popup never closes (address 92 never reads as `1`)
   - Console filled with timeout errors

### Root Cause

RobotStudio's Modbus TCP server is either:
- Not properly configured to respond to read requests
- Not running with the correct RAPID program that handles Modbus
- Missing required Modbus configuration in the virtual controller
- Running in a mode that only accepts writes but doesn't provide reads

## Solutions

### Option 1: Use Development Simulator (Recommended for Testing)

Use the included simulator to test application logic while RobotStudio is being configured:

**Step 1:** Start the simulator in one terminal:
```bash
pnpm modbus:simulator
```

**Step 2:** Configure the app to use simulator:
```bash
# Copy simulator config to .env
cp .env.simulator .env
```

**Step 3:** Start the application in another terminal:
```bash
pnpm dev
```

The simulator will:
- ✅ Respond to all read operations
- ✅ Simulate step-by-step cocktail preparation
- ✅ Show proper state transitions (92=1 → 92=0 → steps → 91=1 → 92=1)
- ✅ Allow full testing of the application flow

**To switch back to RobotStudio:**
```bash
# Copy RobotStudio config to .env
cp .env.robotstudio .env
```

### Option 2: Configure RobotStudio Modbus Server

RobotStudio needs specific configuration to respond to Modbus reads:

#### A. Check Virtual Controller Configuration

1. Open RobotStudio
2. Go to **Controller** → **Configuration**
3. Navigate to **Communication** → **Transmission Protocol**
4. Verify Modbus TCP is enabled and configured:
   - Type: `TCP`
   - Port: `502`
   - Unit ID: `1`

#### B. Verify RAPID Program

The RAPID program must:
1. Map signals to Modbus addresses
2. Use **Digital Outputs** (DO) for addresses we read
3. Use **Digital Inputs** (DI) for addresses we write to

Example RAPID code structure:
```rapid
MODULE ModbusMapping
    ! System state outputs (we READ these)
    PERS signaldo doWaitingRecipe;  ! Address 92
    PERS signaldo doDrinkReady;     ! Address 91
    PERS signaldo doCupHolder;      ! Address 90

    ! Step state outputs (we READ these)
    PERS signaldo doMint;            ! Address 32
    PERS signaldo doMuddling;        ! Address 33
    ! ... etc for addresses 34-41

    ! Command inputs (we WRITE to these)
    PERS signaldi diStartSignal;     ! Address 96
    PERS signaldi diMojito;          ! Address 100
    ! ... etc for addresses 101-107, 132-143

    PROC Main()
        ! Initialize state
        SetDO doWaitingRecipe, 1;  ! Robot ready

        ! Main loop
        WHILE TRUE DO
            ! Check for start signal
            IF DInput(diStartSignal) = 1 THEN
                ! Start cocktail preparation
                SetDO doWaitingRecipe, 0;  ! Robot busy

                ! Execute steps based on which ingredients are active
                ! Set corresponding step outputs as steps complete

                SetDO doDrinkReady, 1;  ! Drink complete
            ENDIF

            WaitTime 0.1;  ! 100ms cycle time
        ENDWHILE
    ENDPROC
ENDMODULE
```

#### C. Map Signals to Modbus Addresses

In RobotStudio Controller Configuration:
1. Go to **I/O System** → **Signal**
2. For each Digital Output (DO):
   - Create signal name (e.g., `doWaitingRecipe`)
   - Set Type: `Digital Output`
   - Set Device: `Modbus TCP`
   - Set Address: (e.g., `92`)

3. For each Digital Input (DI):
   - Create signal name (e.g., `diStartSignal`)
   - Set Type: `Digital Input`
   - Set Device: `Modbus TCP`
   - Set Address: (e.g., `96`)

#### D. Start Virtual Controller

1. Set virtual controller to **Auto** mode
2. Start the RAPID program
3. Verify Modbus TCP is listening on port 502
4. Test with: `pnpm modbus:test`

### Option 3: Adjust Application to Write-Only Mode (Not Recommended)

If RobotStudio can only accept writes (not provide reads), the application would need significant refactoring:
- Remove all status polling
- Use time-based estimates instead of real status
- No real-time progress updates
- Manual popup closing

**This defeats the purpose of real-time monitoring and is NOT recommended.**

## Testing Your Configuration

### Test Modbus Connectivity
```bash
pnpm modbus:test
```

Expected output when working correctly:
```
✓ Address  32: Success - Value: [false]
✓ Address  92: Success - Value: [true]
✓ Address 100: Success - Value: [false]
```

### Test Application Flow

1. **With Simulator:**
   ```bash
   # Terminal 1
   pnpm modbus:simulator

   # Terminal 2
   cp .env.simulator .env
   pnpm dev
   ```

2. **With RobotStudio:**
   ```bash
   # Make sure RobotStudio is running with RAPID program
   cp .env.robotstudio .env
   pnpm modbus:test  # Should show successful reads
   pnpm dev
   ```

## Common Errors

### "Timed out" on All Reads
- **Cause:** Modbus server not responding to read requests
- **Solution:** Use simulator or configure RobotStudio per Option 2

### "Connection refused" or "ECONNREFUSED"
- **Cause:** No Modbus server listening on specified host:port
- **Solution:** Start RobotStudio or simulator first

### "Illegal Data Address" (Modbus Error 2)
- **Cause:** Requested address not configured in Modbus map
- **Solution:** Add signal mappings in RobotStudio configuration

### Popup Stays on First Step
- **Cause:** Step addresses (32-41) not being updated by robot
- **Solution:** Verify RAPID program sets step outputs as work progresses

### Popup Never Closes
- **Cause:** Address 92 (waitingRecipe) never returns to `1`
- **Solution:** Verify RAPID program sets `doWaitingRecipe = 1` after reset

## Address Reference

### Read Addresses (Robot → App)
These are **outputs from robot's perspective**, we READ them:
- 32-41: Step states (mint, muddling, ice, syrup, lime, whiteRum, cognac, whiskey, soda, coke)
- 90: Cup holder present
- 91: Drink ready
- 92: Waiting for recipe (1 = ready, 0 = busy)

### Write Addresses (App → Robot)
These are **inputs from robot's perspective**, we WRITE to them:
- 96: Start signal
- 100-107: Cocktail selection (mojito, cuba-libre, cubata, whiskey-rocks, neat-whiskey, whiskey-highball, whiskey-coke, custom)
- 132-143: Ingredients (mint, muddling, ice, syrup, lime, whiteRum, cognac, whiskey, soda, coke, stirring, straw)

## Getting Help

If you're still experiencing issues:
1. Run `pnpm modbus:test` and save the output
2. Check RobotStudio event log for Modbus errors
3. Verify virtual controller is in Auto mode with program running
4. Contact ABB RobotStudio support for Modbus TCP configuration assistance
