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

```
"relay-compiler": "https://github.com/alloy/relay/releases/download/v1.5.0-plugin.3/relay-compiler-1.5.0-plugin.3.tgz",
"relay-runtime": "https://github.com/alloy/relay/releases/download/v1.5.0-plugin.3/relay-runtime-1.5.0-plugin.3.tgz",
"babel-plugin-relay": "https://github.com/alloy/relay/releases/download/v1.5.0-plugin.3/babel-plugin-relay-1.5.0-plugin.3.tgz",
"react-relay": "https://github.com/alloy/relay/releases/download/v1.5.0-plugin.3/react-relay-1.5.0-plugin.3.tgz"
```