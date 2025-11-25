import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { resolve } from 'path';

export class Initializer {

  private rootDirectory: string;

  constructor(rootDirectory: string) {
    this.rootDirectory = rootDirectory;
  }

  private copyDirectory(sourceDirectory: string, targetDirectory: string): void {
    readdirSync(sourceDirectory).forEach((file) => {
      const sourceFile = `${sourceDirectory}/${file}`;
      const targetFile = `${targetDirectory}/${file}`;
      if (statSync(sourceFile).isDirectory()) {
        if (!existsSync(targetFile)) {
          mkdirSync(targetFile);
        }
        this.copyDirectory(sourceFile, targetFile);
      }
      else if (!existsSync(targetFile)) {
        copyFileSync(sourceFile, targetFile);
      }
    });
  }

  init(): void {
    const defaultProjectDirectory = resolve(`${__dirname}/../default-project`);
    this.copyDirectory(defaultProjectDirectory, this.rootDirectory);
    process.stdout.write('Project initialized\n');
  }
}
