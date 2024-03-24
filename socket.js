const { server, sessionMiddleWare } = require("./app");
const cron = require('node-cron');
const pool = require("./model/pool");
const redisClient = require("./model/redis");
const { generateRandomId } = require("./tools");
const { lastMsgCache, timerCache, chatRoomsCache, msgQueue, userCache, dmRoomMembersCache, groupMembersCache, zsetIncrAll, activeWorkoutCache, workoutCache } = require("./services/redisLoader");
const { DateTime } = require("luxon");
const { Server } = require('socket.io');


const io = new Server(server, {
  cors: {
    origin: ["https://localhost:3001", "https://localhost:3000", "http://localhost:3001", "http://localhost:3000", "https://super-meme-qx696prxr4j264qx-3001.app.github.dev", "https://super-meme-qx696prxr4j264qx-3000.app.github.dev", "http://localhost:3002"],
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
  socket.userId = session.user_id;
  const userId = session.user_id;


  if (userId) {
    (async() => {
      const now = Math.floor(new Date().getTime() / 1000);
      redisClient.hSet(`user:${userId}`, `ActiveWorkout`, `0:${now}`);
      socket.join(userId);
      const userInfo = await userCache(userId);
      if (!userInfo) return;
 
      const { friends } = userInfo;
      if (friends.length) {
        io.to(friends).emit(`studying:${userId}`, {id: '0'});
      };
    })();
  }




  socket.on('joinMyGroups', async () => {
    try {
      const chatRooms = await chatRoomsCache(userId);
      const chatRoomsId = chatRooms.map(chatRoom => {
        return `chat:${chatRoom.id}`;
      });
      socket.join(chatRoomsId);
    } catch (err) {
      console.log(err);
    };
  });


  socket.on('joinChatRoom', async (roomId) => {
    try {
      socket.join(`chat:${roomId}`);
    } catch (err) {
      console.log(err);
    }
  });


  socket.on('onlineMembers', () => {
    /* const onlineMembers = io.engine.clientsCount;
    io.emit() */
    /* const onlineMembers = Object.keys(socket.sockets).length;
    io.emit({success: true, totalLiveMembers: onlineMembers});
    console.log(onlineMembers); */
  });


  socket.on("disconnect", async (reason) => {
    const userInfo = await userCache(userId);


    if (!userInfo) {
      redisClient.hDel(`user:${userId}`, `ActiveWorkout`);
      return;
    };


    const { groups, friends } = userInfo;


    if (groups.length) {
      io.to(groups).emit(`stopStudying:${userId}`, 'disconnect');
    };
    if (friends.length) {
      io.to(friends).emit(`stopStudying:${userId}`, 'disconnect');
    };


    const activeWorkout = await activeWorkoutCache(userId);
    if (!activeWorkout) return;
    redisClient.hDel(`user:${userId}`, `ActiveWorkout`);


    const now = Math.floor(new Date().getTime() / 1000);
    /* const subjects = await subjectsCache(userId);
    const subject = subjects.find(subjectInfo => subjectInfo.id === subjectId); */
    const workoutId = activeWorkout.id;
    const workout = await workoutCache(userId, workoutId);


    if (!workout) return;


    const { datum_point, timeline_sum } = workout;


    const duration = now - datum_point - timeline_sum;
    workout.timeline_sum += duration;
    redisClient.hSet(`user:${userId}:workouts`, workoutId, JSON.stringify(workout));
    //redisClient.incrBy(`user:${userId}:dayTotal`, duration);
    //zsetIncrAll(`user:${userId}:dayTotal`, duration);


    const activity = JSON.parse(await redisClient.rPop(`user:${userId}:workout:${workoutId}`));


    if (activity) {
      const start = activity[0];
      redisClient.rPush(`user:${userId}:workout:${workoutId}`, `[${start},${duration}]`);
    };
    extensionIo.to(userId).emit("studying", { studying: false });
    //total timer update
    //this is unix time in sec of active subject's start
    /* const activeSubjectStart = activeSubject.time;
    const timerInfo = await timerCache(userId, now);
    const {dp, ts} = timerInfo;
    const timerStart = activeSubjectStart - dp - ts;
    const totalTimerDuration = now - dp - ts;
    timerInfo.ts += totalTimerDuration;
    redisClient.rPush(`user:${userId}:timer`, `[${timerStart},${totalTimerDuration}]`);
    redisClient.hSet(`user:${userId}`, 'timerInfo', JSON.stringify(timerInfo)); */
    for (let i = -12; i < 12; i++) {
      redisClient.zIncrBy(`user:${userId}:dayTotal`, duration, i.toString());
    };
  });


  //chat


  socket.on("sendMsg", async (roomId, msg) => {
    const isIn = await isInChatRoom(userId, roomId);
    if (isIn) {
      const msgId = generateRandomId(6);
      const time = Math.floor(new Date().getTime() / (1000 * 60));
      const msgInfo = { u: userId, m: msg, i: msgId, t: time };
      msgQueue(roomId, msgInfo);
      io.to(`chat:${roomId}`).emit('msgReceived', roomId, msgInfo);
      const now = Math.floor(new Date().getTime() / 1000 / 60);
      redisClient.hSet(`user:${userId}:chats`, roomId, `${msgId}:${now}`);
    };
  });


  //webcam
  socket.on("camOn", async () => {
    const userId = socket.userId;
    let userGroups = await redisClient.hGet(`user:${userId}`, 'groups');
    if (userGroups) {
      userGroups = userGroups.split(',');
      if (userGroups.length) {
        redisClient.hSet(`user:${userId}`, 'groups');
      }
    }
  });


  socket.on("start", async (workoutId) => {
    try {
      /* const subjects = await subjectsCache(userId);
      const groups = await groupCache(userId);
      const subject = subjects.find(subjectInfo => subjectInfo.id === subjectId); */
      const workout = await workoutCache(userId, workoutId);
      const userInfo = await userCache(userId);
      const now = Math.floor(new Date().getTime() / 1000);


      if (!workout || !userInfo) return;
      const { groups, friends } = userInfo;
      if (groups.length) {
        mainIo.to(groups).emit(`studying:${userId}`, workout);
      };
      if (friends.length) {
        io.to(friends).emit(`studying:${userId}`, workout);
      };
      const { timeline_sum, datum_point, id } = workout;
      const start = now - datum_point - timeline_sum;
      redisClient.rPush(`user:${userId}:workout:${id}`, `[${start},0]`);
      redisClient.hSet(`user:${userId}`, `ActiveWorkout`, `${id}:${now}`);
      workout.timeline_sum += start;
      redisClient.hSet(`user:${userId}:workouts`, id, JSON.stringify(workout));
      //total timer
      /* const timerInfo = await timerCache(userId, now);
      const {dp, ts} = timerInfo;
      const totalTimerStart = now - dp - ts;
      timerInfo.ts += totalTimerStart;
      redisClient.hSet(`user:${userId}`, 'timerInfo', JSON.stringify(timerInfo)); */
    } catch (err) {
      console.log(err);
    };
  });




  socket.on("stop", async (workoutId) => {
    const activeWorkout = await activeWorkoutCache(userId);
    const now = Math.floor(new Date().getTime() / 1000);
    /* const subjects = await subjectsCache(userId);
    const subject = subjects.find(subjectInfo => subjectInfo.id === subjectId); */
    const workout = await workoutCache(userId, workoutId);
    const userInfo = await userCache(userId);
    if (!userInfo || !workout || !activeWorkout || !activeWorkout.id === workoutId) return;




    const { groups, friends } = userInfo;


    if (groups.length) {
      io.to(groups).emit(`stopWorkout:${userId}`, 'rest');
    };
    if (friends.length) {
      io.to(friends).emit(`stopWorkout:${userId}`, 'rest');
    };
    const { datum_point, timeline_sum } = workout;


    const duration = now - datum_point - timeline_sum;
    workout.timeline_sum += duration;
    redisClient.hSet(`user:${userId}:workouts`, workoutId, JSON.stringify(workout));
    //redisClient.incrBy(`user:${userId}:dayTotal`, duration);
    //zsetIncrAll(`user:${userId}:dayTotal`, duration);


    const activity = JSON.parse(await redisClient.rPop(`user:${userId}:workout:${workoutId}`));


    if (activity) {
      const start = activity[0];
      redisClient.rPush(`user:${userId}:wokrout:${workoutId}`, `[${start},${duration}]`);
    };
    //total timer update
    //this is unix time in sec of active subject's start
    /* const activeSubjectStart = activeSubject.time;
    const timerInfo = await timerCache(userId, now);
    const {dp, ts} = timerInfo;
    const timerStart = activeSubjectStart - dp - ts;
    const totalTimerDuration = now - dp - ts;
    timerInfo.ts += totalTimerDuration;
    redisClient.rPush(`user:${userId}:timer`, `[${timerStart},${totalTimerDuration}]`);
    redisClient.hSet(`user:${userId}`, 'timerInfo', JSON.stringify(timerInfo)); */
    redisClient.hSet(`user:${userId}`, `ActiveWorkout`, `0:${now}`);
    for (let i = -12; i < 12; i++) {
      redisClient.zIncrBy(`user:${userId}:dayTotal`, duration, i.toString());
    };
  });


  socket.on("startDm", async (targetId) => {
    if (isUser(userId)) {


    } else { }
  });


  socket.on("changeGroup", async (groupId) => {
    const userInfo = await userCache(userId);
    if (!userInfo) return;
    const {groups, friends} = userInfo;


    if (!groups.includes(groupId)) return;
    groups.map(group => {
      if (group !== groupId) {
        socket.leave(group);
      };
    });
    socket.join(groupId);
    const now = DateTime.now().toSeconds().toFixed();
    redisClient.hSet(`user:${userId}`, `ActiveGroup`, JSON.stringify({ id: groupId, time: now }));
    if (!friends.length) return;
    const connection = pool.promise();
    const [[groupInfo]] = await connection.query("SELECT group_id, name, leader, visibility, explanation, date, members, max_members, tags, color, goal_hr, average_hr, likes, font FROM \`groups\` WHERE group_id = ?", [groupId]);
    if (!groupInfo) return;
    io.to(friends).emit(`activeGroup:${userId}`, { groupInfo, time: now });
  });


  socket.on('readMsg', async ({ roomId, type }) => {
    if (!roomId) return;
    //dm
    let members = [];
    if (!type) {
      members = await dmRoomMembersCache(roomId);
    } else {
      members = await groupMembersCache(roomId);
    };


    //user not member of the chatroom
    if (!members.includes(userId)) return;


    const [lastMsg] = await redisClient.lRange(`room:${roomId}:chats`, -1, -1);
    if (!lastMsg) return;
    //i ==  msg id
    const { i } = JSON.parse(lastMsg);
    const now = Math.floor(new Date().getTime() / 1000 / 60);
    redisClient.hSet(`user:${userId}:chats`, roomId, `${i}:${now}`);
  });


  socket.on('exitSession', async () => {
    deActiveGroup(userId, socket);
  });


  socket.on('disconnect', async () => {
    deActiveGroup(userId, socket);
  });
});


async function deActiveGroup(userId, socket) {
  const userInfo = await userCache(userId);
  if (!userInfo) return;
  const {groups, friends} = userInfo;
  groups.map(group => {
    socket.leave(group);
  });
  redisClient.hDel(`user:${userId}`, `ActiveGroup`);
  if (!friends.length) return;
  io.to(friends).emit(`deActiveGroup:${userId}`);
}


async function isUser(userId) {
  const connection = pool.promise();
  const [[userInfo]] = await connection.query(`SELECT user_id FROM users WHERE user_id = ?`, [userId]);
  return userInfo ? true : false;
};


async function isInChatRoom(userId, roomId) {
  try {
    const rooms = await chatRoomsCache(userId);
    const roomIndex = rooms.findIndex(room => { return room.id === roomId });
    return roomIndex === -1 ? false : true;
  } catch (err) {
    console.log(err);
  };
};


async function isInGroupRoom(userId, groupId, roomId) {
  try {
    let userGroups = await redisClient.hGet(`user:${userId}`, 'groups');
    if (!userGroups) {
      const connection = pool.promise();
      try {
        userGroups = await connection.query(`SELECT groups FROM users WHERE user_id = ?`, [userId]);
      } catch (err) {
        console.log(err);
      };
    };
    userGroups = userGroups.split(',');
    if (userGroups.includes(groupId)) {
      let rooms = await redisClient.sMembers(`group:${groupId}:rooms`);
      let roomInfo = rooms.find(room => {
        room = JSON.parse(room);
        return room.id === roomId;
      });
      if (roomInfo) {
        return true;
      }
    }
    return false;
  } catch (err) {
    console.log(err);
    return false;
  }
};


cron.schedule('*/10 * * * * *', () => {
  const onlineMembers = io.engine.clientsCount;
  io.emit('onlineMembers', onlineMembers);


  const allRooms = io.sockets.adapter.rooms;
  for (const [groupId, socketIdsSet] of allRooms) {
    const users = [];
    for (const socketId of socketIdsSet) {
      const socket = io.sockets.sockets.get(socketId);
      if (socket && socket.userId) {
        if (!users.includes(socket.userId)) {
          users.push(socket.userId);
        };
      }
    };
    io.to(groupId).emit('groupOnlineMembers', groupId, users);
  };
});


module.exports = { io, mainIo };