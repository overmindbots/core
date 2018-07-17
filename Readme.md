# Setup instructions

## To run locally
Install Lerna
- `yarn global add lerna`

Install dependencies of all packages
- `lerna bootstrap`

Create .env in repos
- create a .env with the required environment variables in any repo you want to run, (this should be improved).
- use `yarn start` inside a package's directory to run it

# Install cli tools to access our remote cluster

## Google Cloud CLI
- install [gcloud](https://cloud.google.com/sdk/) to access Google Cloud
- `gcloud auth login` and login with your overmindbots.com account
- `gcloud config set project overmind-bots`
- `gcloud container clusters get-credentials staging` to setup staging access
- `gcloud container clusters get-credentials production` to setup staging access

## Kubectx
- install [kubectx](https://github.com/ahmetb/kubectx) to change kubernetes contexts more easily
- `kubectx` in the Terminal to get a list of contexts
- `kubectx <contexName>` to switch to that context
- `kubens overmindbots` to set the namespace (otherwise you wont see running components)

## Managing the remote cluster
- `kubectl get pods` to get the list of running pods
- `kubectl logs -f pods/<podId>` to get realtime logs of a pod

You can also visit [Our cluster in the browser](https://console.cloud.google.com/kubernetes/workload?project=overmind-bots)

## Deploying
- Staging will be automatically deployed when `development` gets a new commit
- Production will be automatically deployed when `master` gets a new commit

You should have access to [Our CircleCI](https://circleci.com/gh/overmindbots). You can
see how the deployments are doing there


# Usage

**Commiting**
Use `yarn commit` to trigger the commitizen prompt. A pre-commit hook will
ensure that the message is compliant with the `conventional-commits` standard.

**Continuous Delivery and Branching Model**

- All merges to `master` are deployed to production
- All merges to `development` are deployed to staging (pending `beta` branch to control staging)

Releases feature is pending since it was causing deployments to fail

# Extra notes

Updated dependencies in `app-bots-web-panel-web-client`. If anything fails, these were the old ones:

```json
"relay-compiler": "https://github.com/alloy/relay/releases/download/v1.5.0-plugin.3/relay-compiler-1.5.0-plugin.3.tgz",
"relay-runtime": "https://github.com/alloy/relay/releases/download/v1.5.0-plugin.3/relay-runtime-1.5.0-plugin.3.tgz",
"babel-plugin-relay": "https://github.com/alloy/relay/releases/download/v1.5.0-plugin.3/babel-plugin-relay-1.5.0-plugin.3.tgz",
"react-relay": "https://github.com/alloy/relay/releases/download/v1.5.0-plugin.3/react-relay-1.5.0-plugin.3.tgz"
```

# Testing

> For the sake of simplicity we are going to refer to **service/package** as **S/P**.

To add tests to your **S/P**:

- Add `jest.config.js` file in your **S/P** folder that extends from `jest.base.js` config file located in this repo's root path. *See example below*.
- Add/Update the `test` script in your `package.json` to call jest (`"test": "jest"`).
- Create a `test` folder next to your **S/P** `src` folder.

## Example jest config file

```js
// jest.config.js
const baseConfig = require('../../jest.base');

module.exports = {
  ...baseConfig,
  // Code to extend base config goes here
};
```

## Conventions

This is a work in progress, but these are the base testing conventions ATM:

- Test files' name **must not** contain suffixes like `spec`, `test`, etc.
- If we want to test an **instance method** we **must** scope the tests inside a `describe` block with a `#` followed by the name of the method. Example: `describe('Array#sort', () => {})`.
- If we want to test a **static method** we **must** scope the tests inside a `describe` block with a `.` followed by the name of the method. Example: `describe('Object.keys', () => {})`.

> See [service-bot-manager](https://github.com/overmindbots/core/tree/development/packages/service-bot-manager/test) test folder for further info.

## Run tests

To run just your **service/package**'s tests:

- `cd` into your **service/package**
- Run `yarn test`

> If you want to run your tests each time a file changes, remember to add `--watch` flag to `yarn test` command.

You can also run your **S/P** tests from the root by calling:

```sh
lerna run --scope @overmindbots/my-service test
```

If you want to run tests of every **service/package** on the repo, run this command from the root:

```sh
lerna run test
```

> Remember you can also pass `scope` flag multiple times in order to run one or multiple tests like `lerna run --scope @overmindbots/service-bot-manager --scope @overmindbots/bot-* test`

## Config env vars

**IMPORTANT**: All the following instructions considers that we are standing on the **S/P** folder.

You will need to create a `.env.test` file. Then, we need to create a `setupTests.ts` file inside your `test` folder with the following content:

```js
import dotenv from 'dotenv';

dotenv.config();
dotenv.config({ path: '.env.test' });

// You can also mute winston by adding:
// import logger from 'winston';
// logger.remove(logger.transports.Console);
```

Now that we created our setup file, we need to tell jest to load this setup file before running any test, this will be achieved by adding the `setupTestFramworkScriptFile` config.

**Example:**

```js
const baseConfig = require('../../jest.base');

module.exports = {
  ...baseConfig,
  setupTestFrameworkScriptFile: '<rootDir>/test/setupTests.ts', // <-
};
```