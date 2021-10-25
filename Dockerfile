FROM node:fermium

WORKDIR /app

COPY build build
RUN npm install -g serve

EXPOSE 80

CMD [ "serve", "-s", "build" ]
