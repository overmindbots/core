FROM mhart/alpine-node:10

RUN apk update && apk add ca-certificates && rm -rf /var/cache/apk/*
RUN mkdir /root/repo
WORKDIR /root/repo

EXPOSE 7000
EXPOSE 4000

COPY webpack.production.config.js .
COPY lerna.json .
COPY package.json yarn.lock ./
COPY packages packages

RUN yarn install
# RUN cd ./packages/bot-referral-ranks && yarn build:production
# RUN cd ./packages/service-bot-manager && yarn build:production
# RUN cd ./packages/app-referral-ranks-invite-wrapper && yarn build:production
# RUN cd ./packages/bot-referral-ranks-fulfillment-service && yarn build:production
RUN yarn lerna run build:production