const handlebars = require('handlebars');
const _ = require('lodash');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();
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
let imagePullPolicy;
let deploymentStage;
let serviceReferralRanksInvitesTotalShards = parseInt(
  process.env.SERVICE_REFERRAL_RANKS_INVITES_TOTAL_SHARDS,
  10
);
let mongoDbUri;

const GOOGLE_PROJECT_ID = process.env.GOOGLE_PROJECT_ID || 'UNSET';
const CIRCLE_BRANCH = process.env.CIRCLE_BRANCH || 'UNSET';
const CIRCLE_BUILD_NUM = process.env.CIRCLE_BUILD_NUM || 'UNSET';
const BOT_TOKEN = process.env.BOT_TOKEN;
const MONGODB_URI = process.env.MONGODB_URI;

if (!serviceReferralRanksInvitesTotalShards) {
  throw new Error('SERVICE_REFERRAL_RANKS_INVITES_TOTAL_SHARDS not set');
}

if (CIRCLE_BRANCH === 'UNSET') {
  deploymentStage = 'development';
} else if (CIRCLE_BRANCH === 'next') {
  deploymentStage = 'staging';
} else if (CIRCLE_BRANCH === 'master') {
  deploymentStage = 'production';
}

mongoDbUri = MONGODB_URI;

// TODO: Dry these
switch (deploymentStage) {
  case 'development': {
    imagePullPolicy = 'IfNotPresent';
    serviceReferralRanksInvitesImgUrl =
      'service-referral-ranks-invites:develop';
    mongoDbUri =
      'mongodb://dev:dev@overmindbots-mongodb-mongodb.overmindbots.svc.cluster.local:27017/overmindbots';
    break;
  }
  case 'staging': {
    imagePullPolicy = 'Always';
    serviceReferralRanksInvitesImgUrl = `gcr.io/overmind-bots/service-referral-ranks-invites:${CIRCLE_BRANCH}-${CIRCLE_BUILD_NUM}`;
    break;
  }
  case 'production': {
    imagePullPolicy = 'Always';
    serviceReferralRanksInvitesImgUrl = `gcr.io/overmind-bots/service-referral-ranks-invites:${CIRCLE_BRANCH}-${CIRCLE_BUILD_NUM}`;
    break;
  }
  default: {
    throw new Error('deploymentStage could not be inferred');
  }
}

const baseTemplateConfig = {
  imagePullPolicy,
  deploymentStage,
};

if (deploymentStage === 'development') {
  compileTemplate(
    'k8s',
    'overmindbots-secrets',
    {
      botToken: Buffer.from(BOT_TOKEN).toString('base64'),
      mongoDbUri: Buffer.from(mongoDbUri).toString('base64'),
    },
    `overmindbots-secrets`,
    err => {
      if (err) {
        throw err;
      }
    }
  );
}

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
