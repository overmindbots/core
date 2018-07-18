/*
 * Builds a k8s template file into k8s-generated
 * 
 * * Template variables provided
 * - imageUrl

 * - shardId
 * - deploymentStage
 *
 * == Shared ==
 * - shardID:
 *  passed iteratively
 * - deploymentStage
 *  inferred from context
 * 
 * == Inside CI ==
 * imageUrl:
 * - GOOGLE_PROJECT_ID
 * - CIRCLE_BRANCH
 * - CIRCLE_BUILD_NUM
 * 
 * == Locally ==
 */
const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');
const _ = require('lodash');
const dotenv = require('dotenv');
const config = require('../../config.json');

dotenv.config();
dotenv.config({ path: '.env.local' });

const totalShards = process.env.SERVICE_REFERRAL_RANKS_INVITES_TOTAL_SHARDS;
if (!totalShards) {
  throw new Error(
    `Environment variable missing: SERVICE_REFERRAL_RANKS_INVITES_TOTAL_SHARDS`
  );
}

const packageName = 'service-referral-ranks-invites';

function getDeploymentStage() {
  if (!process.env.CIRCLE_BRANCH) {
    return 'development';
  }
  if (process.env.CIRCLE_BRANCH === config.deployment.stagingBranch) {
    return 'staging';
  }
  if (process.env.CIRCLE_BRANCH === config.deployment.productionBranch) {
    return 'production';
  }
}
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

const deploymentStage = getDeploymentStage();
let imageUrl;
let imagePullPolicy;

if (deploymentStage === 'development') {
  imageUrl = `gcr.io/overmind-bots/${packageName}:development`;
  imagePullPolicy = `Always`;
} else {
  imageUrl = `gcr.io/overmind-bots/service-referral-ranks-invites:${
    process.env.CIRCLE_BRANCH
  }-${process.env.CIRCLE_BUILD_NUM}`;
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
