# State of this repo
Right now this is just a "working" demo of a monorepo setup.

- Packages are not currently being pushed to separate repositories though that is configurable.
- Dependencies still need to be correctly configured
- File structure is only temporary and should be discussed
- Ci and compilation are not yet set-up
- Commit flow and release versioning is working well. (Except for pre-releases that need to be tested)

# Setup instructions

Install dependencies
- `yarn install`

Install Lerna
- `yarn global add lerna`

Setup LernaChangelog
- [create a personal github access token](https://github.com/settings/tokens)
- set this environment variable in your machine: `GITHUB_AUTH=<token>`

# Usage

**Commiting**
Use `yarn commit` to trigger the commitizen prompt. A pre-commit hook will
ensure that the message is compliant with the `conventional-commits` standard.

**Publishing**
To publish a new version use `yarn release`, this will prompt which packages
have been updated and the monorepo will be pushed accordingly

