let botReferralRanksReplicasCount = 0;

if (process.env.BOT_REFERRAL_RANKS_TOTAL_SHARDS) {
  botReferralRanksReplicasCount = parseInt(
    process.env.BOT_REFERRAL_RANKS_TOTAL_SHARDS,
    10
  );
}

if (!process.env.BOT_MANAGER_SERVICE_PORT) {
  throw new Error('BOT_MANAGER_SERVICE_PORT missing');
}
if (!process.env.BOT_MANAGER_SERVICE_HOST) {
  throw new Error('BOT_MANAGER_SERVICE_HOST missing');
}
if (!process.env.MONGODB_URI) {
  throw new Error('MONGODB_URI missing');
}

export const BOT_MANAGER_SERVICE_PORT = parseInt(
  process.env.BOT_MANAGER_SERVICE_PORT,
  10
);
export const MONGODB_URI = process.env.MONGODB_URI;
export const BOT_MANAGER_SERVICE_HOST = process.env.BOT_MANAGER_SERVICE_HOST;
export const BOT_REFERRAL_RANKS_TOTAL_SHARDS = botReferralRanksReplicasCount;
