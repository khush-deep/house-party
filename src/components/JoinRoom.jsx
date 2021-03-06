import { useEffect, useState } from "react";
import { Link, useHistory } from "react-router-dom";
import { Button } from "reactstrap";
import { BiArrowBack } from "react-icons/bi";
import { Spinner } from 'reactstrap';

import "./JoinRoom.css";

function roomsListItem(room) {
  return (
    <div key={room.code}>
      <Link to={{ pathname: "/room/" + room.code, name: room.name }} style={{ textDecoration: "none" }}>
        <div className="room_item">
          <div className="room_item__info">
            <span style={{ fontSize: "23px" }}>
              {room.name}
            </span>
          </div>
        </div>
      </Link><br /></div>
  )
}

function JoinRoom() {
  let history = useHistory();
  const [roomsData, setRoomsData] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    fetch("/api/get-rooms", {signal})
      .then(res => res.json())
      .then(data => setRoomsData(data))
      .catch(e => console.log());

    return () => controller.abort();
  }, []);

  return (
    <div className="join_room"><br />
      <div style={{ fontSize: "34px" }}>
        {roomsData && roomsData.length === 0 ? "No rooms to show :(" : "Rooms available"}
      </div><br />
      {roomsData === null ? <Spinner color="light" /> : roomsData.map(room => {
        return roomsListItem(room);
      })}<br />
      <div>
        <Button className="back" onClick={() => history.push("/")} color="danger"> <BiArrowBack /> Back</Button>
      </div>
    </div>
  );
}

export default JoinRoom;