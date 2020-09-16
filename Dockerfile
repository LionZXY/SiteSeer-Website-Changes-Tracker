FROM node:latest

RUN mkdir /app
WORKDIR /app
COPY . /app/

RUN npm i

CMD npm start