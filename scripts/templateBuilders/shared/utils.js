const path = require('path');
const pkgJson = require('../../../package.json');
const fs = require('fs');
const handlebars = require('handlebars');

const config = pkgJson.config.overmindbots;
const repoName = process.env.CIRCLE_PROJECT_REPONAME || 'core';
const projectId = process.env.GOOGLE_PROJECT_ID;
const deploymentStages = {
  development: 'development',
  staging: 'staging',
  production: 'production',
};

/**
 * Gets the project's global config
 */
function getConfig() {
  const pkgJson = require('../../../package.json');
  return pkgJson.config.overmindbots;
}
/**
 * Get the current deployment stage
 *
 * @returns {string} the deployment stage (development, staging or production)
 */
function getDeploymentStage() {
  if (!process.env.CIRCLE_BRANCH) {
    return deploymentStages.development;
  }
  if (process.env.CIRCLE_BRANCH === config.deployment.stagingBranch) {
    return deploymentStages.staging;
  }
  if (process.env.CIRCLE_BRANCH === config.deployment.productionBranch) {
    return deploymentStages.production;
  }
}
/**
 * gets the docker image URL
 * @return {string}
 */
function getImageUrl() {
  const deploymentStage = getDeploymentStage();
  if (deploymentStage === deploymentStages.development) {
    return `gcr.io/${repoName}:development`;
  }
  return `gcr.io/${projectId}/${repoName}:${process.env.CIRCLE_BRANCH}-${
    process.env.CIRCLE_BUILD_NUM
  }`;
}
/**
 * gets the imagePullPolicy depending on deployment stage
 */
function getImagePullPolicy() {
  const deploymentStage = getDeploymentStage();
  if (deploymentStage === deploymentStages.development) {
    return 'Always';
  }
  return 'IfNotPresent';
}
/**
 * gets the common data for kubernetes templates
 * @return {object}
 */
function getBaseTemplateData() {
  const deploymentStage = getDeploymentStage();
  const imageUrl = getImageUrl();
  const imagePullPolicy = getImagePullPolicy();
  return {
    deploymentStage,
    imageUrl,
    imagePullPolicy,
  };
}
/**
 * Builds a kubernetes config file from a template
 *
 * @param {string} inputFilename filename of the template to build
 * @param {object} values values to pass to template
 * @param {string} outputFilenameArg filename of file to create, defaults to `inputFilename`
 */
function buildTemplate(inputFilename, values, outputFilenameArg) {
  const outputFilename = outputFilenameArg || inputFilename;
  const {
    kubernetesTemplatesDir,
    kubernetesGeneratedTemplatesDir,
  } = config.deployment;
  const inputPath = path.resolve(
    process.cwd(),
    `${kubernetesTemplatesDir}/${inputFilename}.yaml`
  );
  const outputPath = path.resolve(
    process.cwd(),
    `${kubernetesGeneratedTemplatesDir}/${outputFilename}.yaml`
  );

  const templateContent = fs.readFileSync(inputPath, 'utf8');
  const templateBuilder = handlebars.compile(templateContent);
  const compiled = templateBuilder(values);
  fs.writeFileSync(outputPath, compiled);
}

module.exports = {
  buildTemplate,
  getDeploymentStage,
  getBaseTemplateData,
  getConfig,
};
