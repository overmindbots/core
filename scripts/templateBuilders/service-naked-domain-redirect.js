require('./shared/init');

const path = require('path');
const utils = require('./shared/utils');

const packageName = path.basename(__filename).split('.js')[0];
const templateValues = utils.getBaseTemplateData();

// Generate one deployment per shardId
utils.buildTemplate(packageName, templateValues, `${packageName}`);

console.log(`====> Successfully built template for ${packageName}`);
