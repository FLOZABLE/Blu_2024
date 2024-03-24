const express = require("express");
const Router = express.Router();
const pool = require("../model/pool");
const redisClient = require("../model/redis");
const { mainIo } = require("../socket");
const { generateRandomId, isValidJSON, autoSignin } = require("../tools");
const { workoutsCache, workoutsTimelineCache } = require("../services/redisLoader");
const { validateString, validateHEX, validateStrictString, validateArray } = require("../validate");


Router.post("/add-workout", async (req, res) => {
  autoSignin(req, res, (async (userId) => {
    try {
      const { name, color, icon } = req.body;

      const isValidName = validateString(name, "workout name");

      if (!isValidName.isValid) {
        return res.send({ success: false, reason: isValidName.reason });
      };

      const isValidColor = validateHEX(color, 'Color');

      if (!isValidColor.isValid) {
        return res.send({ success: false, reason: isValidColor.reason });
      };

      const isValidIcon = validateStrictString(icon, "icon name");

      if (!isValidIcon.isValid) {
        return res.send({ success: false, reason: isValidIcon.reason });
      };

      const workoutInfo = {
        name,
        color,
        icon,
        datum_point: Math.floor(new Date().getTime() / 1000),
        timeline: JSON.stringify([0, 0]),
        id: generateRandomId(10),
        user_id: userId,
      };
      const connection = pool.promise();
      try {
        const insertWorkout = await connection.query(`INSERT INTO workouts SET ?`, workoutInfo);
        workoutInfo.tools = '';
        res.send({ success: true, msg: `Added Workout "${workoutInfo.name}"`, info: { workoutInfo: workoutInfo } });
        delete workoutInfo.timeline;
        delete workoutInfo.user_id;
        workoutInfo.timeline_sum = 0;
        workoutInfo.tools = '';
        redisClient.hSet(`user:${userId}:workouts`, workoutInfo.id, JSON.stringify(workoutInfo));
      } catch (err) {
        console.log(err);
      };
    } catch (error) {
      console.log(error);
    };
  }));
})


Router.post("/modify-workout", async (req, res) => {
  autoSignin(req, res, (async (userId) => {
    try {
      const { name, color, icon, id, tools } = req.body;

      const isValidName = validateString(name, "workout name");

      if (!isValidName.isValid) {
        return res.send({ success: false, reason: isValidName.reason });
      };

      const isValidColor = validateHEX(color, 'Color');


      if (!isValidColor.isValid) {
        return res.send({ success: false, reason: isValidColor.reason });
      };

      const isValidIcon = validateStrictString(icon, "icon name");

      if (!isValidIcon.isValid) {
        return res.send({ success: false, reason: isValidIcon.reason });
      };

      const isValidId = validateStrictString(id, "workout id", 10, 10);

      if (!isValidId.isValid) {
        return res.send({ success: false, reason: isValidId.reason });
      };

      const isValidTools = validateArray(tools, "tools", 10, 0);

      if (!isValidTools.isValid) {
        return res.send({ success: false, reason: isValidTools.reason });
      };

      const workoutInfo = {
        name,
        color,
        icon,
        id,
        tools: tools.join(",")
      };

      const connection = pool.promise();
      try {
        const updateWorkout = await connection.query("UPDATE workouts SET ? WHERE id = ? AND user_id = ?", [workoutInfo, id, userId]);
        res.send({ success: true, msg: `Modified Workout "${name}"`, workoutInfo: workoutInfo });


        const previousWorkout = JSON.parse(await redisClient.hGet(`user:${userId}:workouts`, workoutInfo.id));
        previousWorkout.name = workoutInfo.name;
        previousWorkout.icon = workoutInfo.icon;
        previousWorkout.color = workoutInfo.color;
        previousWorkout.tools = workoutInfo.tools;
        redisClient.hSet(`user:${userId}:workouts`, workoutInfo.id, JSON.stringify(previousWorkout));
        mainIo.to(userId).emit('update tools', userId);
      } catch (err) {
        console.log(err);
      };
    } catch (error) {
      console.log(error);
    };
  }));
});


Router.post("/start", async (req, res) => {
  autoSignin(req, res, (async () => {
    const userId = req.session.user_id;
    const workoutId = req.body.workoutId;
    const userInfo = await redisClient.hGetAll(`user:${userId}`);


    Object.keys(userInfo).forEach(async (info) => {
      if (info.includes('workout:')) {
        const infoWorkoutId = info.split(':')[1];
        if (infoWorkoutId === workoutId) {
          const workoutInfo = JSON.parse(userInfo[info]);
          const now = Math.floor(new Date().getTime() / 1000);
          const start = now - workoutInfo.datum_point;
          const push = await redisClient.rPush(`user:${userId}:workout:${workoutId}`, `[${start},${start}]`);
          redisClient.hSet(`user:${userId}`, `activeWorkout`, JSON.stringify(workoutInfo));
          const prevTimer = await redisClient.hGet(`user:${userId}`, 'timerInfo');
          if (prevTimer) {
            const newTimer = JSON.parse(prevTimer);
            const datum = newTimer.datum;
            //remove old timeline
            const MAXSTORELEN = 24 * 60 * 60;
            const lastVal = newTimer.timeline[newTimer.timeline.length - 1];
            const missingTotal = Math.floor((lastVal ? lastVal[1] : 0) / (MAXSTORELEN * 2));
            const newDatum = datum + missingTotal * MAXSTORELEN;
            const start = now - newDatum;

            if (missingTotal) {
              newTimer.timeline.map(([start, stop]) => {
                const newStart = start - missingTotal * MAXSTORELEN;
                const newStop = stop - missingTotal * MAXSTORELEN;
                if (newStart >= 0 && newStop >= 0) {
                  return [newStart, newStop];
                };
              });
            };
            newTimer.timeline.push([start, start]);
            newTimer.datum = newDatum;
            newTimer.workout = 1;
            redisClient.hSet(`user:${userId}`, 'timerInfo', JSON.stringify(newTimer));
          } else {
            const newTimer = { datum: now, timeline: [[0, 0]], workout: 1 };
            redisClient.hSet(`user:${userId}`, 'timerInfo', JSON.stringify(newTimer));
          };
          const groups = userInfo.groups.split(',');
          if (groups.length) {
            /* groups.map(group => {
              const socketsInRoom = io.sockets.in(group).sockets;
              console.log(group)
              // Iterate through the sockets and access socket properties
              for (const socketId in socketsInRoom) {
                const socket = socketsInRoom[socketId];
                console.log(`Socket ID: ${socket.id}, User ID: ${socket.userId}`);
              }
            }) */
            mainIo.to(groups).emit('reset', userId, groups);
          }
        };
      };
    });
    res.send({ success: false, msg: 'Timer Started!' });
  }));
});




Router.post("/stop", async (req, res) => {
  autoSignin(req, res, (async () => {
    const userId = req.session.user_id;
    const workoutId = req.body.workoutId;
    const groups = (await redisClient.hGet(`user:${userId}`, "groups")).split(',');
    const activeWorkout = JSON.parse(await redisClient.hGet(`user:${userId}`, 'activeWorkout'));
    if (activeWorkout.id === workoutId) {
      const activity = JSON.parse(await redisClient.rPop(`user:${userId}:workout:${workoutId}`));
      const now = Math.floor(new Date().getTime() / 1000);
      const start = activity[0];
      const stop = now - activeWorkout.datum_point;
      redisClient.rPush(`user:${userId}:workout:${workoutId}`, `[${start},${stop}]`);
      redisClient.hSet(`user:${userId}`, `activeWorkout`, '0');
      if (groups.length) {
        mainIo.to(groups).emit('stopWorkout', userId, groups);
      };
      const timerInfo = await redisClient.hGet(`user:${userId}`, 'timerInfo');
      if (timerInfo) {
        const newTimer = JSON.parse(timerInfo);
        const lastActivity = newTimer.timeline.pop();
        lastActivity[1] = now - newTimer.datum;
        newTimer.timeline.push(lastActivity);
        newTimer.workout = 0;
        redisClient.hSet(`user:${userId}`, 'timerInfo', JSON.stringify(newTimer));
      };
    };
    res.send({ success: true, msg: 'Timer Stopped!' });
  }));
});


Router.post('/bring-workouts', async (req, res) => {
  autoSignin(req, res, (async (userId) => {
    try {
      const searchId = req.body.searchId ? req.body.searchId : userId;

      const workoutsInfo = await workoutsTimelineCache(searchId);
      res.send({ success: true, workouts: workoutsInfo });
    } catch (err) {
      console.log(err);
    }
  }));
});


module.exports = Router;



