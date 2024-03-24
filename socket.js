const { server, sessionMiddleWare } = require("./app");
const pool = require("./model/pool");
const redisClient = require("./model/redis");
const { DateTime } = require("luxon");
const { Server } = require('socket.io');
const { generateRandomId } = require("./tools");

const io = new Server(server, {
  cors: {
    origin: ["https://localhost:3001", "https://localhost:3000", "http://localhost:3001", "http://localhost:3000"],
    credentials: true,
    methods: ["GET", "POST"],
  },
  allowEIO3: true
});

const wrap = middleware => (socket, next) => middleware(socket.request, {}, next);

io.use(wrap(sessionMiddleWare));

const mainIo = io.of('/');
mainIo.on('connection', (socket) => {
  let session;

  if (process.env.NODE_ENV === "production" || process.env.NODE_ENV === "test") {
    try {
      session = socket.request.session;
    } catch (err) {
      console.log(err);
    };
  } else {
    session = {
      cookie: {
        path: '/',
        _expires: null,
        originalMaxAge: null,
        httpOnly: true,
        secure: false
      },
      user_id: 'EoFObpf612',
      name: 't1',
      loggedin: true,
      userInfo: {
        userId: 'EoFObpf612',
        name: 't1',
        loggedin: true,
        email: 't1@t.t',
        myinfo: null,
        timeZone: 'America/Los_Angeles'
      }
    };
  };

  const userId = session.user_id;
  console.log('socket connected')

  socket.on('disconnect', async () => {
    console.log('disconnection')
  });
});

module.exports = { io, mainIo };