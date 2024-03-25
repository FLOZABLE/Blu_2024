const redisClient = require("../model/redis");
const pool = require('../model/pool');
const { writeLog } = require('../Logger');
//const { UserRefreshClient } = require("google-auth-library");


const USER_EXP = 60 * 60 * 3;
const USER_EXP_PLUS = 60 * 60;
const USER_EXP_DIS = 60 * 60;


async function flushRedis() {
  await redisClient.flushDb();
};


function cacheManager() {
  //console.log('d');
};


async function groupCache(userId) {
  try {
    let groups = await redisClient.hGet(`user:${userId}`, 'groups');
    if (!groups) {
      const connection = pool.promise();
      try {
        const [[userInfo]] = await connection.query(`SELECT groups FROM users WHERE user_id = ?`, [userId]);
        groups = userInfo ? userInfo.groups : "";
      } catch (err) {
        console.log(err);
      };
    };
    groups = groups.split(',');
    return groups;
  } catch (err) {
    console.log(err);
  };
};


async function workoutsCache(userId) {
  try {
    const isCached = await redisClient.exists(`user:${userId}:workouts`);
    if (isCached) {
      const workoutsObj = { ...await redisClient.hGetAll(`user:${userId}:workouts`) };
      const workoutArr = Object.keys(workoutsObj).map((id) => {
        return { ...JSON.parse(workoutsObj[id]), id };
      });
      return workoutArr;
    } else {
      try {
        const connection = pool.promise();
        const [workouts] = await connection.query(`SELECT id, name, icon, tools, color, datum_point, timeline_sum FROM workouts where user_id = ?`, [userId]);
        workouts.map(async (workout) => {
          const redisWorkout = { ...workout };
          delete redisWorkout.id;
          redisClient.hSet(`user:${userId}:workouts`, workout.id, JSON.stringify(redisWorkout));
        });
        return workouts;
      } catch (err) {
        console.log(err);
      };
    };
  } catch (err) {
    console.log(err);
  }
};


async function workoutCache(userId, workoutId) {
  try {
    const isCached = await redisClient.hExists(`user:${userId}:workouts`, workoutId);
    if (isCached) {
      const workoutInfo = await redisClient.hGet(`user:${userId}:workouts`, workoutId);
      return { ...JSON.parse(workoutInfo), id: workoutId };
    } else {
      try {
        const connection = pool.promise();
        const [workouts] = await connection.query(`SELECT id, name, icon, color, tools, datum_point, timeline_sum FROM workouts where user_id = ?`, [userId]);
        workouts.map(async (workout) => {
          const redisWorkout = { ...workout };
          delete redisWorkout.id;
          redisClient.hSet(`user:${userId}:workout`, workout.id, JSON.stringify(redisWorkout));
        });
        const workout = workouts.find(workout => workout.id === workoutId);
        if (workout) return workout;
        return false;
      } catch (err) {
        console.log(err);
        return false;
      };
    };
  } catch (err) {
    console.log(err);
    return false;
  }
};


async function dmRoomsCache(userId) { //Change later
  let dmRooms = await redisClient.hGet(`user:${userId}`, 'dmRooms');
  if (!dmRooms) {
    const connection = pool.promise();
    [dmRooms] = await connection.query(`SELECT id FROM chatrooms WHERE members LIKE ?`, [`%${userId}%`]);
    dmRooms = dmRooms.map(dmRoom => {
      return dmRoom.id;
    });
    redisClient.hSet(`user:${userId}`, 'dmRooms', JSON.stringify(dmRooms));
  } else {
    dmRooms = JSON.parse(dmRooms);
  };


  return dmRooms;
};


async function dmRoomMembersCache(id) {
  try {
    const members = await redisClient.sMembers(`room:${id}`);
    if (members.length) return members;
    const connection = pool.promise();
    const [[dmRoom]] = await connection.query(`SELECT members FROM chatrooms WHERE id = ?`, [id]);
    if (dmRoom && dmRoom.members !== "") {
      dmRoom.members = dmRoom.members.split(",");
      redisClient.sAdd(`room:${id}`, dmRoom.members);
      return dmRoom.members;
    }
    return [];
  } catch (err) {
    console.log(err);
    return [];
  };
};


async function groupMembersCache(id) {
  try {
    const members = await redisClient.sMembers(`room:${id}`);
    if (members.length) return members;
    const connection = pool.promise();
    const [[group]] = await connection.query(`SELECT members FROM groups WHERE group_id = ?`, [id]);
    if (group && group.members !== "") {
      group.members = group.members.split(",");
      redisClient.sAdd(`room:${id}`, group.members);
      return group.members;
    }
    return [];
  } catch (err) {
    console.log(err);
    return [];
  };
}




async function chatRoomsCache(userId) {
  try {
    let dmRooms = await dmRoomsCache(userId);
    const groups = await groupCache(userId);
    const groupRooms = groups.map(group => {
      return { id: group, type: 0, members: [] };
    });
    const dmRoomPromises = dmRooms.map(async (dmRoom) => {
      const members = await dmRoomMembersCache(dmRoom);
      const membersInfo = []
      await Promise.all(members.map(async(member) => {
        member = await userCache(member);
        if (member) {
          membersInfo.push(member);
        };
      }));
      return { id: dmRoom, members: membersInfo, type: 1 };
    });
    const dmRoomsInfo = await Promise.all(dmRoomPromises);
    const rooms = groupRooms.concat(dmRoomsInfo);
    return rooms;
  } catch (err) {
    console.log(err);
    return [];
  };
};


//only last 100 msg will be stored inside the redis queue for each groups
const MAX_QUEUE_LENGTH = 100;
async function msgQueue(roomId, msgInfo) {
  redisClient.rPush(`room:${roomId}:chats`, JSON.stringify(msgInfo));
  const queueLength = await redisClient.lLen(`room:${roomId}:chats`);
  if (queueLength >= MAX_QUEUE_LENGTH) {
    const fistMsg = await redisClient.lPop(`room:${roomId}:chats`);
    const connection = pool.promise();
    connection.query(
      `UPDATE chatrooms SET \`chats\` = CASE
        WHEN \`chats\` = '' THEN ?
        ELSE CONCAT(\`chats\`, ',', ?)
        END
        WHERE id = ?`,
      [fistMsg, fistMsg, roomId]
    );
  };
};


/**
 * rest: id = 0
 * offline: null/undefined
 * @param {string} userId
 * @returns
 *
 */
async function activeWorkoutCache(userId) {
  try {
    let activeWorkout = await redisClient.hGet(`user:${userId}`, `activeWorkout`);
    activeWorkout = activeWorkout ? { id: activeWorkout.split(':')[0], time: activeWorkout.split(':')[1] } : false;
    return activeWorkout;
  } catch (err) {
    console.log(err);
  }
};


async function activeGroupCache(userId) {
  try {
    const isCached = await redisClient.hExists(`user:${userId}`, `ActiveGroup`);
    if (isCached) {
      const activeGroup = await redisClient.hGet(`user:${userId}`, `ActiveGroup`);
      return activeGroup;
    } else {
      return false;
    };
  } catch (err) {
    console.log(err);
    return false;
  };
  ;
}


/**return timer information of the user.
 * return type is object
 * dp(datumpoint), ts(timeline sum)
 */
async function timerCache(userId, now = Math.floor(new Date().getTime() / 1000), ts = 0) {
  try {
    const isCached = await redisClient
    let timer = await redisClient.hGet(`user:${userId}`, 'timerInfo');


    if (timer) {
      timer = JSON.parse(timer);
    } else {
      timer = { dp: now, ts };
      await redisClient.hSet(`user:${userId}`, 'timerInfo', JSON.stringify(timer));
    };


    return timer;
  } catch (err) {


  }
};


async function usersCache(userId) {
  try {
    let isIn = await redisClient.sIsMember(`allMembers`, userId);
    if (!isIn) {
      const connection = pool.promise();
      const [[userInfo]] = await connection.query(`SELECT user_id FROM users WHERE user_id = ?`, [userId]);
      if (userInfo) {
        redisClient.sAdd(`allMembers`, userId);
        isIn = true;
      };
    };
    return isIn;
  } catch (err) {


  }
}


async function userCache(userId) {
  try {
    const isCached = await redisClient.hExists(`user:${userId}`, 'name');
    if (isCached) {
      const userInfo = await redisClient.hGetAll(`user:${userId}`);
      userInfo.groups = userInfo.groups === "" ? [] : userInfo.groups.split(",");
      userInfo.friends = userInfo.friends === "" ? [] : userInfo.friends.split(",");
      return {...userInfo, user_id: userId};
    } else {
      const connection = pool.promise();
      const [[userInfo]] = await connection.query("SELECT name, email, groups, friends, timezone, datum_point FROM users WHERE user_id = ?", [userId]);
      if (userInfo) {
        const { name, email, timezone, datum_point } = userInfo;
        redisClient.hSet(`user:${userId}`, 'name', name);
        redisClient.hSet(`user:${userId}`, 'email', email);
        redisClient.hSet(`user:${userId}`, 'groups', userInfo.groups);
        redisClient.hSet(`user:${userId}`, 'friends', userInfo.friends);
        redisClient.hSet(`user:${userId}`, 'timezone', timezone);
        redisClient.hSet(`user:${userId}`, 'datum_point', datum_point);
        redisClient.expire(`user:${userId}`, 60 * 60 * 10);
        userInfo.groups = userInfo.groups === "" ? [] : userInfo.groups.split(",");
        userInfo.friends = userInfo.friends === "" ? [] : userInfo.friends.split(",");
        return { ...userInfo, user_id: userId };
      } else {
        return false;
      }
    };
  } catch (err) {
    console.log(err);
  }
}


/**
 * notification's key:
 * i: id
 * t: type ex) -1 = all (default),  0 = friend-request, 1 = friend-request-accept, 2 = face-off-request, 3 = face-off-accept, 4 = dm request, 5 = dm accepted, 6 = group-invitation,
 * -2 = ongoing friend req
 * d: date (unix but divided by 1000 * 60 because we  need minute accuracy)
 * optional:
 * f: from (used for friend-request, friend-accept, group invitation)
 * @param {*} userId
 * @param {*} type
 * @returns {[]} selectedNotifications
 */
async function NotificationCache(userId, type = -1, processData = true) {
  const notifications = (await redisClient.sMembers(`user:${userId}:notifications`)).map(JSON.parse);
  await Promise.all(notifications.map(async (notification) => {
    if (notification.f && processData) {
      notification.f = await userCache(notification.f);
    };
  }));
  if (type === -1) {
    return notifications;
  };
  const selectedNotifications = notifications.filter(notification => { return notification.t === type });
  return selectedNotifications;
};


async function workoutsTimelineCache(userId) {
  const workoutsInfo = await workoutsCache(userId);
  const connection = pool.promise();
  const [workoutTimelines] = await connection.query(`SELECT timeline, id FROM workouts WHERE user_id = ?`, [userId]);
  const workoutPromises = workoutsInfo.map(async (workout) => {
    const { id } = workout;
    const prevTimeline = workoutTimelines.find(sub => {
      return sub.id === id;
    });


    const todayTimeline = (await redisClient.lRange(`user:${userId}:workout:${id}`, 0, -1)).map(JSON.parse);
    if (prevTimeline) {
      const parsedTimeline = prevTimeline.timeline ? JSON.parse(prevTimeline.timeline.replace(/^/, "[").replace(/$/, "]")) : []; //wrapping the string with "[]"
      workout.timeline = parsedTimeline.concat(todayTimeline);
    } else {
      workout.timeline = todayTimeline;
    };
   
    return workout;
  });


  const workouts = await Promise.all(workoutPromises);
  //console.log(workouts);
  return workouts;
};


async function groupInfoCache(groupId) {
  const isCached = await redisClient.exists(`group:${groupId}`);
  if (isCached) {
    const groupInfo = await redisClient.hGetAll(`group:${groupId}`);
  } else {
    const connection = pool.promise();
    const [[groupInfo]] = await connection.query("SELECT group_id, name, leader, visibility, explanation, date, members, max_members, tags, color, goal_hr, average_hr, likes, font FROM \`groups\` WHERE group_id = ?", [groupId]);
    const {group_id, name, leader, visibility, explanation, date, members} = groupInfo;
    redisClient.sMembers(`group:${groupId}`, members);
  }
}


async function msgReadCache(userId) {
  let readStatus = {...await redisClient.hGetAll(`user:${userId}:chats`)};
  readStatus = Object.keys(readStatus).map((id) => {
    //return { ...JSON.parse(readStatus[id]), id };
    const [msgId, time] = readStatus[id].split(':');
    return {msgId, time, id};
  });
  return readStatus;
}


async function websiteUsageCache(userId) {
  const websitesUsage = await redisClient.zRangeWithScores(`user:${userId}:tabs:usage`, 0, -1);
  const websitesTimer = await redisClient.zRangeWithScores(`user:${userId}:tabs:timer`, 0, -1);
  //console.log(websitesUsage, websitesTimer);
  const websiteData = websitesTimer.map(({value, score}) => {
    let v = 0;
    const websiteUsage = websitesUsage.find(website => {return website.value === value});
    if (websiteUsage) {
      v = websiteUsage.score;
    }
    return {d: value, t: score, v};
  });


  return websiteData;
};


async function zsetIncrAll(key, val = 1) {
  const members = await redisClient.zRange(key, 0, -1);
  members.map(async(member) => {
    redisClient.zIncrBy(key, val, member);
  });
};


module.exports = {
  flushRedis,
  cacheManager,
  groupCache,
  workoutsCache,
  workoutCache,
  activeWorkoutCache,
  timerCache,
  NotificationCache,
  chatRoomsCache,
  dmRoomMembersCache,
  groupMembersCache,
  msgQueue,
  usersCache,
  dmRoomsCache,
  userCache,
  workoutsTimelineCache,
  activeGroupCache,
  msgReadCache,
  websiteUsageCache,
  zsetIncrAll
}



