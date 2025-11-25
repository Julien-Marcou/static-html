import { rmSync } from 'fs';

export class Cleaner {

  private directoryToClean: string;

  constructor(directoryToClean: string) {
    this.directoryToClean = directoryToClean;
  }

  clean(): void {
    rmSync(this.directoryToClean, {recursive: true, force: true});
    process.stdout.write('Dist folder cleaned\n');
  }
}
