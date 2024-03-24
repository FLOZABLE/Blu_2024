import React from "react";
import styles from "./SelectIcon.module.css";
import {
  WritePen,
  Book,
  Microscope,
  Article,
  Coding,
  Globe,
  Workout,
  Alert,
  Dumbell1,
  Cycle1,
  Arm,
  Yoga,
  Gym,
  Dumbell3,
  Abs,
} from "../../../utils/svgs";

function SelectIcon({
  selectedIcon,
  setSelectedIcon,
  isSelectIcon,
  setIsSelectIcon,
  setIsSelectColor,
  id = ""
}) {
  function handleSelect(iconInfo) {
    setSelectedIcon(iconInfo);
    setIsSelectIcon(false);
  }

  return (
    <div className={styles.SelectIcon}>
      <div className={styles.header}>
        <button
          id={id}
          onClick={() => {
            setIsSelectIcon(!isSelectIcon);
            setIsSelectColor(false);
          }}
        >
          {!selectedIcon.el ? (
            <p>Select Workout Icon!</p>
          ) : (
            <p>Selected Icon: </p>
          )}
        </button>
        <div
          className={styles.selectedIcon}
          id={id}
          onClick={() => {
            setIsSelectIcon(!isSelectIcon);
            setIsSelectColor(false);
          }}
        >
          {selectedIcon.el}
        </div>
      </div>
      <div className={`${styles.icons} ${isSelectIcon ? styles.open : ""}`}>
        <div
          className={styles.iconWrapper}
          id={id}
          onClick={() => {
            handleSelect({
              name: "Dumbell1",
              el: (
                <Dumbell1
                  width={"2.5rem"}
                  height={"2.5rem"}
                  fill={"#000"}
                  opt1={"#000"}
                />
              ),
            });
          }}
        >
          <Dumbell1
            width={"2.5rem"}
            height={"2.5rem"}
            fill={"#000"}
            opt1={"#000"}
          />
        </div>
        <div
          className={styles.iconWrapper}
          id={id}
          onClick={() => {
            handleSelect({
              name: "Cycle1",
              el: (
                <Cycle1
                  width={"2.5rem"}
                  height={"2.5rem"}
                  fill={"#000"}
                  opt1={"#000"}
                />
              ),
            });
          }}
        >
          <Cycle1
            width={"2.5rem"}
            height={"2.5rem"}
            fill={"#000"}
            opt1={"#000"}
          />
        </div>
        <div
          className={styles.iconWrapper}
          id={id}
          onClick={() => {
            handleSelect({
              name: "Arm",
              el: (
                <Arm
                  width={"2.5rem"}
                  height={"2.5rem"}
                  fill={"#000"}
                  opt1={"#000"}
                />
              ),
            });
          }}
        >
          <Arm
            width={"2.5rem"}
            height={"2.5rem"}
            fill={"#000"}
            opt1={"#000"}
          />
        </div>
        <div
          className={styles.iconWrapper}
          id={id}
          onClick={() => {
            handleSelect({
              name: "Yoga",
              el: (
                <Yoga
                  width={"2.5rem"}
                  height={"2.5rem"}
                  fill={"#000"}
                  opt1={"#000"}
                />
              ),
            });
          }}
        >
          <Yoga
            width={"2.5rem"}
            height={"2.5rem"}
            fill={"#000"}
            opt1={"#000"}
          />
        </div>
        <div
          className={styles.iconWrapper}
          id={id}
          onClick={() => {
            handleSelect({
              name: "Gym",
              el: (
                <Gym
                  width={"2.5rem"}
                  height={"2.5rem"}
                  fill={"#000"}
                  opt1={"#000"}
                />
              ),
            });
          }}
        >
          <Gym
            width={"2.5rem"}
            height={"2.5rem"}
            fill={"#000"}
            opt1={"#000"}
          />
        </div>
        <div
          className={styles.iconWrapper}
          id={id}
          onClick={() => {
            handleSelect({
              name: "Dumbell3",
              el: (
                <Dumbell3
                  width={"2.5rem"}
                  height={"2.5rem"}
                  fill={"#000"}
                  opt1={"#000"}
                />
              ),
            });
          }}
        >
          <Dumbell3
            width={"2.5rem"}
            height={"2.5rem"}
            fill={"#000"}
            opt1={"#000"}
          />
        </div>
        <div
          className={styles.iconWrapper}
          id={id}
          onClick={() => {
            handleSelect({
              name: "Abs",
              el: (
                <Abs
                  width={"2.5rem"}
                  height={"2.5rem"}
                  fill={"#000"}
                  opt1={"#000"}
                />
              ),
            });
          }}
        >
          <Abs
            width={"2.5rem"}
            height={"2.5rem"}
            fill={"#000"}
            opt1={"#000"}
          />
        </div>
        <div
          className={styles.iconWrapper}
          id={id}
          onClick={() => {
            handleSelect({
              name: "Alert",
              el: (
                <Alert
                  width={"2.5rem"}
                  height={"2.5rem"}
                  fill={"#000"}
                  opt1={"#000"}
                />
              ),
            });
          }}
        >
          <Alert
            width={"2.5rem"}
            height={"2.5rem"}
            fill={"#000"}
            opt1={"#000"}
          />
        </div>
      </div>
    </div>
  );
}

export default SelectIcon;