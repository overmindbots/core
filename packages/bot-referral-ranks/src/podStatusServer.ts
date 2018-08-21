import { PodStatusServer } from '@overmindbots/shared-utils/podStatusServer';
import logger from 'winston';

export const podStatusServer = new PodStatusServer();

if (process.env.NODE_ENV !== 'development') {
  podStatusServer.start().catch(error => {
    logger.error(error.message, error);
  });
}
