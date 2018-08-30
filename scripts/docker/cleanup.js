const { bash, BUILD_DIR } = require('./shared');

bash(`rm -rf ${BUILD_DIR}`);
