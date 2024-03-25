import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import styles from "./AIRecommendation.module.css";
import React, { useEffect, useState } from 'react';
import { faXmark } from "@fortawesome/free-solid-svg-icons";

const serverOrigin = process.env.REACT_APP_ORIGIN;

function AIRecommendation({isOpen, setIsOpen}) {
  const [advice, setAdvice] = useState(null);
  const [pending, setPending] = useState(false);
  const [resultEl, setResultEl] = useState(null);
  console.log(isOpen)

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
      <div  className={`${styles.responseContainer} customScroll`} style={{padding: '0rem 2rem'}}>
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
    <div className={`${styles.AIRecommendation} modal ${isOpen ? 'open' : ''}`}>
      <div className={styles.header}>
        <i onClick={() => {setIsOpen(false)}}>
          <FontAwesomeIcon icon={faXmark} />
        </i>
      </div>
      {
        !pending ?
          <button onClick={fetchAI}>
            Ask for advice
          </button>
          :
          <div className={`${styles.responseContainer} customScroll`}>
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