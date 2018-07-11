import logger from 'winston';

logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, {
  colorize: true,
  formatter: opts => `[${process.env.NODE_ENV}] ${opts.message}`,
});
logger.level = 'info';
if (process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true') {
  logger.level = 'debug';
}
