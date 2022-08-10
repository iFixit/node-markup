FROM node:16-alpine

RUN apk --no-cache --update add graphicsmagick python3 bash \
    git \
    build-base \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev

RUN mkdir -p /opt/node-markup
WORKDIR /opt/node-markup

COPY package.json .
RUN npm install
COPY . .

RUN ./run-tests.py || true
