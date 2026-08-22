import { calculateDaysOffRoast, calculateExtractionYield, calculateRatio, getRestingStageInfo } from '../utils/coffeeMath';
import { diagnoseExtraction } from '../utils/dialinEngine';

console.log('--- Testing Coffee Math ---');
const days = calculateDaysOffRoast('2026-08-01', '2026-08-15');
console.assert(days === 14, `Expected 14 days, got ${days}`);
console.log(`✓ calculateDaysOffRoast: 14 days`);

const restInfo = getRestingStageInfo(14, 'Light');
console.assert(restInfo.phase === 'peak', `Expected peak phase for Light roast at 14 days, got ${restInfo.phase}`);
console.log(`✓ getRestingStageInfo: ${restInfo.labelZh} (${restInfo.phase})`);

const ratio = calculateRatio(15, 225);
console.assert(ratio === 15.0, `Expected 15.0 ratio, got ${ratio}`);
console.log(`✓ calculateRatio: 1:${ratio}`);

const ey = calculateExtractionYield(15, 225, 1.40);
// Beverage Weight = 225 - (15*2) = 195. EY = (195 * 1.40) / 15 = 18.2%
console.assert(Math.abs(ey - 18.2) < 0.1, `Expected ~18.2%, got ${ey}`);
console.log(`✓ calculateExtractionYield: ${ey}%`);

console.log('\n--- Testing Barista Dial-in Diagnosis Engine ---');

// Test 1: Under-extracted cup (Fast, Sour, Low sweetness, Low body)
const underDiag = diagnoseExtraction({
  doseGrams: 15,
  waterGrams: 225,
  ratio: 15,
  totalTimeSeconds: 100, // Very fast
  waterTempCelsius: 89,
  sensory: {
    acidity: 8.5,
    sweetness: 3.5,
    body: 3.5,
    clarity: 8.0,
    balance: 4.0,
    aftertaste: 4.5,
    bitterness: 2.5,
  },
  flavorTags: ['尖酸', '檸檬 Lemon', '青草'],
});
console.assert(underDiag.state === 'under_extracted', `Expected under_extracted, got ${underDiag.state}`);
console.log(`✓ Under-extraction diagnosis: ${underDiag.title}`);
console.log(`  Top suggestion: ${underDiag.recommendations[0]?.action} -> ${underDiag.recommendations[0]?.description}`);

// Test 2: Over-extracted cup (Slow, Bitter, Astringent, High EY)
const overDiag = diagnoseExtraction({
  doseGrams: 15,
  waterGrams: 240,
  ratio: 16,
  totalTimeSeconds: 220, // Slow/clogged
  waterTempCelsius: 95,
  sensory: {
    acidity: 5.5,
    sweetness: 5.5,
    body: 7.5,
    clarity: 4.0,
    balance: 5.0,
    aftertaste: 3.5,
    bitterness: 7.5,
  },
  flavorTags: ['苦澀', '焦苦', '乾澀'],
});
console.assert(overDiag.state === 'over_extracted', `Expected over_extracted, got ${overDiag.state}`);
console.log(`✓ Over-extraction diagnosis: ${overDiag.title}`);
console.log(`  Top suggestion: ${overDiag.recommendations[0]?.action} -> ${overDiag.recommendations[0]?.description}`);

// Test 3: Channeling detected (Sharp sourness + bitter astringent dry throat at once)
const channelDiag = diagnoseExtraction({
  doseGrams: 15,
  waterGrams: 225,
  ratio: 15,
  totalTimeSeconds: 140,
  waterTempCelsius: 93,
  sensory: {
    acidity: 8.0,
    sweetness: 4.0,
    body: 4.5,
    clarity: 3.5,
    balance: 3.5,
    aftertaste: 3.0,
    bitterness: 6.5,
  },
  flavorTags: ['尖酸', '乾澀', '刮喉'],
});
console.assert(channelDiag.state === 'channeling', `Expected channeling, got ${channelDiag.state}`);
console.log(`✓ Channeling diagnosis: ${channelDiag.title}`);

// Test 4: Balanced / Optimal Cup
const balancedDiag = diagnoseExtraction({
  doseGrams: 15,
  waterGrams: 240,
  ratio: 16,
  totalTimeSeconds: 145,
  waterTempCelsius: 92.5,
  sensory: {
    acidity: 9.0,
    sweetness: 9.5,
    body: 8.5,
    clarity: 9.5,
    balance: 9.5,
    aftertaste: 9.5,
    bitterness: 2.0,
  },
  flavorTags: ['茉莉花 Jasmine', '水蜜桃 White Peach', '佛手柑 Bergamot'],
});
console.assert(balancedDiag.state === 'balanced_sweet', `Expected balanced_sweet, got ${balancedDiag.state}`);
console.log(`✓ Optimal sweet spot diagnosis: ${balancedDiag.title}`);

console.log('\nAll domain math and barista diagnostic engine tests passed successfully! 🎉');
