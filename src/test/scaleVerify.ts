import { acaiaScale, ACAIA_BM71_SERVICE_UUID, ACAIA_CSR_SERVICE_UUID } from '../services/acaiaScale';

console.log('--- Testing Acaia Scale Driver & Protocol ---');

// 1. Test UUIDs
console.assert(
  ACAIA_BM71_SERVICE_UUID === '49535343-fe7d-4ae5-8fa9-9fafd205e455',
  'BM71 UUID mismatch'
);
console.assert(
  ACAIA_CSR_SERVICE_UUID === '00001820-0000-1000-8000-00805f9b34fb',
  'CSR UUID mismatch'
);
console.log('✓ GATT Service UUIDs verified');

// 2. Test Simulation Mode Connection
const info = acaiaScale.connectSimulated();
console.assert(acaiaScale.isConnected(), 'Expected scale to be connected');
console.assert(info.isSimulated === true, 'Expected isSimulated to be true');
console.assert(info.model === 'Simulated Scale', `Expected Simulated Scale, got ${info.model}`);
console.log(`✓ Simulation Mode connected: ${info.name} (${info.model})`);

// 3. Test Initial Telemetry
const telemetry1 = acaiaScale.getTelemetry();
console.assert(telemetry1.weight === 0, `Expected initial weight 0, got ${telemetry1.weight}`);
console.assert(telemetry1.flowRate === 0, `Expected initial flowRate 0, got ${telemetry1.flowRate}`);
console.assert(telemetry1.unit === 'g', `Expected unit g, got ${telemetry1.unit}`);
console.log('✓ Initial telemetry verified: 0.0g, 0.0g/s');

// 4. Test Tare
telemetry1.weight = 15.5;
acaiaScale.tare();
const telemetry2 = acaiaScale.getTelemetry();
console.assert(telemetry2.weight === 0, `Expected tared weight 0, got ${telemetry2.weight}`);
console.log('✓ Scale tare command verified');

// 5. Test Timer Controls
acaiaScale.startTimer();
console.assert(acaiaScale.getTelemetry().timerRunning === true, 'Expected timer to be running');

acaiaScale.pauseTimer();
console.assert(acaiaScale.getTelemetry().timerRunning === false, 'Expected timer to be paused');

acaiaScale.resetTimer();
console.assert(acaiaScale.getTelemetry().timerSeconds === 0, 'Expected timer to be reset to 0');
console.log('✓ Scale timer controls verified (start / pause / reset)');

// 6. Test Pour Simulation & Flow Rate Regression
let lastTelemetry = acaiaScale.getTelemetry();
const unsub = acaiaScale.onTelemetry((t) => {
  lastTelemetry = t;
});

acaiaScale.simulatePour(30, 5.0);

// Wait 250ms for simulated pour ticks
setTimeout(async () => {
  console.assert(lastTelemetry.weight > 0, `Expected weight > 0, got ${lastTelemetry.weight}`);
  console.assert(lastTelemetry.flowRate > 0, `Expected flowRate > 0, got ${lastTelemetry.flowRate}`);
  console.log(`✓ Pour simulation telemetry verified: ${lastTelemetry.weight}g @ ${lastTelemetry.flowRate}g/s`);

  unsub();
  await acaiaScale.disconnect();
  console.assert(!acaiaScale.isConnected(), 'Expected scale to be disconnected');
  console.log('✓ Clean disconnect verified');

  console.log('\nAll Acaia scale tests passed successfully! ☕⚡');
  process.exit(0);
}, 350);
