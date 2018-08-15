require('./shared/init');

const path = require('path');
const utils = require('./shared/utils');

const packageName = path.basename(__filename).split('.js')[0];
const templateValues = utils.getBaseTemplateData();
const stage = utils.getDeploymentStage();
let url;

// Move these urls to a better place (https://github.com/overmindbots/core/issues/24)
switch (stage) {
  case 'development': {
    url = 'localhost';
    break;
  }
  case 'staging': {
    url = 'https://staging-invites.referralranks.com';
    break;
  }
  case 'production': {
    url = 'https://invites.referralranks.com';
    break;
  }
}

const extendedTemplateValues = {
  ...templateValues,
  url,
};

// Generate one deployment per shardId
utils.buildTemplate(packageName, extendedTemplateValues, `${packageName}`);

console.log(`====> Successfully built template for ${packageName}`);
