import { accessSync, constants, copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync } from 'fs';
import { resolve } from 'path';
import { createInterface } from 'readline';

export class Deployment {

  private sourceDirectory: string;
  private targetDirectory: string;

  constructor(sourceDirectory: string, targetDirectory: string) {
    this.sourceDirectory = sourceDirectory;
    this.targetDirectory = resolve(targetDirectory);
  }

  private deployDirectory(sourceDirectory: string, targetDirectory: string): Array<{action: string, path: string}> {
    const changesMade: Array<{action: string, path: string}> = [];
    // Add new files and overwrite existing ones if they have changed
    readdirSync(sourceDirectory).forEach((file) => {
      const sourceFile = `${sourceDirectory}/${file}`;
      const targetFile = `${targetDirectory}/${file}`;
      if (statSync(sourceFile).isDirectory()) {
        if (!existsSync(targetFile)) {
          mkdirSync(targetFile);
          changesMade.push({
            action: 'Directory created',
            path: targetFile,
          });
        }
        changesMade.push(...this.deployDirectory(sourceFile, targetFile));
      }
      else {
        if (!existsSync(targetFile)) {
          copyFileSync(sourceFile, targetFile);
          changesMade.push({
            action: 'File created',
            path: targetFile,
          });
        }
        else {
          const sourceBuffer = readFileSync(sourceFile);
          const targetBuffer = readFileSync(targetFile);
          if (!sourceBuffer.equals(targetBuffer)) {
            copyFileSync(sourceFile, targetFile);
            changesMade.push({
              action: 'File overwritten',
              path: targetFile,
            });
          }
        }
      }
    });
    // Delete expired files
    readdirSync(targetDirectory).forEach((file) => {
      const sourceFile = `${sourceDirectory}/${file}`;
      const targetFile = `${targetDirectory}/${file}`;
      if (!existsSync(sourceFile)) {
        if (statSync(targetFile).isDirectory()) {
          rmSync(targetFile, {recursive: true});
          changesMade.push({
            action: 'Directory deleted',
            path: targetFile,
          });
        }
        else {
          rmSync(targetFile);
          changesMade.push({
            action: 'File deleted',
            path: targetFile,
          });
        }
      }
    });
    return changesMade;
  }

  async promptToContinue(): Promise<boolean> {
    process.stdout.write('You are about to deploy\n');
    process.stdout.write(`From "${this.sourceDirectory}"\n`);
    process.stdout.write(`To   "${this.targetDirectory}"\n`);
    const prompt = createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    prompt.on('SIGINT', () => {
      process.stdout.write('\n');
      prompt.close();
    });
    return await new Promise<boolean>((resolve) => {
      prompt.question('Continue deployment? (y/n) : ', async (answer) => {
        const validYesAnswers = ['yes', 'y', 'Y'];
        const validNoAnswers = ['no', 'n', 'N'];
        while (!(validYesAnswers.includes(answer) || validNoAnswers.includes(answer))) {
          answer = await new Promise<string>((_resolve) => {
            prompt.question('Please answer yes (y) or no (n) : ', (_answer) => {
              _resolve(_answer);
            });
          });
        }
        prompt.close();
        resolve(validYesAnswers.includes(answer));
      });
    });
  }

  async deploy(disableInteraction: boolean = false): Promise<void> {
    if (!existsSync(this.targetDirectory)) {
      process.stderr.write(`The target directory "${this.targetDirectory}" for the deployement does not exist.\n`);
      return;
    }
    if (!statSync(this.targetDirectory).isDirectory()) {
      process.stderr.write(`The target directory "${this.targetDirectory}" for the deployement is not a directory.\n`);
      return;
    }
    try {
      accessSync(this.targetDirectory, constants.R_OK);
    }
    catch (error) {
      process.stderr.write(`The target directory "${this.targetDirectory}" for the deployement is not readable.\n`);
      return;
    }
    try {
      accessSync(this.targetDirectory, constants.W_OK);
    }
    catch (error) {
      process.stderr.write(`The target directory "${this.targetDirectory}" for the deployement is not writable.\n`);
      return;
    }

    if (!disableInteraction && !await this.promptToContinue()) {
      process.stdout.write('Deployement canceled\n');
      return;
    }

    process.stdout.write('Deploying...');
    if (!process.stdout.isTTY) {
      process.stdout.write('\n');
    }
    const changesMade = this.deployDirectory(this.sourceDirectory, this.targetDirectory);
    if (process.stdout.isTTY) {
      process.stdout.clearLine(-1);
      process.stdout.cursorTo(0);
    }
    if (changesMade.length === 0) {
      process.stdout.write('No file change\n');
    }
    else {
      process.stdout.write(`${changesMade.map(({action, path}) => {
        return `${action.padEnd(17)} : ${path.replace(this.targetDirectory, '')}`;
      }).join('\n')}\n`);
    }
    process.stdout.write('Deployment successful\n');
  }
}
