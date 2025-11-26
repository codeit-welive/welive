import { execSync } from 'child_process';

try {
  console.log('🔄 Prisma DB Reset...');
  execSync('npx prisma migrate reset --force --skip-generate --schema=prisma/schema.prisma', {
    stdio: 'inherit',
  });
  console.log('✅ Reset completed.');
} catch (err) {
  console.error('❌ Reset failed:', err);
  process.exit(1);
}
