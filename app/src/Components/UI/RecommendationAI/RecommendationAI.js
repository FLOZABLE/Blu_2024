import React from "react";
import styles from "./RecommendationAI.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faXmark } from "@fortawesome/free-solid-svg-icons";

const serverOrigin = process.env.REACT_APP_ORIGIN;

function RecommendationAI({ userInfo }) {

  const [advice, setAdvice] = useState({});

  function fetchAI() {

    const age = 17;
    const weight = 160;
    const target = 10;
    const time = 10;

    fetch(`${serverOrigin}/ai/create-plan?age=${age}&weight=${weight}&target=${target}&time=${time}`, {
      method: "get",
    })
      .then((response) => response.json())
      .then((data) => {
        setAdvice(data.plan);
      })
      .catch((error) => console.error(error));
  }

  return (
    <div className={styles.swithCheck}>
      <button>
        Ask for advice
      </button>
    </div>
  );
}

export default RecommendationAI;
