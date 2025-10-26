/**
 * Prueba de confiabilidad de claves comparables
 * Casos extremos: códigos muy similares
 */

import { parseClassificationCode } from '../utils/classificationParser/parser';

console.log('='.repeat(80));
console.log('PRUEBA DE CONFIABILIDAD - CÓDIGOS SIMILARES');
console.log('='.repeat(80));

// Caso 1: Decimales Dewey muy similares
console.log('\n📊 Caso 1: Decimales Dewey muy similares');
const similar1 = [
  '005.1',
  '005.10',
  '005.100',
  '005.1000',
  '005.11',
  '005.13',
  '005.133',
  '005.1339'
];

similar1.forEach(code => {
  const parsed = parseClassificationCode(code);
  console.log(`${code.padEnd(12)} → ${parsed.comparableKey}`);
});

// Caso 2: Cutter muy similares
console.log('\n📊 Caso 2: Números Cutter muy similares (decimal implícito)');
const similar2 = [
  '511.33 A3',
  '511.33 A30',
  '511.33 A300',
  '511.33 A3000',
  '511.33 A34',
  '511.33 A345',
  '511.33 A3451'
];

similar2.forEach(code => {
  const parsed = parseClassificationCode(code);
  const parts = code.split(' ');
  const cutter = parts[1] || '';
  console.log(`Cutter: ${cutter.padEnd(8)} → Clave: ${parsed.comparableKey}`);
  console.log(`  Decimal Cutter: ${parsed.cutterDecimal} (representa 0.${parsed.cutterDecimal})`);
});

// Caso 3: Letras Cutter consecutivas
console.log('\n📊 Caso 3: Letras principales Cutter consecutivas');
const similar3 = [
  '863 A100',
  '863 B100',
  '863 C100',
  '863 D100'
];

similar3.forEach(code => {
  const parsed = parseClassificationCode(code);
  console.log(`${code.padEnd(12)} → ${parsed.comparableKey}`);
});

// Caso 4: Sufijos similares
console.log('\n📊 Caso 4: Sufijos Cutter similares');
const similar4 = [
  '863 C419D1',
  '863 C419D2',
  '863 C419D10',
  '863 C419D25',
  '863 C419E1'
];

similar4.forEach(code => {
  const parsed = parseClassificationCode(code);
  console.log(`${code.padEnd(15)} → ${parsed.comparableKey}`);
  console.log(`  Sufijo: ${parsed.cutterSuffixLetter}${parsed.cutterSuffixNumber}`);
});

// Caso 5: Orden lexicográfico - ¿Se mantiene el orden correcto?
console.log('\n📊 Caso 5: Verificación de orden lexicográfico');
const orderTest = [
  '005.1 A3',
  '005.1 A30',
  '005.1 A345',
  '005.1 A345B1',
  '005.1 A345B2',
  '005.1 A345C1',
  '005.13 A100',
  '005.2 A100'
];

console.log('\nCódigos originales en orden esperado:');
const parsed = orderTest.map(code => {
  const p = parseClassificationCode(code);
  return { code, key: p.comparableKey };
});

parsed.forEach(({ code, key }) => {
  console.log(`${code.padEnd(18)} → ${key}`);
});

console.log('\n¿Se mantiene el orden al ordenar las claves?');
const sorted = [...parsed].sort((a, b) => a.key.localeCompare(b.key));
let orderCorrect = true;
sorted.forEach(({ code, key }, index) => {
  const match = code === orderTest[index] ? '✅' : '❌';
  if (code !== orderTest[index]) orderCorrect = false;
  console.log(`${index + 1}. ${code.padEnd(18)} → ${key} ${match}`);
});

console.log(`\n${orderCorrect ? '✅ ORDEN CORRECTO' : '❌ ORDEN INCORRECTO'}: Las claves mantienen el orden lexicográfico`);

// Caso 6: Casos extremos - diferencia mínima
console.log('\n📊 Caso 6: Diferencias mínimas');
const minimalDiff = [
  ['005.133 M152p2', '005.133 M152p3'],
  ['005.133 M152p2', '005.133 M153p2'],
  ['581.4 E74A3', '581.4 E74B3'],
  ['581.4 E74A3', '581.4 E75A3']
];

minimalDiff.forEach(([code1, code2]) => {
  const p1 = parseClassificationCode(code1);
  const p2 = parseClassificationCode(code2);
  console.log(`\nComparación:`);
  console.log(`  ${code1.padEnd(20)} → ${p1.comparableKey}`);
  console.log(`  ${code2.padEnd(20)} → ${p2.comparableKey}`);
  console.log(`  Diferencia detectable: ${p1.comparableKey !== p2.comparableKey ? '✅ SÍ' : '❌ NO'}`);

  if (p1.comparableKey < p2.comparableKey) {
    console.log(`  Orden: ${code1} < ${code2} ✅`);
  } else if (p1.comparableKey > p2.comparableKey) {
    console.log(`  Orden: ${code1} > ${code2} ✅`);
  } else {
    console.log(`  Orden: IGUALES ⚠️`);
  }
});

console.log('\n' + '='.repeat(80));
console.log('FIN DE PRUEBA DE CONFIABILIDAD');
console.log('='.repeat(80));
