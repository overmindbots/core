// Move this logic to shared utility
if (!process.env.APP_TOKEN) {
  throw new Error('Missing env variable APP_TOKEN');
}
if (!process.env.MONGODB_URI) {
  throw new Error('Missing env variable MONGODB_URI');
}

export const BOT_TOKEN = process.env.APP_TOKEN;
export const MONGODB_URI = process.env.MONGODB_URI;
