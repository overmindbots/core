import mongoose from 'mongoose';
import logger from 'winston';
import { MONGODB_URI } from '~/constants';

mongoose
  .connect(
    MONGODB_URI,
    { useNewUrlParser: true }
  )
  .then(() => {
    logger.info('Database connected.');
  })
  .catch(err => {
    logger.error(err);
  });
