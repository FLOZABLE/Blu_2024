import React, { useContext, useEffect, useRef } from "react";
import styles from "./EventModal.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBell,
  faBook,
  faCircleExclamation,
  faClock,
  faFileLines,
  faRepeat,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import Draggable from "react-draggable";
import { ModalsContext, PlansContext, ResponseContext, WorkoutsContext } from "../../../../Contexts";
import { generateRandomId, requestNotification } from "../../../../utils/Tools";
import SliderAnimation from "../../Others/SliderAnimation/SliderAnimation";
import BlobBtn from "../../Buttons/BlobBtn/BlobBtn";
import DropDownButton from "../../Buttons/DropDownButton/DropDownButton";
import DateSelector from "../DateSelector/DateSelector";
import TextEditor from "../../Inputs/TextEditor/TextEditor";

const serverOrigin = process.env.REACT_APP_ORIGIN;

function EventModal({
}) {
  const {workouts} = useContext(WorkoutsContext);
  const {plans, setPlans, planModal, setPlanModal} = useContext(PlansContext);
  const {setResponse} = useContext(ResponseContext);
  const {setIsAddSubjectModal} = useContext(ModalsContext);

  const eventModalRef = useRef(null);

  const submit = () => {
    if (!planModal.editable) {
      setResponse({ success: false, reason: "This event is view only" });
      return;
    };
    const startSec = Math.floor(planModal.start.getTime() / (1000 * 60));
    const endSec = Math.floor(planModal.end.getTime() / (1000 * 60));
    const notification = parseInt(planModal.notification);
    const repeat = parseInt(planModal.repeat);
    const completed = planModal.completed ? 1 : 0;
    fetch(`${serverOrigin}/plan/update`, {
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...planModal, start: startSec, end: endSec, completed, notification, repeat }),
    })
      .then((response) => response.json())
      .then((data) => {
        setResponse(data);
        if (data.success) {
          const eventIndex = plans.findIndex((event) => event.id === planModal.id);
          if (eventIndex !== -1) {
            const updatedEvents = [...plans];
            updatedEvents[eventIndex].saved = true;
            setPlans(updatedEvents);
          }
          setPlanModal(prev => ({ ...prev, opened: false, id: null }));
        }
      })
      .catch((error) => console.error(error));
  };

  useEffect(() => {
    if (!planModal || !planModal.opened || !workouts) return;
    if (!planModal.id) {
      const planInfo = { ...planModal };
      delete planInfo.opened;
      planInfo.id = generateRandomId(10);
      setPlanModal((prev) => ({ ...prev, id: planInfo.id }));
      setPlans(prev => (
        [...prev, planInfo]
      ));
    } else {
      setPlans((prev) => {
        const foundIndex = prev.findIndex((val) => val.id === planModal.id);
        const subject = workouts.find(subject => subject.id === planModal.subject);
        const planInfo = { ...planModal };
        if (subject) {
          planInfo.backgroundColor = subject.color;
          planInfo.borderColor = subject.color;
        }
        if (foundIndex !== -1) {
          return [
            ...prev.slice(0, foundIndex),
            planInfo,
            ...prev.slice(foundIndex + 1),
          ];
        } else {
          return [...prev.slice(), planInfo];
        };
      });
    }
  }, [planModal, workouts]);

  useEffect(() => {
    if (!planModal) return;
    if (!planModal.opened) {
      setPlanModal(prev => (
        {
          ...prev,
          opened: false,
          title: '',
          description: '',
          start: new Date(),
          end: new Date(new Date().getTime() + 60 * 1000 * 30),
          repeat: 0,
          priority: 50,
          notification: -1,
          id: null,
          saved: false,
          completed: false,
          editable: true
        }
      ));
      if (!planModal.saved) {
        setPlans((prev) => {
          const foundIndex = prev.findIndex((val) => val.id === planModal.id);
          if (foundIndex !== -1) {
            return [
              ...prev.slice(0, foundIndex),
              ...prev.slice(foundIndex + 1),
            ];
          }
          return prev;
        });
      };
    }
  }, [planModal.opened]);

  return (
    <Draggable nodeRef={eventModalRef} handle=".header">
      <div
        className={`${styles.EventModal} modal ${planModal.opened ? "open" : ""}`}
        ref={eventModalRef}
      >
        <div className={`${styles.header} header`}>
          <i
            onClick={() => {
              setPlanModal((prev) => ({ ...prev, opened: false }));
            }}
          >
            <FontAwesomeIcon icon={faXmark} />
          </i>
        </div>
        <div className={`${styles.container} customScroll`}>
          <div className={`${styles.wrapper} ${styles.title}`}>
            <div className={styles.iconWrapper}></div>
            <div className={styles.contentWrapper}>
              <input
                type="text"
                placeholder="Enter title"
                value={planModal.title}
                onChange={(e) => {
                  if (!planModal.editable) {
                    setResponse({ success: false, reason: "This event is view only" });
                  } else {
                    setPlanModal((prev) => ({ ...prev, title: e.target.value }));
                  }
                }}
              />
            </div>
          </div>
          <div className={styles.wrapper}>
            <div className={styles.iconWrapper}>
              <FontAwesomeIcon icon={faClock} />
              <div className={styles.hoverEl}>
                <p>Select Time</p>
              </div>
            </div>
            <div className={styles.contentWrapper}>
              <DateSelector
                start={planModal.start}
                setStart={(start) => {
                  if (!planModal.editable) {
                    setResponse({ success: false, reason: "This event is view only" });
                  } else {
                    setPlanModal((prev) => ({ ...prev, start }));
                  }
                }}
                end={planModal.end}
                setEnd={(end) => {
                  if (!planModal.editable) {
                    setResponse({ success: false, reason: "This event is view only" });
                  } else {
                    setPlanModal((prev) => ({ ...prev, end }));
                  }
                }}
              />
            </div>
          </div>
          <div className={styles.wrapper}>
            <div className={styles.iconWrapper}>
              <FontAwesomeIcon icon={faFileLines} />
              <div className={styles.hoverEl}>
                <p>Add Description</p>
              </div>
            </div>
            <div className={styles.contentWrapper}>
              <TextEditor
                setDescription={(description) => {
                  if (!planModal.editable) {
                    setResponse({ success: false, reason: "This event is view only" });
                  } else {
                    setPlanModal((prev) => ({ ...prev, description }));
                  }
                }}
                description={planModal.description}
              />
            </div>
          </div>
          <div className={styles.wrapper}>
            <div className={styles.iconWrapper}>
              <FontAwesomeIcon icon={faRepeat} />
              <div className={styles.hoverEl}>
                <p>Repeat</p>
              </div>
            </div>
            <div className={styles.contentWrapper}>
              <DropDownButton
                options={{
                  "0": "Does not repeat",
                  "1": "Daily",
                  "2": "Weekly",
                  "3": "Monthly"
                }}
                setValue={(repeat) => {
                  if (!planModal.editable) {
                    setResponse({ success: false, reason: "This event is view only" });
                  } else {
                    setPlanModal((prev) => ({ ...prev, repeat }));
                  }
                }}
                value={planModal.repeat}
              />
            </div>
          </div>
          {planModal.editable ?
            <div className={styles.wrapper}>
              <div className={styles.iconWrapper}>
                <FontAwesomeIcon icon={faBook} />
                <div className={styles.hoverEl}>
                  <p>Select Subject</p>
                </div>
              </div>
              <div className={styles.contentWrapper}>
                <div className={styles.subjectWrapper}>
                  <DropDownButton
                    options={workouts.reduce((acc, subject) => {
                      const { name, id } = subject;
                      acc[id] = name;
                      return acc;
                    }, {})}
                    setValue={(subject) => {
                      if (!planModal.editable) {
                        setResponse({ success: false, reason: "This event is view only" });
                      } else {
                        setPlanModal((prev) => ({ ...prev, subject }));

                      }
                    }}
                    value={planModal.subject}
                  />
                </div>
                <p>OR</p>
                <div className={styles.addSubjectWrapper}>
                  <BlobBtn
                    name={"Add Subject"}
                    setClicked={() => {
                      setIsAddSubjectModal(true);
                    }}
                    delay={-1}
                    id="tutorial-3"
                  />
                </div>
              </div>
            </div>
            : null
          }
          <div className={styles.wrapper}>
            <div className={styles.iconWrapper}>
              <FontAwesomeIcon icon={faBell} />
              <div className={styles.hoverEl}>
                <p>Select Notification</p>
              </div>
            </div>
            <div className={styles.contentWrapper}>
              <div className={styles.notificationWrapper}>
                <DropDownButton
                  options={{
                    "-1": "no notification",
                    "5": "5 minutes before",
                    "10": "10 minutes before",
                    "30": "30 minutes before",
                    "60": "1 hour before"
                  }}
                  setValue={(notification) => {
                    setPlanModal((prev) => ({ ...prev, notification }));
                  }}
                  value={planModal.notification}
                  onClick={() => {
                    requestNotification();
                  }}
                />
              </div>
            </div>
          </div>
          <div className={styles.wrapper}>
            <div className={styles.iconWrapper}>
              <FontAwesomeIcon icon={faCircleExclamation} />
              <div className={styles.hoverEl}>
                <p>Select Importance</p>
              </div>
            </div>
            <div className={styles.contentWrapper}>
              <div className={styles.notificationWrapper}>
                <SliderAnimation
                  min={0}
                  max={100}
                  step={1}
                  sliderValue={planModal.priority}
                  setSliderValue={(priority) => {
                    setPlanModal((prev) => ({ ...prev, priority }));
                  }}
                />
              </div>
            </div>
          </div>
          <div className={styles.submit}>
            <BlobBtn
              name={"SUBMIT"}
              setClicked={() => {
                submit();
              }}
              id="tutorial-5"
            />
          </div>
        </div>
      </div>
    </Draggable>
  );
}

export default EventModal;