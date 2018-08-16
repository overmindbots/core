require('./shared/init');

const path = require('path');
const utils = require('./shared/utils');

const totalShards = process.env.BOT_REFERRAL_RANKS_TOTAL_SHARDS;
const stage = utils.getDeploymentStage();
let appReferralRanksInviteWrapperUrl;

// Move these urls to a better place (https://github.com/overmindbots/core/issues/24)
switch (stage) {
  case 'development': {
    appReferralRanksInviteWrapperUrl = 'localhost';
    break;
  }
  case 'staging': {
    appReferralRanksInviteWrapperUrl =
      'https://staging-invites.referralranks.com';
    break;
  }
  case 'production': {
    appReferralRanksInviteWrapperUrl = 'https://invites.referralranks.com';
    break;
  }
}

const packageName = path.basename(__filename).split('.js')[0];
const baseTemplateValues = utils.getBaseTemplateData();
const templateValue = Object.assign({}, baseTemplateValues, {
  totalShards,
  appReferralRanksInviteWrapperUrl,
});

utils.buildTemplate(packageName, templateValue);
