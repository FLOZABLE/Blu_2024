import { useEffect } from 'react';
import './App.css';
import { socket } from './socket';

function App() {
  useEffect(() => {
    socket.connect();
    console.log(socket.connected);
  }, [])

  return (
    <div className="App">
      salkdas
    </div>
  );
}

export default App;