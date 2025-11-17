import path from 'path';
import fs from 'fs';
import swaggerAutogen from 'swagger-autogen';

const root = process.cwd();
const outDir = path.join(root, 'swagger');
const outputFile = path.join(outDir, 'swagger.json');

const baseDoc = {
  openapi: '3.0.0',
  info: {
    title: '위리브 API',
    description: '위리브 API 명세서',
    version: '1.0.0',
  },
  components: {
    securitySchemes: {
      AccessTokenCookie: {
        type: 'apiKey',
        in: 'cookie',
        name: 'access_token',
        description: '로그인 시 발급되는 JWT 액세스 토큰 (쿠키 기반 인증)',
      },
    },
  },
  security: [{ AccessTokenCookie: [] }],
};

// 도메인 목록
// prettier-ignore
const domains = [
  'auth',
  'users',
  'complaints',
  'notices',
  'comments',
  'notifications',
  'poll-scheduler',
];

const modules = [
  ...domains.map((d) => ({
    file: path.join(root, 'src/modules', d, `${d}.router.ts`),
    prefix: `/api/${d}`,
  })),
  {
    file: path.join(root, 'src/core/health', 'health.router.ts'),
    prefix: '/api',
  },
];

const genForModule = async (modFile: string) => {
  const tmp = path.join(outDir, `.tmp_${path.basename(modFile, '.ts')}.json`);
  await swaggerAutogen({ openapi: '3.0.0' })(tmp, [modFile], baseDoc);
  const json = JSON.parse(fs.readFileSync(tmp, 'utf-8'));
  fs.rmSync(tmp, { force: true });
  return json as { paths?: Record<string, any> };
};

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const generateSwagger = async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const finalSpec: any = { ...baseDoc, paths: {}, tags: [] };

  for (const m of modules) {
    const { paths = {} } = await genForModule(m.file);
    const tagName = capitalize(m.prefix.split('/').pop() || 'Default');
    finalSpec.tags.push({ name: tagName, description: `${tagName} 관련 API` });

    for (const [p, val] of Object.entries(paths)) {
      const prefixed = `${m.prefix}${p}`.replace(/\/+/g, '/');
      for (const method of Object.keys(val)) {
        if (!val[method].tags) val[method].tags = [tagName];
      }
      finalSpec.paths[prefixed] = val;
    }
  }

  fs.writeFileSync(outputFile, JSON.stringify(finalSpec, null, 2));
  console.log(`✅ Swagger 문서 생성 완료: ${outputFile}`);
};

generateSwagger();
