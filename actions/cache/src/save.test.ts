import { createHash } from 'crypto';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { run } from './saveImpl';

describe('hashFiles', () => {
  let files;
  const hash = (data) => createHash('sha256').update(data).digest('hex');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const hashHash = (data) => hash(hash(data));

  const lockfileData = 'Lockfile content';

  beforeEach(() => {
    const randomString = () =>
      Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    files = mkdtempSync(join(tmpdir(), randomString()));
    mkdirSync(`${files}/testDir2`, { recursive: true });
    writeFileSync(`${files}/testDir2/lockfiles`, lockfileData);
  });

  afterEach(() => {
    rmSync(files, { recursive: true });
  });

  it('Test', () => {
    process.argv[2] = JSON.stringify([{ uses: 'experiment', with: {} }, {}]);
    run();
  });
});
