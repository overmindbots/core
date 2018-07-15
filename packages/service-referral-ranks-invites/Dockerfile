FROM mhart/alpine-node:10

RUN mkdir /root/repo
WORKDIR /root/repo
COPY package.json yarn.lock node_modules ./
COPY packages/ .


RUN yarn

EXPOSE 4001

CMD ["npm", "run", "start-production"]