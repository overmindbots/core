import dotenv from 'dotenv';

if (!process.env.IS_SYNC_SCHEMA) {
  dotenv.config({ path: '.env' });
  dotenv.config({ path: '.env.local' });

  require('./db');
  require('./init-passport');
}
