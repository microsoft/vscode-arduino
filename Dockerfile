# Use the official Node.js 16 base image
FROM node:16-alpine3.15

# needs to be alpine 3.15 to get python 2.7 and python 3.10 — 3.11 does not work with node-gyp
RUN apk add curl python2 python3 make build-base eudev-dev

RUN mkdir -p /app/assets && chmod 777 /app && chmod 777 /app/assets

WORKDIR /app

# Copy the application code to the working directory
COPY ./src /app/src
COPY ./package*.json /app/
COPY ./build /app/build

# Install dependencies
RUN npm install

COPY ./images /app/images
COPY ./misc /app/misc
COPY ./snippets /app/snippets
COPY ./syntaxes /app/syntaxes
COPY ./typings /app/typings
COPY gulpfile.js /app/
COPY tsconfig.json /app/
COPY webpack.config.js /app/
COPY cgmanifest.json /app/
COPY .vscodeignore /app/
COPY LICENSE.txt /app/

RUN mkdir -p /app/out

RUN npm run package



