// Move this logic to shared utility
if (!process.env.DISCORD_CLIENT_SECRET) {
  throw new Error('Missing env variable DISCORD_CLIENT_SECRET');
}
if (!process.env.DISCORD_CLIENT_ID) {
  throw new Error('Missing env variable DISCORD_CLIENT_ID');
}
if (!process.env.MONGODB_URI) {
  throw new Error('Missing env variable MONGODB_URI');
}
if (!process.env.NODE_ENV) {
  throw new Error('Missing env variable NODE_ENV');
}

console.log('process.env.NODE_ENV', process.env.NODE_ENV);
console.log('process.env.MONGODB_URI', process.env.MONGODB_URI);
if (process.env.NODE_ENV === 'development') {
  if (!process.env.PORT) {
    throw new Error('Missing env variable PORT');
  }
} else if (!process.env.SERVICE_REFERRAL_RANKS_INVITE_WRAPPER) {
  throw new Error('Missing env variable SERVICE_REFERRAL_RANKS_INVITE_WRAPPER');
}

export const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
export const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
export const MONGODB_URI = process.env.MONGODB_URI;
export const OAUTH_CALLBACK_URL = '/oauth';
export const PORT =
  process.env.SERVICE_REFERRAL_RANKS_INVITE_WRAPPER || process.env.PORT;
