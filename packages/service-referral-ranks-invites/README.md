# service-referral-ranks-invites
Service incharge of processing and persisting invite-related information

## Setup
- Clone this repo with `--recursive` flag to get submodules
- Install `yarn`
- Install `tslint`, `prettier` and `typescript` extensions in your editor
- run `yarn install`
- Create a `.env` file in the repo's root (this is git-ignored) and add the relevant env variables. Shared
in our Discord's `#tokens` channel.

## Usage
- `yarn start` for starting development. This will restart the dev process on any code changes
- `git submodule update --recursive --remote` to get the latest submodule versions
