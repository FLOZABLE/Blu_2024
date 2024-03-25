const express = require('express');
const app = express();
const dotenv = require('dotenv');
const http = require('http');
const logger = require('morgan');
const connectRedis = require('connect-redis');
const cookieParser = require('cookie-parser');
const server = http.createServer(app);
const cors = require("cors");
const bodyParser = require("body-parser");
const session = require("express-session");
const path = require("path");

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
  secret: process.env.SECRET_ID,
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false,
    httpOnly: true,
    signed: true,
  },
});

app.use(sessionMiddleWare);

//Router
//const mainRouter = require("./Router/main");

//API

module.exports = { server, sessionMiddleWare };

const accountAPI = require("./API/account");
const chatAPI = require("./API/chat");
const friendsAPI = require("./API/friends");
const groupsAPI = require("./API/groups");
const planAPI = require("./API/plan");
const videosAPI = require("./API/videos");
const workoutAPI = require("./API/workout");
const rankingAPI = require("./API/ranking")
const botAPI = require("./API/ai");

//app.use(logger('dev'));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
const { io } = require("./socket");
app.set('socketio', io);
app.use(cookieParser(process.env.SECRET_ID));
app.use(cors());


app.use('/account', accountAPI);
app.use("/chat", chatAPI);
app.use("/friend", friendsAPI);
app.use("/groups", groupsAPI);
app.use("/plan", planAPI);
app.use("/videos", videosAPI);
app.use("/workout", workoutAPI);
app.use("/ranking", rankingAPI);
app.use("/ai", botAPI);

app.get('/dashboard*', (req, res) => {
  res.sendFile(path.join(__dirname, process.env.BUILD, 'index.html'));
});

app.use((req, res, next) => {
  if (!req.path.startsWith('/profile-images')) { next(); return };
  const defaultImagePath = path.join(__dirname, 'public', '/img/default_profile.jpg');
  return res.sendFile(defaultImagePath);
});

app.get('*', function (req, res) {
  res.redirect('/');
});

server.listen(process.env.PORT, process.env.IP, () => {
  console.log(`Server running ${process.env.PORT} ${process.env.IP}`);
});