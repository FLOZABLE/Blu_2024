"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { socket } from "./socket";
import config from "./config";
import { timelineSort } from "./utils/timelineSorting";

const WorkoutsContext = createContext([]);
const PlansContext = createContext([]);
const UserInfoContext = createContext({});
const NotificationsContext = createContext([]);
const ResponseContext = createContext({});
const ModalsContext = createContext({});
const GroupsContext = createContext({});

function AppProvider({ children }) {
  return (
    <AccountProvider>
      <WorkoutsProvider>
        <ResponseProvider>
          <ModalsProvider>
            <GroupsProvider>
              {children}
            </GroupsProvider>
          </ModalsProvider>
        </ResponseProvider>
      </WorkoutsProvider>
    </AccountProvider>
  )
};

function AccountProvider({ children }) {
  const [userInfo, setUserInfo] = useState(null);
  const [notifications, setNotifications] = useState([]);

  const bringAccountInfo = useCallback(() => {
    fetch(`${config.server}/account/accountinfo`, { method: "get" })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          setUserInfo(data.userInfo);
          setNotifications(data.notifications);
          socket.connect();
        } else if (data.code === 401) {
          console.log('not user');
          setUserInfo(false);
        }
      })
      .catch((error) => console.error(error));
  }, []);

  useEffect(() => {
    bringAccountInfo();
  }, []);

  return (
    <UserInfoContext.Provider value={{ userInfo, setUserInfo }}>
      <NotificationsContext.Provider value={{ notifications, setNotifications }}>
        {children}
      </NotificationsContext.Provider>
    </UserInfoContext.Provider>
  )
};

function WorkoutsProvider({ children }) {
  const { userInfo } = useContext(UserInfoContext);
  const [workouts, setWorkouts] = useState([]);
  const [plans, setPlans] = useState([]);
  const [planModal, setPlanModal] = useState({
    opened: false,
    title: '',
    description: '',
    start: new Date(),
    end: new Date(new Date().getTime() + 60 * 1000 * 30),
    repeat: 0,
    priority: 50,
    notification: -1,
    subject: null,
    id: null,
    saved: false,
    completed: false,
    type: 'local',
    editable: true
  });

  const bringWorkouts = useCallback(() => {
    fetch(`${config.server}/workout/`, { method: "get" })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          setWorkouts(timelineSort(data.workouts));
          bringPlans(data.subjects);
        } else {
          bringPlans([]);
        };
      })
      .catch((error) => console.error(error));
  }, []);

  const bringPlans = useCallback((workouts) => {
    fetch(`${config.server}/plan`, { method: "get" })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          setPlans(
            data.plans.map((plan) => {
              plan.saved = true;
              plan.start = new Date(plan.start * 1000 * 60);
              plan.end = new Date(plan.end * 1000 * 60);
              const workout = workouts.find(subject => workout.id === plan.workout);
              if (workout) {
                plan.backgroundColor = workout.color;
                plan.borderColor = workout.color;
              }

              if (plan.completed) {
                plan.className = "completed";
              }
              return plan;
            }),
          );
        }
      })
      .catch((error) => console.error(error));
  }, []);

  useEffect(() => {
    if (userInfo) {
      bringWorkouts();
    }
  }, [userInfo]);

  return (
    <WorkoutsContext.Provider value={{ workouts, setWorkouts }}>
      <PlansContext.Provider value={{ plans, setPlans, planModal, setPlanModal }}>
        {children}
      </PlansContext.Provider>
    </WorkoutsContext.Provider>
  )
};

function ResponseProvider({ children }) {
  const [response, setResponse] = useState({});

  return (
    <ResponseContext.Provider value={{ response, setResponse }}>
      {children}
    </ResponseContext.Provider>
  )
};

function ModalsProvider({ children }) {
  const [isAddSubjectModal, setIsAddSubjectModal] = useState(false);
  const [isChatModal, setIsChatModal] = useState(false);

  return (
    <ModalsContext.Provider value={{ isAddSubjectModal, setIsAddSubjectModal, isChatModal, setIsChatModal }}>
      {children}
    </ModalsContext.Provider>
  )
};

function GroupsProvider({ children }) {
  const [groups, setGroups] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [otherGroups, setOtherGroups] = useState([]);

  return (
    <GroupsContext.Provider value={{ groups, setGroups, myGroups, setMyGroups, otherGroups, setOtherGroups }}>
      {children}
    </GroupsContext.Provider>
  )
}



export { AppProvider, UserInfoContext, NotificationsContext, WorkoutsContext, PlansContext, ResponseContext, ModalsContext, GroupsContext };