import { execSync } from 'child_process';

try {
  console.log('🧪 Resetting test DB...');
  execSync('dotenv -e .env.test -- npx prisma migrate reset --force --skip-generate --schema=prisma/schema.prisma', {
    stdio: 'inherit',
  });
  console.log('✅ Test DB reset.');
} catch (err) {
  console.error('❌ Test DB reset failed:', err);
  process.exit(1);
}
