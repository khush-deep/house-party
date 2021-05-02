import './App.css';
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import Home from "./components/Home";
import CreateRoom from "./components/CreateRoom";
import JoinRoom from "./components/JoinRoom";
import Room from "./components/Room";

function App() {
  return (
    <div className="App">
      <Router>
        <Switch>
          <Route exact path="/" component={Home} />
          <Route exact path="/join" component={JoinRoom} />
          <Route exact path="/create" component={CreateRoom} />
          <Route exact path="/room/:code" component={Room} />
        </Switch>
      </Router>
    </div>
  );
}

export default App;
