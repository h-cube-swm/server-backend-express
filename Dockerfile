FROM node:14

WORKDIR /app

COPY src/package.json ./
COPY src/yarn.lock ./

RUN yarn

COPY src/ ./

CMD ["npm", "start"]

EXPOSE 80