import { execSync } from 'child_process';

try {
  console.log('🚀 Running migrations...');
  execSync('npx prisma migrate dev --schema=prisma/schema.prisma', {
    stdio: 'inherit',
  });

  console.log('🌱 Running seed...');
  execSync('ts-node -r tsconfig-paths/register scripts/prisma/seed.ts', {
    stdio: 'inherit',
  });

  console.log('✅ Migration + seed completed.');
} catch (err) {
  console.error('❌ Migration failed:', err);
  process.exit(1);
}
