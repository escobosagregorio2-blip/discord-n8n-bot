const { execSync } = require('child_process');
const path = require('path');

const projectDir = path.dirname(__filename);

try {
  console.log('Navegando a:', projectDir);
  process.chdir(projectDir);

  console.log('Ejecutando: git add bot.js');
  execSync('git add bot.js', { stdio: 'inherit' });

  console.log('Ejecutando: git commit');
  execSync('git commit -m "feat: bot.js v3.0 con escalacion + memoria + estado persistente"', { stdio: 'inherit' });

  console.log('Ejecutando: git push origin main');
  execSync('git push origin main', { stdio: 'inherit' });

  console.log('✅ Push completado exitosamente');
  process.exit(0);
} catch (error) {
  console.error('❌ Error durante el push:', error.message);
  process.exit(1);
}
