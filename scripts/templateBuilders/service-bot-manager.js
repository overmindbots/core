require('./shared/init');

const path = require('path');

const utils = require('./shared/utils');

const botReferralRanksTotalShards = process.env.BOT_REFERRAL_RANKS_TOTAL_SHARDS;

const packageName = path.basename(__filename).split('.js')[0];
const baseTemplateValues = utils.getBaseTemplateData(packageName);
const templateValue = Object.assign({}, baseTemplateValues, {
  botReferralRanksTotalShards,
});

utils.buildTemplate(packageName, templateValue);
