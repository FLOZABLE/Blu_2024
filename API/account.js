const express = require('express');
const Router = express.Router();
const pool = require("../model/pool");
const redisClient = require("../model/redis");
const crypto = require("crypto");
const sharp = require('sharp');
const multer = require('multer');
const webpush = require("web-push");
const { DateTime } = require('luxon');
const { hashing, autoSignin, generateRandomId, isValidTimeZone, deriveKey, randomIntInRange } = require("../tools");
const { validateEmail, validateStrictString, validatePassword, validateURL, validateString, validateLength } = require("../validate");
const { NotificationCache, usersCache, userCache, subjectsTimelineCache } = require('../services/redisLoader');
const { responseCodes } = require('../Constant');
const upload = multer();


Router.get('/accountinfo', async (req, res) => {
  autoSignin(req, res, (async (userId) => {
    const notifications = await NotificationCache(userId);
    const userInfo = await userCache(userId);
    if (!userInfo) {
      return res.send(responseCodes['no-user']);
    };
    console.log(userInfo, 'userInfo')
    req.session.timezone = userInfo.timezone;
    usersCache(userId);
    res.send({ success: true, userInfo: userInfo, notifications: notifications });
  }
  ), () => {
    res.send(responseCodes['no-user']);
  }
  );
});


Router.get('/activity-settings', async (req, res) => {
  autoSignin(req, res, (async (userId) => {
    try {
      const connection = pool.promise();
      const [[userInfo]] = await connection.query(`SELECT activity_setting FROM users WHERE user_id = ?`, [userId]);
      if (!userInfo) return res.send({ success: false, reason: 'No such user' });
      const { activity_setting } = userInfo;
      res.send({ success: true, activity_setting });
    } catch (err) {
      console.log(err);
      res.send({ success: false, reason: 'err' });
    };
  }))
});


Router.post('/signin-authentication', async (req, res) => {
  const { email, password } = req.body;


  const isValidEmail = validateEmail(email);
  if (!isValidEmail.isValid) {
    return res.send({ success: false, reason: isValidEmail.reason });
  };

  const connection = pool.promise();

  const [[userInfo]] = await connection.query('SELECT user_id, salt, hashed_password, email, myinfo, name, timezone, hashed_password FROM users WHERE email = ?', email);

  if (!userInfo) {
    return res.send({ success: false, reason: "NO SUCH USER" });
  };


  const hashedPassword = crypto.pbkdf2Sync(password, userInfo.salt, 99097, 32, 'sha512').toString('hex');

  if (hashedPassword === userInfo.hashed_password) {
    const userId = userInfo.user_id;

    // Generate a new session ID
    req.session.regenerate((err) => {
      if (err) {
        console.log("Error regenerating session ID:", err);
        res.send({ success: false, reason: "SESSION ERROR" });
        return;
      }

      req.session.user_id = userId;
      req.session.timezone = userInfo.timezone;

      res.cookie("userId", userId, {
        maxAge: 1000 * 60 * 60 * 24 * 30,
        secure: true,
        httpOnly: true,
        signed: true,
      });

      res.send({ success: true, msg: 'Success' });
    });
  } else {
    res.send({ success: false, reason: 'WRONG PASSWORD' });
  };
});


Router.post('/signup-authentication', async (req, res) => {
  try {
    const { email, name, password, timeZone } = req.body;
    if (!isValidTimeZone(timeZone)) {
      timeZone = 'UTC';
    }
    const userDateTime = DateTime.now().setZone(timeZone);
    // Set the time to 12:00 AM
    const twelveAmDateTime = userDateTime.set({ millisecond: 0 });
    // Get the Unix timestamp in seconds
    const unixTimestamp = twelveAmDateTime.toSeconds();
    // Sanitize inputs
    //check email
    const isValidEmail = validateEmail(email);
    if (!isValidEmail.isValid) {
      return res.send({ success: false, reason: isValidEmail.reason });
    };
    const isValidName = validateStrictString(name, 'Name');
    if (!isValidName.isValid) {
      return res.send({ success: false, reason: isValidName.reason });
    };
    const isValidPassword = validatePassword(password);
    if (!isValidPassword.isValid) {
      return res.send({ success: false, reason: isValidPassword.reason });
    };
    const connection = pool.promise();
    const [[checkEmail]] = await connection.query("SELECT email FROM users WHERE email = ?", email);
    if (checkEmail) {
      return res.send({ success: false, reason: "EMAIL ALREADY IN USE" });
    };
    const [salt, hashed_password] = hashing(password);
    const userId = generateRandomId(10);
    const keySalt = crypto.randomBytes(32).toString('hex');
    const iv = crypto.randomBytes(16).toString('hex');
    const user = {
      name,
      email,
      hashed_password,
      salt,
      user_id: userId,
      timezone: timeZone,
      datum_point: unixTimestamp,
      key_salt: keySalt,
      iv: iv,
    };
    connection.query('INSERT INTO users SET ?', user);
    //create default subject
    const subjectId = generateRandomId(10);
    const datum_point = Math.floor(new Date().getTime() / 1000);
    const subject = {
      id: subjectId,
      name: 'others',
      user_id: userId,
      icon: 'others',
      color: '#000000',
      datum_point
    };
    connection.query(`INSERT INTO subjects SET ?`, subject);
    req.session.regenerate((err) => {
      if (err) {
        console.log("Error regenerating session ID:", err);
        res.send({ success: false, reason: "SESSION ERROR" });
        return;
      }
      req.session.user_id = userId;
    });
    const authId = generateRandomId(10);
    res.cookie("userId", userId, {
      maxAge: 1000 * 60 * 60 * 24 * 30,
      secure: true,
      httpOnly: true,
      signed: true,
    });
    res.send({ success: true });
  } catch (err) {
    res.send({ success: false, reason: "Error" });
  };
});

//Removed reset password

Router.post('/update/image', upload.single('image'), async (req, res) => {
  autoSignin(req, res, (async (userId) => {
    try {
      if (!req.file) {
        return res.send({ success: false, reason: 'No image file found' });
      }
      const imageBuffer = req.file.buffer; // Get the image buffer from the request
      await sharp(imageBuffer)
        .toFormat('jpeg')
        .resize({ width: 800, height: 800 })
        .jpeg({ quality: 40 })
        .toFile(`./public/profile-images/${userId}.jpeg`);
      res.send({ success: true, msg: 'Updated Profile Image!' });
    } catch (err) {
      console.log(err)
      res.send({ success: false, reason: 'Unsupported File Type' })
    }
  }));
});


Router.post('/update/info', async (req, res) => {
  autoSignin(req, res, (async (userId) => {
    try {
      const { name, email, confirmEmail } = req.body;
      //const supportedLanguages = ['English', 'Spanish', 'French'];
      const isValidEmail = validateEmail(email);
      if (!isValidEmail.isValid) {
        return res.send({ success: false, reason: isValidEmail.reason });
      };


      const isValidName = validateStrictString(name);
      if (!isValidName.isValid) {
        return res.send({ success: false, reason: isValidName.reason });
      };


      if (email !== confirmEmail) {
        return res.send({ success: false, reason: 'Email Confirmation Failed' });
      };


      const connection = pool.promise();

      const [[checkEmail]] = await connection.query("SELECT email FROM users WHERE email = ?", email);

      if (checkEmail) {
        return res.send({ success: false, reason: "EMAIL ALREADY IN USE" });
      };

      const updateInfo = [{ name: name, email: email }, userId];
      redisClient.hSet(`user:${userId}`, 'name', name);
      redisClient.hSet(`user:${userId}`, 'email', email);
      await connection.query('UPDATE users set ? WHERE user_id = ?', updateInfo);
      res.send({ success: true, msg: 'Updated Your Information!' });
    } catch (error) {
      res.send({ success: false, reason: 'Unsupported File Type' })
    };
  }));
});


Router.post('/update/password', async (req, res) => {
  autoSignin(req, res, (async (userId) => {
    try {
      const connection = pool.promise();
      const { password, confirmPassword } = req.body;


      const isValidPassword = validatePassword(password);
      if (!isValidPassword.isValid) {
        return res.send({ success: false, reason: isValidPassword.reason });
      };


      if (password !== confirmPassword) {
        return res.send({ success: false, reason: 'Password Does Not Match' });
      };


      const [salt, hashed_password] = hashing(password);
      const updateInfo = [{ hashed_password, salt }, userId];
      const update = await connection.query("UPDATE users set ? WHERE user_id = ?", updateInfo);
      res.send({ success: true, msg: "Password Updated!" });
    } catch (error) {
      res.send({ success: false, reason: 'Unsupported File Type' })
    };
  }));
});

Router.get('/logout', function (req, res) {
  console.log('logout')
  req.session.destroy((err) => {
    if (err) {
      console.log("Error destroying session:", err);
    }
    res.clearCookie('userId');
    //res.redirect('/');
    res.send({ success: true });
  });
});


Router.get('/profile/:userId', async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    if (!targetUserId) return { success: false, reason: 'Invalid User' };
    const userInfo = await userCache(targetUserId);
    if (!userInfo) return res.send({ success: false, msg: 'No such user' });
    const friendsInfo = [];
    await Promise.all(userInfo.friends.map(async (friendId) => {
      const friendInfo = await userCache(friendId);
      if (friendInfo) {
        friendsInfo.push(friendInfo);
      };
    }));
    const subjectsInfo = await subjectsTimelineCache(targetUserId);
    res.send({ success: true, userInfo, subjectsInfo, friendsInfo });
  } catch (err) {
    console.log(err);
  }
});

module.exports = Router;