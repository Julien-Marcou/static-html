import * as fs from 'fs';
import * as path from 'path';

export class Initializer {

  private rootDirectory: string;

  constructor(rootDirectory: string) {
    this.rootDirectory = rootDirectory;
  }

  private copyDirectory(sourceDirectory: string, targetDirectory: string): void {
    fs.readdirSync(sourceDirectory).forEach((file) => {
      const sourceFile = `${sourceDirectory}/${file}`;
      const targetFile = `${targetDirectory}/${file}`;
      if (fs.statSync(sourceFile).isDirectory()) {
        if (!fs.existsSync(targetFile)) {
          fs.mkdirSync(targetFile);
        }
        this.copyDirectory(sourceFile, targetFile);
      }
      else if (!fs.existsSync(targetFile)) {
        fs.copyFileSync(sourceFile, targetFile);
      }
    });
  }

  init(): void {
    const defaultProjectDirectory = path.resolve(`${__dirname}/../default-project`);
    this.copyDirectory(defaultProjectDirectory, this.rootDirectory);
    process.stdout.write('Project initialized\n');
  }
}
