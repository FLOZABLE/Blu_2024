import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import styles from "./CalendarModal.module.css";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import React from 'react';
import SmallCalendar from "../../Plans/SmallCalendar/SmallCalendar";

function CalendarModal({
  isCalendarOpen,
  setIsCalendarOpen,
  updateViewDate,
  viewDate,
  subjects = [],
  showHeatmap = false
}) {
  return (
    <div
      className={`${styles.CalendarModal} modal ${
        isCalendarOpen ? "open" : ""
      }`}
    >
      <div className={styles.modalHeader}>
        <i
          onClick={() => {
            setIsCalendarOpen(false);
          }}
        >
          <FontAwesomeIcon icon={faXmark} />
        </i>
      </div>
      <SmallCalendar
        width={"25rem"}
        setViewDate={updateViewDate}
        viewDate={viewDate}
        setIsCalendarOpen={setIsCalendarOpen}
        showHeatmap={showHeatmap}
        subjects={subjects}
      />
    </div>
  );
}

export default CalendarModal;
