import fs from 'fs';
import { loadJsonFile } from '../utilities';
import { SecretsSnapshot } from '@pipeline/types';
import * as envfile from 'envfile';
import { debug } from '../utilities/log';

export class SecretsManager {
  private readonly secretFilenameExtension = '.json';

  private constructor(private readonly secretsDirectory: string) {
    debug("Initializing secrets manager")
  }

  public static create = (secretsDirectory: string) => new SecretsManager(secretsDirectory);

  public retrieve = (): SecretsSnapshot => {
    return {
      ...this.listSecretFiles()
        .filter(this.byExtension(this.secretFilenameExtension))
        .map(this.toKeyFilename)
        .reduce(this.toSecret, {}),
      ...Object.entries(process.env)
        .filter(([k]) => k.toLowerCase().startsWith("secret"))
        .map(([k, v]) => {
          return [k.replace("SECRET_", ""), v]
        })
        .reduce((acc, [k, v]) => {
          acc[k as string] = v
          return acc;
        }, {})
    };
  };

  private listSecretFiles = () => fs.readdirSync(this.secretsDirectory);
  private byExtension = (extension: string) => (filename) => filename.includes(extension);
  private toKeyFilename = (filename) => ({ key: this.getKey(filename), filename });
  private getKey = (filename: string): string => filename.replace(this.secretFilenameExtension, '');
  private toSecret = (accumulator, { key, filename }) => {
    const secretEnvs = envfile.parse(
      envfile
        .stringify(this.readSecretFile(filename))
        .replace(
          /(?<key>^.+)=(?<value>.*$)/gm,
          (_, p1, p2) => `${key.toUpperCase()}_${p1.toUpperCase()}=${p2}`
        )
    );
    Object.keys(secretEnvs).forEach((key) => (accumulator[key] = secretEnvs[key]));
    return accumulator;
  };
  private readSecretFile = (fileWithASecret) =>
    loadJsonFile(`${this.secretsDirectory}/${fileWithASecret}`);
}
