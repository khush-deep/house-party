import './App.css';
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import home from "./components/Home";
import createRoom from "./components/CreateRoom";
import joinRoom from "./components/JoinRoom";
import room from "./components/Room";
import uploadLocalSong from "./components/UploadLocalSong";

function App() {
  return (
    <div className="App">
      <Router>
        <Switch>
          <Route exact path="/" component={home} />
          <Route exact path="/join" component={joinRoom} />
          <Route exact path="/create" component={createRoom} />
          <Route exact path="/room/:code" component={room} />
          <Route exact path="/upload/local" component={uploadLocalSong} />
        </Switch>
      </Router>
    </div>
  );
}

export default App;
