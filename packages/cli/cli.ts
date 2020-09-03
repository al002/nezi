import * as path from 'path';
import * as os from 'os';
import * as chalk from 'chalk';
import * as commander from 'commander';
import * as inquirer from 'inquirer';
import * as fs from 'fs-extra';

import * as pkg from './package.json';
import { spawn } from 'child_process';

interface Options {
  name: string;
  verbose: boolean;
}

interface PromptOptions extends Options {
  root: string;
  appName: string;
}

interface CreateOptions extends PromptOptions {
  type: string;
  language: string;
}

let projectDir: any;

export function init(): void {
  const program = new commander.Command('nezu')
    .version(pkg.version)
    .arguments('<project-directory>')
    .usage(`${chalk.green('<project-directory>')}`)
    .action((dir) => {
      projectDir = dir;
    })
    .option('--verbose', 'print verbose logs')
    .on('--help', () => {
      console.log(`    ${chalk.green('<project-directory>')} is required.`);
    })
    .parse(process.argv);

  if (typeof projectDir === 'undefined') {
    console.error('Please specify the project directory');
    console.log();
    console.log('Example: ');
    console.log(`    ${chalk.cyan(program.name())} ${chalk.green('my-app')}`);

    process.exit(1);
  }

  createProject({
    name: projectDir,
    verbose: program.verbose,
  });
}

function createProject(options: Options): void {
  const { name, verbose } = options;

  const root = path.resolve(name);
  const appName = path.basename(root);
  if (fs.pathExistsSync(root)) {
    console.error(`${chalk.redBright('Directory is exist, please specify another directory')}`);
    process.exit(1);
  }

  fs.ensureDirSync(name);

  prompt({
    root,
    appName,
    name,
    verbose,
  });
}

async function prompt(options: PromptOptions) {
  const { type } = await inquirer.prompt([
    {
      name: 'type',
      type: 'list',
      message: `Please select the type of your project: `,
      choices: [
        {
          name: 'Library',
          value: 'lib',
        },
        {
          name: 'React SPA',
          value: 'reactSPA',
        },
      ],
    },
  ]);

  if (!type) {
    return;
  }

  const { language } = await inquirer.prompt([
    {
      name: 'language',
      type: 'list',
      message: `Which Language do you wanna use: `,
      choices: [
        {
          name: 'TypeScript',
          value: 'ts',
        },
        {
          name: 'JavaScript',
          value: 'js',
        },
      ],
    },
  ]);

  const createOptions = {
    ...options,
    type,
    language,
  };

  prepareCreate(createOptions);
}

function writeInitialPackageJson(root: string, appName: string) {
  const packageJson = {
    name: appName,
    version: '0.1.0',
    private: true,
  };
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify(packageJson, null, 2) + os.EOL);
}

function prepareCreate(options: CreateOptions) {
  writeInitialPackageJson(options.root, options.appName);
  const { type } = options;

  process.chdir(options.root);

  switch (type) {
    case 'lib':
      createLib(options);
      break;
    case 'reactSPA':
      createReactSPA(options);
      break;
    default:
      break;
  }
}

/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
function createLib(options: CreateOptions) {
  // TODO: create library project from template. Change dependencies
  install(options.root, ['file:../../lib-typescript-template']);
}

/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
function createReactSPA(options: CreateOptions) {
  // TODO: create react spa project from template
}

function install(root: string, dependencies: Array<string>) {
  return new Promise((resolve, reject) => {
    process.chdir(root);
    const command = 'yarn';
    const args = ['add', '--exact', '--cwd', root, ...dependencies];

    const child = spawn(command, args, { stdio: 'inherit' });
    child.on('close', (code) => {
      if (code !== 0) {
        reject({
          command: `${command} ${args.join(' ')}`,
        });
        return;
      }
      resolve();
    });
  });
}
