require('./shared/init');

const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');
const _ = require('lodash');

const utils = require('./shared/utils');

const totalShards = process.env.SERVICE_REFERRAL_RANKS_INVITES_TOTAL_SHARDS;
const repoName = process.env.CIRCLE_PROJECT_REPONAME;
if (!totalShards) {
  throw new Error(
    `Environment variable missing: SERVICE_REFERRAL_RANKS_INVITES_TOTAL_SHARDS`
  );
}

const packageName = 'service-referral-ranks-invites';

/**
 * Builds the kubernetes config from the template file
 */
function buildTemplate(baseTemplateValues, shardId) {
  const kubernetesTemplatesDir = path.resolve(process.cwd(), 'k8s');
  const kubernetesGeneratedDir = path.resolve(process.cwd(), 'k8s-generated');
  const templatePath = path.resolve(
    process.cwd(),
    `${kubernetesTemplatesDir}/${packageName}.yaml`
  );
  const generatedFilePath = path.resolve(
    process.cwd(),
    `${kubernetesGeneratedDir}/${packageName}-${shardId}.yaml`
  );

  const templateContent = fs.readFileSync(templatePath, 'utf8');
  const templateBuilder = handlebars.compile(templateContent);

  const templateValues = Object.assign({}, baseTemplateValues, {
    shardId,
  });

  const compiled = templateBuilder(templateValues);
  fs.writeFileSync(generatedFilePath, compiled);
}

const deploymentStage = utils.getDeploymentStage();
let imageUrl;
let imagePullPolicy;

if (deploymentStage === 'development') {
  imageUrl = `gcr.io/${repoName}:development`;
  imagePullPolicy = `Always`;
} else {
  imageUrl = `gcr.io/${repoName}:${process.env.CIRCLE_BRANCH}-${
    process.env.CIRCLE_BUILD_NUM
  }`;
  imagePullPolicy = `IfNotPresent`;
}

const templateValues = {
  deploymentStage,
  imageUrl,
  imagePullPolicy,
};

_.range(0, totalShards).forEach(shardId => {
  buildTemplate(templateValues, shardId);
});

console.log(`====> Successfully built template for ${packageName}`);
