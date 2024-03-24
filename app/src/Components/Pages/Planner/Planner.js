import React, { useState, useEffect, useRef } from "react";
import styles from "./Planner.module.css";
import RadioBtn from "../../UI/Buttons/RadioBtn/RadioBtn";
import PlanTimeline from "../../UI/Plans/PlanTimeline/PlanTimeline";
import EventPlanner from "../../UI/Plans/EventPlanner/EventPlanner";
import SmallCalendar from "../../UI/Plans/SmallCalendar/SmallCalendar";

function Planner({
  planModal,
  setPlanModal,
}) {
  const [viewMode, setViewMode] = useState("timeGridWeek");
  const [viewDate, setViewDate] = useState(
    new Date(new Date().setHours(0, 0, 0, 0)),
  );
  const PlannerRef = useRef(null);
  const [PlannerApi, setPlannerApi] = useState(null);
  const SmallCalendarRef = useRef(null);
  const [SmallCalendarApi, setSmallCalendarApi] = useState(null);

  const updateViewer = (item) => {
    setViewMode(item);
  };

  const updateViewDate = (date) => {
    setViewDate(date);
  };

  useEffect(() => {
    setPlannerApi(PlannerRef.current.getApi());
  }, [PlannerRef]);

  useEffect(() => {
    setSmallCalendarApi(SmallCalendarRef.current.getApi());
  }, [SmallCalendarRef]);

  return (
    <div>
      <div className={`Main`}>
        <div className="title">Planner</div>
        <div className={styles.Planner}>
          <div className={styles.header}>
            <div className={styles.modeBtnWrapper}>
              <RadioBtn
                items={[
                  { view: "Day", value: "timeGridDay" },
                  { view: "Week", value: "timeGridWeek" },
                  { view: "Month", value: "dayGridMonth" },
                ]}
                changeEvent={updateViewer}
                defaultViewer={1}
              />
            </div>
          </div>
          <div className={styles.container}>
            <div className={styles.planner}>
              <EventPlanner
                viewDate={viewDate}
                setViewDate={updateViewDate}
                viewMode={viewMode}
                PlannerRef={PlannerRef}
                PlannerApi={PlannerApi}
              />
            </div>
            <div className={styles.widget}>
              <div className={styles.smallCalendarWrapper}>
                <SmallCalendar
                  width={"100%"}
                  SmallCalendarRef={SmallCalendarRef}
                  SmallCalendarApi={SmallCalendarApi}
                  PlannerApi={PlannerApi}
                  viewDate={viewDate}
                  setViewDate={updateViewDate}
                />
              </div>

              {/* <DropDownButton options={[{name:'Does not repeat', value: 0}, {name: 'Daily', value: 1}, {name: 'Weekly', value: 2}, {name: `Monthly`, value: 3}]} defaultIndex={0} setValue={setSubjectsOptions} /> */}
              <div className={`${styles.planTimelineWrapper}`}>
                <PlanTimeline
                  viewDate={viewDate}
                  viewMode={viewMode}
                  setPlanModal={setPlanModal}
                  mode={"planner"}
                  maxHeight="25rem"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Planner;