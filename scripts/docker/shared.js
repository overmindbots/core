const execSync = require('child_process').execSync;

const MONOREPO_ROOT = process.cwd();
const BUILD_DIR = `${MONOREPO_ROOT}/.dockerBuild`;
const WEBPACK_DIR = require.resolve('.bin/webpack');

/**
 * Runs a bash command
 *
 * @param {String} command
 * @param {Object} opts
 */
function bash(command, opts) {
  return execSync(command, { shell: '/bin/bash', ...opts });
}

/**
 * Gets yarn workspace info
 *
 * @returns {Object} object describing the workspace
 */
function getWorkspaceInfo() {
  let res = bash('yarn workspaces info', { cwd: MONOREPO_ROOT }).toString();

  // Remove first and last lines from the command's output
  res = res.split('\n');
  res = res.slice(0, res.length - 1);
  res = res.join('\n');
  res = JSON.parse(res);

  return res;
}

/**
 * @returns {String} the directory of a copied package inside the docker temp
 * build folder
 */
const getPackageDockerCopyDir = (workspace, packageName) =>
  `${BUILD_DIR}/${workspace[packageName].location}`;

module.exports = {
  BUILD_DIR,
  MONOREPO_ROOT,
  WEBPACK_DIR,
  bash,
  getWorkspaceInfo,
  getPackageDockerCopyDir,
};
