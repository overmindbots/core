# State of this repo
Right now this is just a "working" demo of a monorepo setup.

- Packages are not currently being pushed to separate repositories though that is configurable.
- Dependencies still need to be correctly configured
- File structure is only temporary and should be discussed
- Ci and compilation are not yet set-up
- Commit flow and release versioning is working well. (Except for pre-releases that need to be tested)

# Setup instructions
Install Lerna
- `yarn global add lerna`

Setup LernaChangelog
- [create a personal github access token](https://github.com/settings/tokens)
- set this environment variable in your machine: `GITHUB_AUTH=<token>`

Install dependencies of all packages
- `lerna bootstrap --hoist`

# Usage

**Commiting**
Use `yarn commit` to trigger the commitizen prompt. A pre-commit hook will
ensure that the message is compliant with the `conventional-commits` standard.

**Publishing**
To publish a new version use `yarn release`, this will prompt which packages
have been updated and the monorepo will be pushed accordingly

**Continuous Development**
Deployments are performed based on the following rules:

- When the `develop` branch gets updated (push or merge):
  * a pre-release tag is created
  * CI deploys to `STAGING`
- When the `master` branch gets updated (push or merge) a release tag is created
  * a release tag is created
  * CI deploys to `PRODUCTION`

*We should be able later in the future to have a **beta** version available for users who are willing to test the latest features*

# Conventions

This is a set of conventions that is followed in this repository

## Package naming
We name our packages based on what they are:

### Core
Our apps and services, they live in `core/*`

- **Bots:** Bots can have a master service and some slave services to do specialized work
  * **Master service:** `bot-<name-of-bot>`
    * Example: `bot-referral-ranks`,
  * **Slave service:** `bot-<name-of-bot>-<name-of-service>-service`
    * Example: `bot-referral-ranks-invites-service`
- **Apps:** Apps (web apps, mobile apps, landing pages etc...)
  * Naming `app-<name-of-app>[-<scope>][-client,-server]`
    * Examples:
      * `app-bots-web-panel-web-client`
      * `app-bots-web-panel-ios-client`
      * `app-bots-web-panel-api-server`
      * `app-bot-referral-ranks-landing`
- **Services:** Standalone services that are not part of a bigger one
  * Naming:  `service-<name-of-service>`
  * Example: `service-bot-manager`, `service-spam-mailer-cannon`

### Shared Packages
Our shared code packages. They live in `packages/shared/*`, no naming convention.

### Public Packages
Packages that are open source and potentially published to NPM. They live in `packages/public/*`, no naming convention.