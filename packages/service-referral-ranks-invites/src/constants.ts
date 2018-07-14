// Move this logic to shared utility
if (!process.env.BOT_TOKEN) {
  throw new Error('Missing env variable BOT_TOKEN');
}
if (!process.env.TOTAL_SHARDS) {
  throw new Error('Missing env variable TOTAL_SHARDS');
}

export const BOT_TOKEN = process.env.BOT_TOKEN;
export const TOTAL_SHARDS = parseInt(process.env.TOTAL_SHARDS, 10);
