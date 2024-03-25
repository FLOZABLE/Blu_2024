import styles from "./AIRecommendation.module.css";
import React, { useEffect, useState } from 'react';

const serverOrigin = process.env.REACT_APP_ORIGIN;

function AIRecommendation() {
  const [advice, setAdvice] = useState(null);
  const [pending, setPending] = useState(false);
  const [resultEl, setResultEl] = useState(null);

  function fetchAI() {

    setPending(true);

    const age = 17;
    const weight = 160;
    const target = 10;
    const time = 10;

    fetch(`${serverOrigin}/ai/create-plan?age=${age}&weight=${weight}&target=${target}&time=${time}`, {
      method: "get",
    })
      .then((response) => response.json())
      .then((data) => {
        try {
          setAdvice(JSON.parse(data.plan));
        } catch (err) {
          console.log(err);
        }
      })
      .catch((error) => console.error(error));
  }

  useEffect(() => {

    if (!advice) return;

    console.log(advice);


    setResultEl(
      <div>
        {Object.entries(advice).map(([key, value], i) => {
          return (
            <div key={i}>
              <h2>Day {i}:</h2>
              <br></br>
              <h4>Breakfast:</h4>
              <ul>
                <li>{advice[key][0]["meal1"]["breakfast"]["item1"]}</li>
                <li>{advice[key][0]["meal1"]["breakfast"]["item2"]}</li>
              </ul>
              <h4>Lunch:</h4>
              <ul>
                <li>{advice[key][0]["meal2"]["lunch"]["item1"]}</li>
                <li>{advice[key][0]["meal2"]["lunch"]["item2"]}</li>
              </ul>
              <h4>Dinner:</h4>
              <ul>
                <li>{advice[key][0]["meal3"]["dinner"]["item1"]}</li>
                <li>{advice[key][0]["meal3"]["dinner"]["item2"]}</li>
              </ul>
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
          <button onClick={fetchAI}>
            Ask for advice
          </button>
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

export default AIRecommendation;