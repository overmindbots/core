import dotenv from 'dotenv';
import logger from 'winston';

dotenv.config();
dotenv.config({ path: './.env.local' });

logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, {
  colorize: true,
});
logger.level = 'debug';
