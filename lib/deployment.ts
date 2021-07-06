import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

export class Deployment {

  private sourceDirectory: string;
  private targetDirectory: string;

  constructor(sourceDirectory: string, targetDirectory: string) {
    this.sourceDirectory = sourceDirectory;
    this.targetDirectory = path.resolve(targetDirectory);
  }

  private deployDirectory(sourceDirectory: string, targetDirectory: string): Array<{action: string, path: string}> {
    const changesMade: Array<{action: string, path: string}> = [];
    // Add new files and overwrite existing ones if they have changed
    fs.readdirSync(sourceDirectory).forEach((file) => {
      const sourceFile = `${sourceDirectory}/${file}`;
      const targetFile = `${targetDirectory}/${file}`;
      if (fs.statSync(sourceFile).isDirectory()) {
        if (!fs.existsSync(targetFile)) {
          fs.mkdirSync(targetFile);
          changesMade.push({
            action: 'Directory created',
            path: targetFile,
          });
        }
        changesMade.push(...this.deployDirectory(sourceFile, targetFile));
      }
      else {
        if (!fs.existsSync(targetFile)) {
          fs.copyFileSync(sourceFile, targetFile);
          changesMade.push({
            action: 'File created',
            path: targetFile,
          });
        }
        else {
          const sourceBuffer = fs.readFileSync(sourceFile);
          const targetBuffer = fs.readFileSync(targetFile);
          if (!sourceBuffer.equals(targetBuffer)) {
            fs.copyFileSync(sourceFile, targetFile);
            changesMade.push({
              action: 'File overwritten',
              path: targetFile,
            });
          }
        }
      }
    });
    // Delete expired files
    fs.readdirSync(targetDirectory).forEach((file) => {
      const sourceFile = `${sourceDirectory}/${file}`;
      const targetFile = `${targetDirectory}/${file}`;
      if (!fs.existsSync(sourceFile)) {
        if (fs.statSync(targetFile).isDirectory()) {
          fs.rmSync(targetFile, {recursive: true});
          changesMade.push({
            action: 'Directory deleted',
            path: targetFile,
          });
        }
        else {
          fs.rmSync(targetFile);
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
    const prompt = readline.createInterface({
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
    if (!fs.existsSync(this.targetDirectory)) {
      process.stderr.write(`The target directory "${this.targetDirectory}" for the deployement does not exist.\n`);
      return;
    }
    if (!fs.statSync(this.targetDirectory).isDirectory()) {
      process.stderr.write(`The target directory "${this.targetDirectory}" for the deployement is not a directory.\n`);
      return;
    }
    try {
      fs.accessSync(this.targetDirectory, fs.constants.R_OK);
    }
    catch (error) {
      process.stderr.write(`The target directory "${this.targetDirectory}" for the deployement is not readable.\n`);
      return;
    }
    try {
      fs.accessSync(this.targetDirectory, fs.constants.W_OK);
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
    const changesMade = this.deployDirectory(this.sourceDirectory, this.targetDirectory);
    process.stdout.clearLine(-1);
    process.stdout.cursorTo(0);
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
