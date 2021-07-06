import * as chokidar from 'chokidar';
import { Builder } from './builder';

export class Watcher {

  private sourceDirectory: string;
  private targetDirectory: string;

  constructor(sourceDirectory: string, targetDirectory: string) {
    this.sourceDirectory = sourceDirectory;
    this.targetDirectory = targetDirectory;
  }

  private async rebuild(): Promise<void> {
    const builder = new Builder(this.sourceDirectory, this.targetDirectory);
    await builder.build();
  }

  watch(): void {
    const buildWatcher = chokidar.watch(this.sourceDirectory, {
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 100,
      },
    });
    process.stdout.write('Waiting for new file changes...');
    buildWatcher.on('all', async (_, file) => {
      process.stdout.clearLine(-1);
      process.stdout.cursorTo(0);
      process.stdout.write(`"${file}" has changed\n`);
      await this.rebuild();
      process.stdout.write('Waiting for new file changes...');
    });
  }
}

