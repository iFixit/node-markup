FROM fedora:32

RUN mkdir -p /opt/node-markup
WORKDIR /opt/node-markup

RUN curl -sL -o node.rpm https://rpm.nodesource.com/pub_6.x/fc/26/x86_64/nodesource-release-fc26-1.noarch.rpm \
 && rpm -ivh node.rpm \
 && dnf remove -y nodejs npm || true \
 && dnf install -y nodejs

RUN npm config set umask 002 \
 && npm config set unsafe-perm true \
 && npm install -g npm@6.13.7 strip-ansi@3.0.1 && npm version

RUN npm build /usr/lib/node_modules/*

RUN dnf -y install \
 python \
 GraphicsMagick \
 gcc-c++ \
 perl-Digest-SHA \
 cairo cairo-devel \
 cairomm-devel libjpeg-turbo-devel pango pango-devel pangomm pangomm-devel giflib-devel \
 git make which

RUN npm install -g --verbose node-gyp

COPY package.json .
RUN npm install
COPY . .

RUN ./run-tests.py
