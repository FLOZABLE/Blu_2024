import { AI } from "../../../utils/svgs";
import styles from "./GetAiRecommendationBtn.module.css";

function GetAiRecommendationBtn({setIsOpen}) {
  return (
    <div className={styles.recmBtn} onClick={() => {
      setIsOpen((prev) => !prev)
    }}>
      <i>
        <AI />
      </i>
      <div className={styles.hoverEl}>
        Get advice from AI!
      </div>
    </div>
  )
}

export default GetAiRecommendationBtn;