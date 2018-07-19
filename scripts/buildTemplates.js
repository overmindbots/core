const fs = require('fs');
const path = require('path');
const config = require('../config.json');

const companyPrefix = config.companyPrefix;
const packagesDirPath = path.resolve(process.cwd(), './packages');
const packageBuildScriptsDir = path.resolve(
  process.cwd(),
  './scripts/templateBuilders'
);
const packageName = process.argv[2];
const packages = new Set();

if (!packageName) {
  throw new Error("an app's name has to be passed as an argument");
}

/**
 * Gets all package names that we have in our packages folder
 * and adds it to the `packages` set
 */
function getPackageNames() {
  const packageFolders = fs.readdirSync(packagesDirPath);
  packageFolders.forEach(fileName => {
    const dirPath = path.resolve(packagesDirPath, fileName);
    const stat = fs.statSync(dirPath);
    const isDir = stat.isDirectory();

    if (!isDir) {
      return;
    }

    const packageJsonPath = path.resolve(dirPath, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      return;
    }

    const jsonPackageName = require(packageJsonPath).name;
    if (!jsonPackageName.startsWith(companyPrefix)) {
      return;
    }
    const cleanedPackageName = jsonPackageName.split(`${companyPrefix}/`)[1];

    packages.add(cleanedPackageName);
  });
}
/**
 * Throws if the package name passed to this script doesn't match any of our
 * packages
 */
function validatePackageNameArg() {
  const packageExists = packages.has(packageName);
  if (!packageExists) {
    throw new Error(
      `Package with name ${packageName} doesn't exist in ${packagesDirPath}`
    );
  }
}
/**
 * Runs the config builder script (if it exists) for the package name passed
 */
function buildPackageKubeTemplate() {
  const buildScriptPath = path.resolve(
    packageBuildScriptsDir,
    `${packageName}.js`
  );
  const packageBuildScriptExists = fs.existsSync(buildScriptPath);
  if (!packageBuildScriptExists) {
    throw new Error(
      `Package of name ${packageName} has no build script. \n` +
        `Create one at ${packageBuildScriptsDir}\n`
    );
  }
  console.log(
    `\n===> Running template build script for ${companyPrefix}/${packageName}`
  );
  require(buildScriptPath);
}

/* == Begin build == */
getPackageNames();
validatePackageNameArg();
buildPackageKubeTemplate();
