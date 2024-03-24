const AllThemes = [
  { id: "ViToV5mqC3Q", img: "cafe.png", name: "Full Body", category: ["Default", "Full Body"] },
  { id: "BknEVPkmnSU", img: "ghibli.png", name: "Leg", category: ["Default", "Leg"] },
  { id: "2HvARhMxCTs", img: "ani1.png", name: "Abs", category: ["Default", "Abs"] },
  { id: "9KHMx8uE6cQ", img: "library2.png", name: "Biceps", category: ["Default", "Biceps"] },
  { id: "y-gMeFlbt_o", img: "rain.png", name: "Core", category: ["Default", "Core"]}
];

const AllCategories = [
  "Full Body:0",
  "Cardio:1",
  "Biceps:2",
  "Abs:3",
  "Leg:4",
  "Back:5",
  "Core:6",
  "Others:7",
]
AllCategories.sort((a, b) => {return a.localeCompare(b)}); //sort

export { AllCategories, AllThemes };