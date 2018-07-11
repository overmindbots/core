FROM mhart/alpine-node:10

RUN mkdir /root/repo
WORKDIR /root/repo
COPY package.json yarn.lock ./
RUN yarn install
COPY . .

RUN yarn build

EXPOSE 4001

CMD ["npm", "run", "start-production"]