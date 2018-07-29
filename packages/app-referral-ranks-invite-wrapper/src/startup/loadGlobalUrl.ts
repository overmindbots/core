import logger from 'winston';
import { getGlobalUrl } from '~/utils/getGlobalUrl';

getGlobalUrl()
  .then(url => {
    logger.info(`=> Using global url: ${url}`);
  })
  .catch(logger.error);
