import DropDownButton from "../DropDownButton/DropDownButton";
import styles from "./AIWorkout.module.css";
import React, { useCallback, useEffect, useState } from 'react';

const serverOrigin = process.env.REACT_APP_ORIGIN;

function AIWorkout({targetMuscle}) {
  const [advice, setAdvice] = useState(null);
  const [pending, setPending] = useState(false);
  const [resultEl, setResultEl] = useState(null);

  const fetchAI = useCallback(() => {

    setPending(true);

    const age = 17;
    const weight = 160;
    const target = targetMuscle;
    const time = 10;

    fetch(`${serverOrigin}/ai/create-workout?age=${age}&weight=${weight}&target=${target}&time=${time}`, {
      method: "get",
    })
      .then((response) => response.json())
      .then((data) => {
        try {
          console.log(data.plan);
          setAdvice(JSON.parse(data.plan));
        } catch (err) {
          console.log(err);
        }
      })
      .catch((error) => console.error(error));
  }, [targetMuscle]);

  useEffect(() => {
    setPending(false);
    setResultEl(null);
  }, [targetMuscle])

  useEffect(() => {

    if (!advice) return;

    console.log(advice);

    setResultEl(
      <div>
        {Object.entries(advice).map(([key, value], i) => {
          return (
            <div key={i}>
              <h2>Set {i}:</h2>
              <a target="_blank" href={"https://google.com/search?q=" + value["exercise"]}>
                <h4>{value["exercise"]}</h4>
              </a>
              <p>{value["reps"]} Reps</p>
              <br></br><br></br>
            </div>
          )
        })}
      </div>
    )
  }, [advice])

  return (
    <div className={styles.AIRecommendation}>
      {
        !pending ?
          <div>
            <button onClick={fetchAI}>
              AI Generated Workout
            </button>
          </div>
          :
          <div>
            {
              resultEl ?
                resultEl :
                <div>
                  Loading...
                </div>
            }
          </div>
      }
    </div>
  );
};

export default AIWorkout;