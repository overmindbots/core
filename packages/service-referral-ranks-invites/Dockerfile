FROM mhart/alpine-node:10

RUN ls

RUN mkdir /root/repo
WORKDIR /root/repo

COPY package.json yarn.lock ./
COPY packages/service-referral-ranks-invites ./packages/service-referral-ranks-invites
COPY packages/shared-utils ./packages/shared-utils
COPY packages/shared-models ./packages/shared-models

RUN yarn

CMD ["yarn start-production:service-referral-ranks-invites"]