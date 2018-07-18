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
  console.log("\t./script '<publish-command>'\n");
  console.log(
    '** Remember to add surrounding quotes to the <publish-command>.'
  );
};

const execute = command =>
  new Promise((resolve, reject) => {
    exec(command, function(error, stdout, stderr) {
      if (error) {
        return reject(error);
      }

      resolve(stdout);
    });
  });


// TODO: Add documentation
const getUpdatedPackages = out => {
  if (!out) return [];

  const packages = out.split('\n').reduce((arr, line) => {
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
  const publishCommand = process.argv[2];

  const out = await execute(publishCommand);
  const updatedPackages = getUpdatedPackages(out);

  const buildTemplatePath = path.resolve('./scripts/buildTemplates.js');
  const buildCommand = package => `node ${buildTemplatePath} ${package}`;

  await Promise.all(
    updatedPackages.map(package =>
      execute(buildCommand(package))
        .then(() => package)
        .catch(err => {
          console.log('[ERROR]');
          console.log('Command failed:', `'${buildCommand(package)}'`);
          console.log('err:', err);
          throw err;
        })
    )
  )
    .then(packages => {
      console.log('[SUCCESS]\n');
      console.log('Updated packages:');
      packages.forEach(package => {
        console.log('  -', package);
      });
      console.log('\nProgram finished without errors.');
    })
    .catch(err => {
      console.log('\nProgram finished with errors.');
      process.exit(1);
    });
}

main();
