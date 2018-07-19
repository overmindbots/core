const config = require('../../../config.json');

/**
 * Get the current deployment stage
 *
 * @returns {string} the deployment stage (development, staging or production)
 */
function getDeploymentStage() {
  if (!process.env.CIRCLE_BRANCH) {
    return 'development';
  }
  if (process.env.CIRCLE_BRANCH === config.deployment.stagingBranch) {
    return 'staging';
  }
  if (process.env.CIRCLE_BRANCH === config.deployment.productionBranch) {
    return 'production';
  }
}

module.exports = {
  getDeploymentStage,
};
