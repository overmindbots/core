FROM mhart/alpine-node:10 as builder
RUN apk update && apk add ca-certificates && rm -rf /var/cache/apk/*

RUN mkdir /app
WORKDIR /app

COPY app .

CMD ["yarn", "start:production"]

