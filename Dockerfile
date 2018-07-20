FROM mhart/alpine-node:10

RUN apk update && apk add ca-certificates && rm -rf /var/cache/apk/*
RUN mkdir /root/repo
WORKDIR /root/repo

COPY package.json yarn.lock ./
COPY packages packages

RUN yarn install