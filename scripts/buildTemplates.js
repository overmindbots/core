const handlebars = require('handlebars');
const _ = require('lodash');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config({
  path: '.env.local',
});

handlebars.registerHelper('choose', function(a, b) {
  return a ? a : b;
});
function compileTemplate(path, name, values, writeName, cb) {
  fs.readFile(`${path}/${name}.yaml`, 'utf8', (err, data) => {
    if (err) {
      throw err;
    }
    const template = handlebars.compile(data);
    const compiled = template(values);
    fs.writeFile(`k8s-generated/${writeName || name}.yaml`, compiled, cb);
  });
}

let serviceReferralRanksInvitesImgUrl;
let serviceReferralRanksInvitesTotalShards = parseInt(
  process.env.SERVICE_REFERRAL_RANKS_INVITES_TOTAL_SHARDS,
  10
);
let imagePullPolicy;

const GOOGLE_PROJECT_ID = process.env.GOOGLE_PROJECT_ID || 'UNSET';
const CIRCLE_BRANCH = process.env.CIRCLE_BRANCH || 'UNSET';
const CIRCLE_BUILD_NUM = process.env.CIRCLE_BUILD_NUM || 'UNSET';

if (!serviceReferralRanksInvitesTotalShards) {
  throw new Error('SERVICE_REFERRAL_RANKS_INVITES_TOTAL_SHARDS not set');
}

if (CIRCLE_BRANCH === 'UNSET') {
  deploymentStage = 'development';
} else if (CIRCLE_BRANCH === 'beta') {
  deploymentStage = 'staging';
} else if (CIRCLE_BRANCH === 'master') {
  deploymentStage = 'production';
}

switch (deploymentStage) {
  case 'development': {
    imagePullPolicy = 'IfNotPresent';
    break;
  }
  case 'staging': {
    imagePullPolicy = 'Always';
    break;
  }
  case 'production': {
    imagePullPolicy = 'Always';
    break;
  }
  default: {
    throw new Error('deploymentStage could not be inferred');
  }
}

const baseTemplateConfig = {
  imagePullPolicy,
};

_.each(_.range(0, serviceReferralRanksInvitesTotalShards), shardId => {
  compileTemplate(
    'k8s',
    'service-referral-ranks-invites',
    Object.assign({}, baseTemplateConfig, {
      shardId,
      totalShards: serviceReferralRanksInvitesTotalShards,
      imageUrl: serviceReferralRanksInvitesImgUrl,
    }),
    `service-referral-ranks-invites-shard-${shardId}`,
    err => {
      if (err) {
        throw err;
      }
    }
  );
});
