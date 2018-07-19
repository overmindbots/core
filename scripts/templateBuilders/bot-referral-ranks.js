require('./shared/init');

const path = require('path');

const utils = require('./shared/utils');

const totalShards = process.env.BOT_REFERRAL_RANKS_TOTAL_SHARDS;

const packageName = path.basename(__filename).split('.js')[0];
const baseTemplateValues = utils.getBaseTemplateData();
const templateValue = Object.assign({}, baseTemplateValues, {
  totalShards,
});

utils.buildTemplate(packageName, templateValue);
