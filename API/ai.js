const express = require('express');
const Router = express.Router();
const axios = require('axios');

Router.get('/create-plan', (req, res) => {
  let query = "";

  const {age, weight, target, time} = req.query

  query = `
  Someone is ${age} years old and weighs ${weight} pounds. They want to lose ${target} pounds in ${time} days. Please suggest a dietary plan for 7 days with 3 meals each day. The response should be in pure JSON format describing the plan. The format is the following:
  {
  day1:
  day2:
  day3: 
  day4:
  day5:
  day6:
  day7:
  }
  Be sure to vary the response every time
  `;

  axios.post('https://api.together.xyz/v1/chat/completions', {
    "model": "upstage/SOLAR-10.7B-Instruct-v1.0",
    "max_tokens": 1024,
    "prompt": `[INST] ${query} [/INST]`,
    "temperature": 0.7,
    "top_p": 0.7,
    "top_k": 50,
    "repetition_penalty": 1,
    "stream_tokens": true,
    "stop": [
      "[/INST]",
      "</s>"
    ]
  }, {
    headers: {
      Authorization: `Bearer ${process.env.AI_API_KEY}`
    }
  }).then((response) => {
    console.log(response);
  }, (error) => {
    console.log(error);
  });
})