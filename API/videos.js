const express = require("express");
const Router = express.Router();
const redisClient = require("../model/redis");
const { autoSignin, generateRandomId, isValidJSON } = require("../tools");
const pool = require("../model/pool");
const { DateTime } = require("luxon");
const { validateStrictString, validateLength, validateString, validateBoolean, validateInteger, validateURL } = require("../validate");
const { mainIo } = require("../socket");


Router.get('/', async (req, res) => {
  try {
    const connection = pool.promise();
    const [videos] = await connection.query(`SELECT * FROM videos`);
    await Promise.all(videos.map(async (video) => {
      //const weekUsage = await redisClient.zmScore(`video:${video.id}:weekUsage`, ['0', '1', '2', '3', '4', '5', '6']);
      weekUsage = [1, 1, 1, 1, 1, 1, 1];
      video.weekUsage = 0;
      await Promise.all(weekUsage.map(dayTotal => {
        if (!dayTotal) return;
        video.weekUsage += dayTotal;
      }));
    }));
    return res.send({ success: true, videos });
  } catch (err) {
    console.log(err);
    res.send({ success: false });
  }
});


Router.get('/user', async (req, res) => {
  autoSignin(req, res, (async (userId) => {
    try {
      const connection = pool.promise();
      const [[videos]] = await connection.query("SELECT videos from users where user_id = ?", [userId]);
      return res.send({ success: true, videos });
    } catch (err) {
      console.log(err);
      res.send({ success: false });
    }
  }));
})


Router.get('/videoIds', async (req, res) => {
  autoSignin(req, res, (async () => {
    try {
      const connection = pool.promise();
      const { searchIds } = req.query;

      const isValidSearchIds = validateString(searchIds, "search ids", 200);

      if (!isValidSearchIds.isValid) {
        return res.send({ success: false, reason: isValidSearchIds.reason });
      };

      const [info] = await connection.query("SELECT video_id, name, id FROM videos WHERE id IN (?)", [searchIds.split(",")]);
      return res.send({ success: true, info });
    } catch (err) {
      console.log(err);
      res.send({ success: false });
    }
  }));
})


Router.post('/create', async (req, res) => {
  autoSignin(req, res, (async () => {
    try {
      const userId = req.session.user_id;
      const { name, tags, description, url } = req.body;
      if (!name || name.length >= 40) return res.send({ success: false, reason: 'Invalid name' });
      if (!description) return res.send({ success: false, reason: 'No description' })
      if (!url) return res.send({ success: false, reason: 'no url ' });


      const isValidName = validateString(name, 'video name');


      if (!isValidName.isValid) {
        return res.send({ success: false, reason: isValidName.reason });
      };

      const isValidDescription = validateString(description, 'video description', 500);

      if (!isValidDescription.isValid) {
        return res.send({ success: false, reason: isValidDescription.reason });
      };

      const isValidURL = validateURL(url);

      if (!isValidURL.isValid) {
        return res.send({ success: false, reason: isValidURL.reason });
      };

      const videoId = new URLSearchParams(new URL(url).search).get("v");
      if (!videoId) return res.send({ success: false, reason: 'Invalid URL' });
      const connection = pool.promise();
      const id = generateRandomId(10);
      const videoInfo = { id, name, description, video_id: videoId, tags: tags.join(','), user_id: userId };
      connection.query(`INSERT INTO videos SET ?`, videoInfo);
      res.send({ success: true, msg: 'New video uploaded!', videoInfo: { ...videoInfo, likes: '' } });
    } catch (error) {
      console.log(error)
      res.send({ success: false, reason: 'An Error Occured' });
    }
  }));
});


Router.post('/like/:id', async (req, res) => {
  autoSignin(req, res, (async () => {
    const videoId = req.params.id;
    const userId = req.session.user_id;
    const { liked } = req.body;

    const isValidLiked = validateBoolean(liked, 'liked', true);

    if (!isValidLiked.isValid) {
      return res.send({ success: false, reason: isValidLiked.reason });
    };

    const isValidVideoId = validateStrictString(videoId, 'video id');

    if (!isValidVideoId.isValid) {
      return res.send({ success: false, reason: isValidVideoId.reason });
    };


    try {
      const connection = pool.promise();
      if (liked) {
        /* const [[{ verified }]] = await connection.query(`SELECT verified FROM users WHERE user_id = ?`, [userId]);
        if (!verified) {
          //return res.send({ success: false, reason: "Please verify your email" });
        } */
        const [update] = await connection.query(
          `UPDATE videos
          SET likes = CASE
            WHEN likes = '' THEN ?
            ELSE CONCAT(likes, ',', ?)
            END WHERE id = ?`,
          [userId, userId, videoId]
        );
        mainIo.emit(`liked:${videoId}`, userId);
      } else {
        const [update] = await connection.query(
          `UPDATE videos
          SET likes =
            TRIM(BOTH ',' FROM REPLACE(CONCAT(',', likes, ','), ',${userId},', ','))
            WHERE id = ?`,
          [videoId]
        );
        mainIo.emit(`unliked:${videoId}`, userId);
      };
      res.send({ success: true });
    } catch (err) {
      console.error('Error performing database queries:', err);
      res.status(500).send({ success: false, reason: 'An error occurred' });
    };
  }));
});


Router.post('/save', async (req, res) => {
  autoSignin(req, res, (async () => {
    try {
      const userId = req.session.user_id;
      const { videoId, category } = req.body;

      const isValidCategory = validateInteger(category, 'category', 10, -1);

      if (!isValidCategory.isValid) {
        return res.send({ success: false, reason: isValidCategory.reason });
      };

      const isValidVideoId = validateStrictString(videoId, 'video id');


      if (!isValidVideoId.isValid) {
        return res.send({ success: false, reason: isValidVideoId.reason });
      };

      const videoInfo = `${category}:${videoId}`;
      const connection = pool.promise();
      const [[userInfo]] = await connection.query(`SELECT videos from users WHERE user_id = ?`, [userId]);


      const videos = userInfo.videos === "" ? [] : userInfo.videos.split(",");
      const oldVideoIndex = videos.findIndex(video => video.includes(videoId));
      if (oldVideoIndex !== -1) {
        videos.splice(oldVideoIndex, 1);
      };
      videos.push(videoInfo);
      await connection.query(`UPDATE users SET videos = ? WHERE user_id = ?`, [videos.join(','), userId]);


      const weekDay = DateTime.now().weekday - 1;
      redisClient.zIncrBy(`video:${videoId}:weekUsage`, 1, weekDay.toString());
      mainIo.emit(`used:${videoId}`);
      res.send({ success: true, msg: 'Video Saved' });
    } catch (error) {
      console.log(error)
      res.send({ success: false, reason: 'An Error Occured' });
    }
  }));
});


module.exports = Router;



