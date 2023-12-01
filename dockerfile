FROM node:lts-alpine3.17

WORKDIR /app

# copy source code into container
COPY . .

# install dependencies
RUN npm install

CMD ["npm", "start"]