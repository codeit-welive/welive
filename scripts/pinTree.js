const fs = require('fs');
const path = require('path');

// 무시할 폴더 목록
const IGNORE = new Set([
  'frontend',
  'node_modules',
  '.git',
  'dist',
  'coverage',
  '.next',
  '.vscode',
  '.idea',
  '.turbo',
  'build',
  'out',
]);

// 시작 경로: 인자 있으면 그걸 사용
const rootDir = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();

/**
 * 디렉터리 트리 출력 함수
 */
const walk = (dir, prefix = '') => {
  const entries = fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => {
    // 디렉터리 먼저, 이후 파일
    if (a.isDirectory() && !b.isDirectory()) return -1;
    if (!a.isDirectory() && b.isDirectory()) return 1;
    return a.name.localeCompare(b.name);
  });

  entries.forEach((entry, index) => {
    if (IGNORE.has(entry.name)) return;

    const isLast = index === entries.length - 1;
    const branch = isLast ? '└── ' : '├── ';
    const nextPrefix = prefix + (isLast ? '    ' : '│   ');
    const fullPath = path.join(dir, entry.name);

    console.log(prefix + branch + entry.name);

    if (entry.isDirectory()) {
      walk(fullPath, nextPrefix);
    }
  });
};

console.log(path.basename(rootDir) + '/');
walk(rootDir);
