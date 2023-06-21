FROM node:18-alpine3.17

RUN mkdir -p /root/gateway

WORKDIR /root/gateway

COPY . .

RUN apk add --no-cache bash git

RUN yarn install --frozen-lockfile

RUN yarn build

RUN cp -r src/templates/ conf

EXPOSE 15888

CMD ["yarn", "start"]
