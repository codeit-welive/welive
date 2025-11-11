jest.mock('#core/logger', () => {
  const pino = require('pino');
  const fs = require('fs');
  const path = require('path');

  const logPath = path.resolve(process.cwd(), 'test-logs/http.log');

  fs.mkdirSync(path.dirname(logPath), { recursive: true });

  const stream = pino.destination({
    dest: logPath,
    sync: false,
  });

  const logger = pino(
    {
      level: 'info',
      base: null,
    },
    stream
  );

  return {
    logger: {
      http: logger,
      system: logger,
    },
  };
});
