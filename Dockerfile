FROM node:10
ENV NPM_CONFIG_LOGLEVEL info

WORKDIR /app
ADD ./lib /app/lib
ADD ./bin /app/bin
ADD package-lock.json /app
ADD package.json /app

RUN chmod +x ./bin/runsauce.js
RUN npm install

ENTRYPOINT ["/app/bin/runsauce.js"]
