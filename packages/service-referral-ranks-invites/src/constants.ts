// Move this logic to shared utility
if (!process.env.BOT_TOKEN) {
  throw new Error('Missing env variable BOT_TOKEN');
}
if (!process.env.TOTAL_SHARDS) {
  throw new Error('Missing env variable TOTAL_SHARDS');
}
if (!process.env.SHARD_ID) {
  throw new Error('Missing env variable SHARD_ID');
}
if (!process.env.MONGODB_URI) {
  throw new Error('Missing env variable MONGODB_URI');
}
if (!process.env.CHUNK_SIZE) {
  throw new Error('Missing env variable CHUNK_SIZE');
}

export const BOT_TOKEN = process.env.BOT_TOKEN;
export const SHARD_ID = parseInt(process.env.SHARD_ID, 10);
export const TOTAL_SHARDS = parseInt(process.env.TOTAL_SHARDS, 10);
export const MONGODB_URI = process.env.MONGODB_URI;
export const CHUNK_SIZE = parseInt(process.env.CHUNK_SIZE, 10);
