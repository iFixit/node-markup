FROM node:16-alpine

RUN apk --no-cache --update add graphicsmagick

RUN mkdir -p /opt/node-markup
WORKDIR /opt/node-markup

COPY package.json .
RUN npm install
COPY . .

RUN ./run-tests.py
