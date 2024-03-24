import { useEffect, useState } from 'react';
import './App.css';
import { socket } from './socket';
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Main from './Components/Pages/Main/Main';
import Planner from './Components/Pages/Planner/Planner';
import { AppProvider } from './Contexts';
import Sidebar from './Components/UI/Others/Sidebar/Sidebar';
import EventModal from './Components/UI/Plans/EventModal/EventModal';
import Analysis from './Components/Pages/Analysis/Analysis';
import Groups from './Components/Pages/Groups/Groups';

function App() {
  useEffect(() => {
    socket.connect();
    console.log(socket.connected);
  }, [])

  const [isAddSubjectModal, setIsAddSubjectModal] = useState(false);
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
  const [response, setResponse] = useState({});
  const [userInfo, setUserInfo] = useState(null);

  return (
    <AppProvider>
      <Router>
        <Sidebar />
        <EventModal />
        <Routes>
          <Route
            path="/dashboard"
            element={
              <>
                <Main />
              </>
            }
          />
          <Route
            path="/dashboard/planner"
            element={
              <>
                <Planner
                  planModal={planModal}
                  setIsAddSubjectModal={setIsAddSubjectModal}
                  setPlanModal={setPlanModal}
                />
              </>
            }
          />
          <Route
            path="/dashboard/analysis"
            element={
              <>
                <Analysis
                />
              </>
            }
          />
          <Route
            path="/dashboard/groups"
            element={
              <>
                <Groups
                />
              </>
            }
          />
        </Routes>
      </Router>
    </AppProvider>
  );
}

export default App;