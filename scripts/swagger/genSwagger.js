const path = require('path');
const fs = require('fs');
const swaggerAutogen = require('swagger-autogen');

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
        description: '로그인 시 발급되는 JWT 액세스 토큰',
      },
    },
  },
  security: [{ AccessTokenCookie: [] }],
};

// prettier-ignore
const domainsAuth = ['auth'];

// prettier-ignore
const domainsRest = [
  'users',
  'apartments',
  'residents',
  'complaints',
  'polls',
  'notices',
  'comments',
  'notifications',
  'events',
  'poll-scheduler',
  'chats',
];

const modules = [
  // 1. Auth (최상단 고정)
  ...domainsAuth.map((d) => ({
    file: path.join(root, 'src/modules', d, `${d}.router.ts`),
    prefix: `/${d}`,
  })),

  // 2. 나머지 도메인 순서대로
  ...domainsRest.map((d) => ({
    file: path.join(root, 'src/modules', d, `${d}.router.ts`),
    prefix: `/${d}`,
  })),

  // 3. options 라우터는 polls 밖에 있으므로 별도 추가
  {
    file: path.join(root, 'src/modules/polls/options', 'options.router.ts'),
    prefix: '/options',
  },

  // 4. health 라우터(App)
  {
    file: path.join(root, 'src/core/health', 'health.router.ts'),
    prefix: '/',
  },
];

const genForModule = async (modFile) => {
  const tmp = path.join(outDir, `.tmp_${path.basename(modFile, '.ts')}.json`);
  await swaggerAutogen(tmp, [modFile], baseDoc);
  const json = JSON.parse(fs.readFileSync(tmp, 'utf-8'));
  fs.rmSync(tmp, { force: true });
  return json.paths || {};
};

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const generateSwagger = async () => {
  fs.mkdirSync(outDir, { recursive: true });

  const finalSpec = { ...baseDoc, paths: {}, tags: [] };

  for (const m of modules) {
    const paths = await genForModule(m.file);

    const lastSeg = m.prefix.split('/').filter(Boolean).pop();
    const tagName = capitalize(lastSeg || path.basename(m.file, '.router.ts'));

    finalSpec.tags.push({
      name: tagName,
      description: `${tagName} 관련 API`,
    });

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
