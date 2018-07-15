const handlebars = require('handlebars');
const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config();
dotenv.config({
  path: './.env.local',
});
handlebars.registerHelper('choose', function(a, b) {
  return a ? a : b;
});

const GOOGLE_PROJECT_ID = process.env.GOOGLE_PROJECT_ID || 'UNSET';
const CIRCLE_BRANCH = process.env.CIRCLE_BRANCH || 'UNSET';
const CIRCLE_BUILD_NUM = process.env.CIRCLE_BUILD_NUM || 'UNSET';

let botManagerImgUrl;
let botReferralRanksReplicas;
let botReferralRanksImgUrl;
let imagePullPolicy;
let deploymentStage;

// See where we are: local machine, staging deploy or production deployment
if (CIRCLE_BRANCH === 'UNSET') {
  deploymentStage = 'development';
} else if (CIRCLE_BRANCH === 'develop') {
  deploymentStage = 'staging';
} else {
  deploymentStage = 'production';
}

if (deploymentStage === 'development') {
  // Validate dev env variables
  if (!process.env.SERVICE_REFERRAL_RANKS_INVITES_TOTAL_SHARDS) {
    throw new Error(
      'SERVICE_REFERRAL_RANKS_INVITES_TOTAL_SHARDS env must be defined in a .env file in the root directory'
    );
  }
  if (!process.env.MONGODB_URI) {
    throw new Error(
      'MONGODB_URI env must be defined in a .env file in the root directory'
    );
  }

  // Set dev secrets
  compileTemplate(
    '.',
    'dev-components',
    {
      BOT_TOKEN: Buffer.from(process.env.BOT_TOKEN).toString('base64'),
      MONGODB_URI: Buffer.from(process.env.MONGODB_URI).toString('base64'),
      deploymentStage: deploymentStage,
    },
    err => {
      if (err) throw err;
    }
  );
  botManagerImgUrl = 'bot-manager:develop';
  botReferralRanksImgUrl = 'bot-referral-ranks:develop';
  imagePullPolicy = 'IfNotPresent';
  botReferralRanksReplicas = 4; // Remove this from here, this is confusing
} else {
  botManagerImgUrl = `gcr.io/${GOOGLE_PROJECT_ID}/gs-manager:${CIRCLE_BRANCH}-${CIRCLE_BUILD_NUM}`;
  botReferralRanksImgUrl = `gcr.io/${GOOGLE_PROJECT_ID}/bot-referral-ranks:${CIRCLE_BRANCH}-${CIRCLE_BUILD_NUM}`;
  imagePullPolicy = 'Always';
}

compileTemplate(
  'k8s',
  'bot-manager',
  {
    imageUrl: botManagerImgUrl,
    imagePullPolicy: imagePullPolicy,
    deploymentStage: deploymentStage,
    botReferralRanksReplicas: botReferralRanksReplicas,
  },
  err => {
    if (err) throw err;
  }
);
compileTemplate(
  'k8s',
  'bot-referral-ranks',
  {
    imageUrl: botReferralRanksImgUrl,
    imagePullPolicy: imagePullPolicy,
    botReferralRanksReplicas: botReferralRanksReplicas,
    deploymentStage: deploymentStage,
  },
  err => {
    if (err) throw err;
  }
);

function compileTemplate(path, name, values, cb) {
  fs.readFile(`${path}/${name}.yaml`, 'utf8', (err, data) => {
    if (err) {
      throw err;
    }
    const template = handlebars.compile(data);
    const compiled = template(values);
    fs.writeFile(`k8s-generated/${name}.yaml`, compiled, cb);
  });
}
