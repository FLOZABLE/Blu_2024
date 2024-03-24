const express = require('express');
const app = express();
const dotenv = require('dotenv');
const http = require('http');
const logger = require('morgan');
const connectRedis = require('connect-redis');
const cookieParser = require('cookie-parser');
const server  = http.createServer(app);
const session = require("express-session");

if (process.env.NODE_ENV === 'development') {
  dotenv.config({ path: '.env.development' });
} else if (process.env.NODE_ENV === 'production') {
  dotenv.config({ path: '.env.production' });
} else {
  dotenv.config({ path: '.env.test' });
}

const RedisStore = connectRedis.default;
const redisClient = require("./model/redis");
redisClient.connect().catch(console.error);

const redisStore = new RedisStore({ client: redisClient, ttl: 60 * 60 * 24 * 3 });
const sessionMiddleWare = session({
  store: redisStore,
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false,
    httpOnly: true,
    signed: true,
  },
});

module.exports = { server, sessionMiddleWare };

const { io } = require("./socket");
app.set('socketio', io);
app.use(logger('dev'));
app.use(cookieParser(process.env.SECRET_ID));
app.use(sessionMiddleWare);

console.log(process.env.NODE_ENV)
server.listen(process.env.PORT, process.env.IP, () => {
  console.log(`Server running ${process.env.PORT} ${process.env.IP}`);
});