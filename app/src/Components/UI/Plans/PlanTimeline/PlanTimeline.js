import React, { useContext, useEffect, useRef, useState } from "react";
import styles from "./PlanTimeline.module.css";
import parse from "html-react-parser";

import { DateTime } from "luxon";
import { ResponsiveRadialBar } from "@nivo/radial-bar";
import { useSearchParams } from "react-router-dom";
import { workoutIcons } from "../../../../utils/Constants";
import BlobBtn from "../../Buttons/BlobBtn/BlobBtn";
import CircularCheckBox from "../../Buttons/CircularCheckBox/CircularCheckBox";
import { Alert } from "../../../../utils/Svgs";
import { PlansContext, WorkoutsContext } from "../../../../Contexts";

const serverOrigin = process.env.REACT_APP_ORIGIN;

function PlanTimeline({
  viewDate,
  viewMode,
  setPlanModal,
  mode,
  maxHeight = "18.75rem",
}) {
  const {workouts} = useContext(WorkoutsContext);
  const {plans, setPlans} = useContext(PlansContext);
  const [planSeries, setPlanSeries] = useState([]);
  const [filteredPlans, setFilteredPlans] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const addBtnRef = useRef(null);

  const togglePlan = (plan) => {
    const eventIndex = plans.findIndex((planInfo) => planInfo.id === plan.id);
    if (eventIndex !== -1) {
      const updatedEvents = [...plans];
      updatedEvents[eventIndex] = {
        ...updatedEvents[eventIndex],
        completed: plan.completed ? 0 : 1,
        className: plan.completed ? "" : "completed"
      };
      const planInfo = {
        id: plan.id,
        completed: plan.completed ? 0 : 1,
      };

      delete planInfo.saved;
      fetch(`${serverOrigin}/plan/status-change`, {
        method: "post",
        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(planInfo),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            setPlans(updatedEvents);
            //setPlanModal((prev) => ({...prev, opened: false}));
          }
        })
        .catch((error) => console.error(error));
    }
  };

  useEffect(() => {
    if (!workouts.length || !filteredPlans.length) return;

    const planSeries = [];
    workouts.map((subject, i) => {
      const subjectPlans = filteredPlans.filter(plan => plan.subject === subject.id);
      if (subjectPlans.length) {
        const { id, name } = subject;
        const total = subjectPlans.length;
        const completed = subjectPlans.filter(plan => plan.completed).length;
        const ratio = Math.floor(completed / total * 100);
        const data = [{
          x: name,
          y: ratio,
          axisStartValue: 's'
        }]
        planSeries.push({ id: name, data });
      }
    });
    setPlanSeries(planSeries);
  }, [workouts, filteredPlans]);

  const isInViewRange = (plan) => {
    const viewDateTime = DateTime.fromJSDate(viewDate);
    let isInRange = false;

    if (viewMode === "timeGridDay") {
      if (
        viewDateTime.startOf("day").toMillis() <= plan.start.getTime() &&
        plan.start.getTime() <= viewDateTime.endOf("day").toMillis()
      ) {
        isInRange = true;
      }
    } else if (viewMode === "timeGridWeek") {
      if (
        viewDateTime.plus({ days: 1 }).startOf("week").minus({ days: 1 }).toMillis() <= plan.start.getTime() &&
        plan.start.getTime() <= viewDateTime.plus({ days: 1 }).endOf("week").minus({ days: 1 }).toMillis()
      ) {
        isInRange = true;
      }
    } else {
      if (viewDate.getMonth() === plan.start.getMonth()) {
        isInRange = true;
      }
    };
    return isInRange;
  };

  useEffect(() => {
    setFilteredPlans(plans.filter(plan => isInViewRange(plan)));
  }, [plans, viewMode, viewDate, workouts]);

  return (
    <div
      className={`hiddenScroll ${styles.PlanTimeline} ${mode === "study" ? styles.studyMode : ""
        }`}
    >
      {filteredPlans.length ?
        <div className={styles.chartContainer}>
          <ResponsiveRadialBar
            data={planSeries}
            padding={0.4}
            cornerRadius={2}
            margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
            enableRadialGrid={false}
            enableCircularGrid={false}
            radialAxisStart={{ tickSize: 5, tickPadding: 5, tickRotation: 0 }}
            circularAxisOuter={null}
            maxValue={100}
            legends={[]}
            valueFormat={val => val + '%'}
          />
        </div>
        : null
      }
      <div id={styles.addBtnWrapper} ref={addBtnRef}>
        <BlobBtn
          name={"Add a New Plan"}
          setClicked={() => {
            setPlanModal((prev) => ({ ...prev, opened: true }));
          }}
          color1={"#fff"}
          color2={"var(--blue2)"}
          delay={-1}
        />
      </div>
      {filteredPlans.length ?
        <ul className={`${styles.plans} hiddenScroll`} style={{ maxHeight: maxHeight }}>
          {filteredPlans.map((plan, i) => {
            const planSubject = workouts.find((subject) => {
              return subject.id === plan.subject;
            });

            const dispStart = DateTime.fromJSDate(plan.start).toLocaleString(DateTime.TIME_SIMPLE);
            const dispEnd = DateTime.fromJSDate(plan.end).toLocaleString(DateTime.TIME_SIMPLE);
            let icon;
            let color = "#fff";
            if (planSubject) {
              color = planSubject.color;
              icon = workoutIcons[planSubject.icon];
            };

            if (!icon) {
              icon = (
                <Alert />
              );
            }
            return (
              <li className={styles.plan} key={i}>
                <div className={styles.iconWrapper}>
                  <div style={{ color }} className={styles.icon}>{icon}</div>
                  <div
                    className={styles.hoverDisp}
                    onClick={() => {
                      togglePlan(plan);
                    }}
                  >
                    <CircularCheckBox checked={plan.completed} />
                  </div>
                </div>
                <div className={styles.content}>
                  <div className={styles.title}>
                    <h2>{plan.title}</h2>
                    <div className={`${styles.line} ${plan.completed ? styles.completed : ''}`}></div>
                  </div>
                  <p>
                    ({dispStart}-{dispEnd})
                  </p>
                  <div className={`${styles.description} customScroll`}>
                    {plan.description ? parse(plan.description) : ''}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        : null
      }
    </div>
  );
}

export default PlanTimeline;