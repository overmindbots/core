#!/usr/bin/env node

/*
 * Usage:
 *    ./publishAndBuildTemplates.js 'lerna publish --cd-version prerelease'
 */

const exec = require('child_process').exec;
const path = require('path');

const printHelp = () => {
  console.log('Wrong number of arguments.\n');
  console.log('Usage:');
  console.log("\t./publishAndBuildTemplates.js '<publish-command>'\n");
  console.log(
    '** Remember to add surrounding quotes to the <publish-command>.'
  );
};

const execute = command =>
  new Promise((resolve, reject) => {
    console.log(command);

    const cmd = exec(command, function(error, stdout) {
      if (error) {
        return reject(error);
      }

      resolve(stdout);
    });

    cmd.stdout.pipe(process.stdout);
    cmd.stderr.pipe(process.stderr);
  });

// TODO: Add documentation
const getUpdatedPackages = publishOutput => {
  if (!publishOutput) return [];

  const packages = publishOutput.split('\n').reduce((arr, line) => {
    const match = line.match(/-\s@[^\/]+\/([^:]+)/);
    if (match && match[1]) {
      arr.push(match[1]);
    }
    return arr;
  }, []);

  return packages;
};

if (process.argv.length !== 3) {
  printHelp();
  process.exit(1);
}

// TODO: Add documentation
async function main() {
  console.log('== Building k8s templates ==');
  console.log('CIRCLE_BRANCH: ', process.env.CIRCLE_BRANCH);
  const publishCommand = process.argv[2];

  const output = await execute(publishCommand);
  const updatedPackages = getUpdatedPackages(output);

  const buildTemplatePath = path.resolve('./scripts/buildTemplates.js');
  const buildCommand = package => `node ${buildTemplatePath} ${package}`;

  for (const package of updatedPackages) {
    try {
      await execute(buildCommand(package));
    } catch (_) {
      console.log('Command failed:', `'${buildCommand(package)}'`);
      console.log('\nProgram finished with errors.');
      process.exit(1);
    }
  }

  console.log('[SUCCESS]\n');
  console.log('Updated packages:');
  updatedPackages.forEach(package => {
    console.log('  -', package);
  });
  console.log('\nProgram finished without errors.');
}

main();
