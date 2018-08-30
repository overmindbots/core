const {
  BUILD_DIR,
  MONOREPO_ROOT,
  getWorkspaceInfo,
  bash,
} = require('./shared');

// TODO: Pipe stdout correctly
let packageName = process.argv[2];
const dockerImageUrl = process.argv[3];
const workspace = getWorkspaceInfo();
const webpackPath = require.resolve(`.bin/webpack`);

if (!packageName) {
  throw new Error('An argument must be passed with a package name.');
}
packageName = `@overmindbots/${packageName}`;
if (!dockerImageUrl) {
  throw new Error('An argument must be passed with a Docker tag name.');
}
if (!workspace[packageName]) {
  throw new Error(
    `"${packageName}" does not exist in the workspace.\nDid you forget to prepend the name with "@overmindbots"?\n`
  );
}

/** Where the package's modified copy is */
const PACKAGE_COPY_DIR = `${BUILD_DIR}/${workspace[packageName].location}`;
/** Where the files for the docker context are saved */
const DOCKER_ROOT_DIR = `${PACKAGE_COPY_DIR}/docker`;
/** Where the files for the built package is saved */
const DOCKER_APP_DIR = `${DOCKER_ROOT_DIR}/app`;

// Cleanup files
bash(`rm -rf ${DOCKER_ROOT_DIR}`);
bash(`mkdir -p ${DOCKER_APP_DIR}`);

// Install production dependencies only
bash(`cp ${PACKAGE_COPY_DIR}/package.json ${DOCKER_APP_DIR}/`);
bash(`cp ${MONOREPO_ROOT}/yarn.lock ${DOCKER_APP_DIR}/`);
bash('yarn install --production --pure-lockfile', { cwd: `${DOCKER_APP_DIR}` });

// Copy package's source files
bash(`cp -R ${PACKAGE_COPY_DIR}/src ${DOCKER_APP_DIR}/src`);

// Copy package's config files
bash(`cp ${PACKAGE_COPY_DIR}/webpack.production.config.js ${DOCKER_APP_DIR}/`);
bash(`cp ${PACKAGE_COPY_DIR}/tsconfig.build.json ${DOCKER_APP_DIR}/`);
bash(`cp ${PACKAGE_COPY_DIR}/tsconfig.json ${DOCKER_APP_DIR}/`);
bash(`cp ${PACKAGE_COPY_DIR}/Dockerfile ${DOCKER_ROOT_DIR}/`);
bash(`cp ${PACKAGE_COPY_DIR}/.env.local ${DOCKER_APP_DIR}/`);

// Copy shared build config files
bash(`cp webpack.production.config.js ${PACKAGE_COPY_DIR}/`);
bash(`cp packages/tsconfig.build.json ${DOCKER_ROOT_DIR}/`);
bash(`cp packages/tsconfig.base.json ${DOCKER_ROOT_DIR}/`);
// TODO: Figure out why webpack is asking for this file
bash(`cp packages/tsconfig.editor.json ${DOCKER_ROOT_DIR}/`);

// Build package runtime file
try {
  bash(
    `${webpackPath} --config webpack.production.config.js --env NODE_ENV=production`,
    { cwd: `${DOCKER_APP_DIR}` }
  );
} catch (e) {
  console.error(e.stdout.toString());
  throw e;
}

// Cleanup source files
bash(`rm -rf ${DOCKER_APP_DIR}/src`);

console.log('==> Building docker image with: ', dockerImageUrl);
// Build Docker image
try {
  bash(`docker build -t ${dockerImageUrl} ${DOCKER_ROOT_DIR}`);
} catch (e) {
  console.error(e.stdout.toString());
  throw e;
}
