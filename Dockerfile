FROM mhart/alpine-node:10 as builder
RUN apk update && apk add ca-certificates && rm -rf /var/cache/apk/*

RUN mkdir /app
WORKDIR /app

COPY package.json yarn.lock ./
COPY webpack.production.config.js .
COPY packages packages
COPY lerna.json .

RUN yarn install

