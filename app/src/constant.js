import { Abs, Alert, Arm, Article, Book, Coding, Cycle1, Dumbell1, Dumbell3, Globe, Gym, IconCalculator, IconFileBarGraphFill, IconPeriodicTable, IconWhiteboard, Microscope, Workout, WritePen, Yoga } from "./utils/svgs";
import React from 'react';

const colorsList = [
  "#0395f9",
  "#3fc2ff",
  "#ff6844",
  "#82d795",
  "#705dc1",
  "#ffee65",
  "#beb9db",
  "#fdcce5",
  "#8bd3c7",
  "#e60049",
  "#0bb4ff",
  "#50e991",
  "#e6d800",
  "#9b19f5",
  "#ffa300",
  "#dc0ab4",
  "#b3d4ff",
  "#00bfa0",
];

const coldColorsList = [
  "#57b9ff",
  "#0085FF",
  "#1c41fd",
];

const warmColorsList = [
  "#fff9eb",
  "#fe8912",
  "#f9c051",
]

const subjectIcons = {
  "Book": <Book />,
  "Coding": <Coding />,
  "Microscope": <Microscope />,
  "WritePen": <WritePen />,
  "Article": <Article />,
  "Globe": <Globe />,
  "Workout": <Workout />,
  "Alert": <Alert />
};

const workoutIcons = {
  "Dumbell1": <Dumbell1 />,
  "Cycle1": <Cycle1 />,
  "Arm": <Arm />,
  "Yoga": <Yoga />,
  "Gym": <Gym />,
  "Dumbell3": <Dumbell3 />,
  "Abs": <Abs />,
}

const toolsInfo = [
  {
    name: "Scientific Calculator",
    icon: <IconCalculator />
  },
  {
    name: "Graphing Calculator",
    icon: <IconFileBarGraphFill />
  },
  {
    name: "Periodic Table of Elements",
    icon: <IconPeriodicTable />
  },
  {
    name: "Whiteboard",
    icon: <IconWhiteboard />
  },
]

export { colorsList, subjectIcons, toolsInfo, coldColorsList, warmColorsList, workoutIcons };