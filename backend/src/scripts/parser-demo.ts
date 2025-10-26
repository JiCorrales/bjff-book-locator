import { parseClassificationCode } from '../utils/classificationParser/parser';

function runDemo() {
  console.log('='.repeat(80));
  console.log('DEMO - Parser de Códigos de Clasificación');
  console.log('='.repeat(80));

  const samples = [
    ' CR863 L318p7 ', // LATAM
    '005.133 P98R',   // Dewey estándar
    '511.33 C823M',   // Dewey con decimales
    'CO863 G216CI',   // LATAM Colombia
    '005'             // Solo clase
  ];

  for (const input of samples) {
    const parsed = parseClassificationCode(input);
    console.log(`\nEntrada: ${JSON.stringify(input)}`);
    console.log(`Clave:   ${parsed.comparableKey}`);
    console.log(`Detalle: ${JSON.stringify(parsed)}`);
  }

  console.log('\n' + '='.repeat(80));
  console.log('FIN DEMO');
  console.log('='.repeat(80));
}

runDemo();
