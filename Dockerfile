FROM node:22

WORKDIR /app
COPY package.json .
COPY package-lock.json .
COPY botica-lib-node-1.0.0.tgz .

RUN npm install
COPY . .

CMD [ "npm", "start" ]
