import { Link } from "react-router-dom";
import { Button } from "reactstrap";
import "./Home.css";

function Home() {
  return (
    <div className="home">
      <div style={{ fontSize: 42 }}>
        House Party
      </div><br/>
      <div>
        <Link to="/join">
          <Button color="primary">Join Room</Button>
        </Link>{" "}
        <Link to="/create">
          <Button color="danger">Create Room</Button>
        </Link>
      </div><br/>
    </div>
  );
}

export default Home;