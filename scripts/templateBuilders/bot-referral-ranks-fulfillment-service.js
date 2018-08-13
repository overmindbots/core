require('./shared/init');

const _ = require('lodash');
const path = require('path');

const utils = require('./shared/utils');

const totalShards =
  process.env.BOT_REFERRAL_RANKS_FULFILLMENT_SERVICE_TOTAL_SHARDS;
if (!totalShards) {
  throw new Error(
    `Environment variable missing: BOT_REFERRAL_RANKS_FULFILLMENT_SERVICE_TOTAL_SHARDS`
  );
}

const packageName = path.basename(__filename).split('.js')[0];
const templateValues = utils.getBaseTemplateData();

// Generate one deployment per shardId
_.range(0, totalShards).forEach(shardId => {
  const extendedTemplateValues = Object.assign({}, templateValues, {
    shardId,
    totalShards,
  });

  utils.buildTemplate(
    packageName,
    extendedTemplateValues,
    `${packageName}-${shardId}`
  );
});

console.log(`====> Successfully built template for ${packageName}`);
