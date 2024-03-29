import dotenv from 'dotenv';
import logger from 'winston';

dotenv.config();
dotenv.config({ path: '.env.test' });

logger.remove(logger.transports.Console);
