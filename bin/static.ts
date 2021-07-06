#!/usr/bin/env -S npx ts-node-script
import * as fs from 'fs';

const usage = 'Usage : npx static <init|build|watch|serve|deploy|clean>\n';

/**
 * Uses dynamic import as it allow to run the "init", "build", "deploy" & "clean" commands without installing the dev dependencies
 */

async function init(rootDirectory: string): Promise<void> {
  const { Initializer } = await import('../lib/initializer');
  new Initializer(rootDirectory).init();
}

async function build(sourceDirectory: string, targetDirectory: string): Promise<void> {
  const { Builder } = await import('../lib/builder');
  await new Builder(sourceDirectory, targetDirectory).build();
}

async function watch(sourceDirectory: string, targetDirectory: string): Promise<void> {
  const { Watcher } = await import('../lib/watcher');
  new Watcher(sourceDirectory, targetDirectory).watch();
}

async function serve(directoryToServe: string, port: number): Promise<void> {
  const { Server } = await import('../lib/server');
  await new Server(directoryToServe, port).serve();
}

async function deploy(sourceDirectory: string, targetDirectory: string, disableInteraction: boolean): Promise<void> {
  const { Deployment } = await import('../lib/deployment');
  await new Deployment(sourceDirectory, targetDirectory).deploy(disableInteraction);
}

async function clean(directoryToClean: string): Promise<void> {
  const { Cleaner } = await import('../lib/cleaner');
  new Cleaner(directoryToClean).clean();
}

type Options = Record<string, string>;

function getOptions(args: Array<string>): Options {
  return args.reduce<Options>((options, arg, index, args) => {
    if (arg.startsWith('--')) {
      const nextArg = args[index + 1];
      if (nextArg && !nextArg.startsWith('--')) {
        options[arg] = nextArg;
      }
      else {
        options[arg] = 'true';
      }
    }
    return options;
  }, {});
}

async function runTask(): Promise<void> {
  const task = process.argv[2];
  if (!task) {
    process.stderr.write('You did not specify any command.\n');
    process.stderr.write(usage);
    return;
  }

  const rootDirectory = process.cwd();
  const sourceDirectory = `${rootDirectory}/src`;
  if (task !== 'init' && !fs.existsSync(`${sourceDirectory}/website.json`)) {
    process.stderr.write(`The "src/website.json" file was not found.\nPlease be sure to run this command inside the root directory of your project.\n`);
    return;
  }

  const targetDirectory = `${rootDirectory}/dist`;
  const args = process.argv.slice(3);
  const options = getOptions(args);

  switch (task) {
    case 'init':
      await init(rootDirectory);
      break;

    case 'build':
      await build(sourceDirectory, targetDirectory);
      break;

    case 'watch':
      await build(sourceDirectory, targetDirectory);
      await watch(sourceDirectory, targetDirectory);
      break;

    case 'serve':
      const port = '--port' in options ? parseInt(options['--port']) : 4200;
      await build(sourceDirectory, targetDirectory);
      await serve(targetDirectory, port);
      await watch(sourceDirectory, targetDirectory);
      break;

    case 'deploy':
      const disableInteraction = options['--no-interaction'] === 'true' ? true : false;
      const deployDirectory = args[0];
      if (!deployDirectory || deployDirectory.startsWith('--')) {
        process.stderr.write('You did not specify any target directory for the deployment.\nUsage : npx static deploy <target-directory>\n');
        break;
      }
      await deploy(targetDirectory, deployDirectory, disableInteraction);
      break;

    case 'clean':
      await clean(targetDirectory);
      break;

    default:
      process.stderr.write(`The command "${task}" is invalid.\n`);
      process.stderr.write(usage);
      break;
  }
}

runTask();
