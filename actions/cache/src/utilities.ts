import { createHash } from 'crypto';
import { globSync } from 'glob';
import fs from 'fs';

export const hashFiles = (glob: string, cwd: string = process.cwd()) => {
  const hash = (data) => createHash('sha256').update(data).digest('hex');
  const filesHash = glob
    .split('\n')
    .map((a) => a.trim())
    .flatMap((glb) => globSync(`${glb}`, { cwd, mark: true, nodir: true, dot: true }))
    .sort((a, b) => a.localeCompare(b))
    .map((path) => fs.readFileSync(`${cwd}/${path}`, 'utf-8'))
    .map((file) => hash(file))
    .reduce((acc, curr) => acc + curr, '');
  return filesHash.length === 0 ? '' : hash(filesHash);
};
