import { execSync } from 'child_process';

try {
  console.log('🧪 Running test migrations...');
  execSync('dotenv -e .env.test -- npx prisma migrate deploy --schema=prisma/schema.prisma', { stdio: 'inherit' });
  console.log('✅ Test DB migrated.');
} catch (err) {
  console.error('❌ Test DB migration failed:', err);
  process.exit(1);
}
