FROM mhart/alpine-node:10

RUN mkdir /root/repo
WORKDIR /root/repo

COPY package.json yarn.lock ./
RUN yarn install

COPY packages/service-referral-ranks-invites ./packages/service-referral-ranks-invites
COPY packages/shared-utils ./packages/shared-utils
COPY packages/shared-models ./packages/shared-models

COPY packages/tsconfig.editor.json ./packages/tsconfig.editor.json
COPY packages/tsconfig.base.json ./packages/tsconfig.base.json

RUN yarn install
RUN ls

RUN cd packages/service-referral-ranks-invites && ls

RUN cd packages/service-referral-ranks-invites && yarn build:production


CMD ["yarn", "start-production:service-referral-ranks-invites"]