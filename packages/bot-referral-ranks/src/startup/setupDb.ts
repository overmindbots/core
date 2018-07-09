import mongoose from 'mongoose';
import logger from 'winston';
import { MONGODB_URI } from '~/constants';

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    logger.info('Database connected.');
  })
  .catch(err => {
    logger.error(err);
  });