require('./shared/init');

const path = require('path');
const utils = require('./shared/utils');

const packageName = path.basename(__filename).split('.js')[0];
const templateValues = utils.getBaseTemplateData();
const stage = utils.getDeploymentStage();
let url;

switch (stage) {
  case 'development': {
    url = 'localhost';
    break;
  }
  case 'staging': {
    url = 'www.referralranks.org'; // Temporary URL
    break;
  }
  case 'production': {
    url = 'www.referralranks.com';
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
