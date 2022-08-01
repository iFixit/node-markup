FROM node:16-alpine

RUN mkdir -p /opt/node-markup
WORKDIR /opt/node-markup

COPY package.json .
RUN npm install
COPY . .

RUN ./run-tests.py
