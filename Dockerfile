FROM mhart/alpine-node:10 as builder

RUN yarn global add lerna

RUN mkdir /root/repo
WORKDIR /root/repo
COPY package.json yarn.lock ./

RUN yarn install
# Up to this point we have all hoisted dependencies installed, this can be cached

COPY webpack.production.config.js .
COPY packages packages
COPY lerna.json .

RUN yarn lerna bootstrap
RUN yarn lerna run build:production --parallel

FROM mhart/alpine-node:10
RUN apk update && apk add ca-certificates && rm -rf /var/cache/apk/*

RUN mkdir /root/repo
WORKDIR /root/repo
COPY package.json yarn.lock ./

COPY --from=builder /root/repo/packages/app-referral-ranks-invite-wrapper/node_modules /root/repo/packages/app-referral-ranks-invite-wrapper/node_modules
COPY --from=builder /root/repo/packages/app-referral-ranks-invite-wrapper/production-build /root/repo/packages/app-referral-ranks-invite-wrapper/production-build
COPY --from=builder /root/repo/packages/app-referral-ranks-invite-wrapper/package.json /root/repo/packages/app-referral-ranks-invite-wrapper/package.json
COPY --from=builder /root/repo/packages/bot-referral-ranks/node_modules /root/repo/packages/bot-referral-ranks/node_modules
COPY --from=builder /root/repo/packages/bot-referral-ranks/production-build /root/repo/packages/bot-referral-ranks/production-build
COPY --from=builder /root/repo/packages/bot-referral-ranks/package.json /root/repo/packages/bot-referral-ranks/package.json
COPY --from=builder /root/repo/packages/bot-referral-ranks-fulfillment-service/node_modules /root/repo/packages/bot-referral-ranks-fulfillment-service/node_modules
COPY --from=builder /root/repo/packages/bot-referral-ranks-fulfillment-service/production-build /root/repo/packages/bot-referral-ranks-fulfillment-service/production-build
COPY --from=builder /root/repo/packages/bot-referral-ranks-fulfillment-service/package.json /root/repo/packages/bot-referral-ranks-fulfillment-service/package.json
COPY --from=builder /root/repo/packages/service-bot-manager/node_modules /root/repo/packages/service-bot-manager/node_modules
COPY --from=builder /root/repo/packages/service-bot-manager/production-build /root/repo/packages/service-bot-manager/production-build
COPY --from=builder /root/repo/packages/service-bot-manager/package.json /root/repo/packages/service-bot-manager/package.json
COPY --from=builder /root/repo/packages/service-naked-domain-redirect/node_modules /root/repo/packages/service-naked-domain-redirect/node_modules
COPY --from=builder /root/repo/packages/service-naked-domain-redirect/production-build /root/repo/packages/service-naked-domain-redirect/production-build
COPY --from=builder /root/repo/packages/service-naked-domain-redirect/package.json /root/repo/packages/service-naked-domain-redirect/package.json

