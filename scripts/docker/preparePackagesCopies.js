/*
 * This script prepares copies of all packages into a temporary directory.
 * It modifies their package.json so that dependencies between
 * our own packages point to their path instead of a version
 * 
 * This avoids issues with symlinks
 */

const path = require('path');
const fs = require('fs');

const {
  MONOREPO_ROOT,
  BUILD_DIR,
  bash,
  getWorkspaceInfo,
  getPackageDockerCopyDir,
} = require('./shared');

// Get workspace info from yarn
const workspace = getWorkspaceInfo();

bash(`rm -rf ${BUILD_DIR}`);

// Copy directories to the build directory
Object.keys(workspace).forEach(packageName => {
  bash(`mkdir -p ${BUILD_DIR}/${workspace[packageName].location}`);
  bash(
    `cp -R ${MONOREPO_ROOT}/${workspace[packageName].location}\
    ${BUILD_DIR}/${path.dirname(workspace[packageName].location)}/`
  );
});

// Replace dependencies of local packages to absolute paths
Object.keys(workspace).forEach(packageName => {
  const packageJsonPath = `${BUILD_DIR}/${
    workspace[packageName].location
  }/package.json`;
  const packageJson = require(packageJsonPath);

  if (packageJson.dependencies) {
    workspace[packageName].workspaceDependencies.forEach(dependencyName => {
      if (packageJson.dependencies[dependencyName]) {
        Object.assign(packageJson.dependencies, {
          [dependencyName]: getPackageDockerCopyDir(workspace, dependencyName),
        });
      }
    });
    
    fs.writeFileSync(
      packageJsonPath,
      JSON.stringify(packageJson, null, 2),
      'utf-8'
    );
  }
});
