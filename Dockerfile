FROM node:14

WORKDIR /app

COPY package.json ./
COPY yarn.lock ./

RUN yarn

COPY ./ ./

CMD ["npm", "start"]

EXPOSE 80