import { useEffect, useState } from "react";
import { Link, useHistory } from "react-router-dom";
import { Button } from "reactstrap";
import { BiArrowBack } from "react-icons/bi";
import { Spinner } from 'reactstrap';

import "./JoinRoom.css";

function roomsListItem(room) {
  return (
    <>
      <Link to={{ pathname: "/room/" + room.code, name: room.name }} style={{ textDecoration: "none" }}>
        <div key={room.code} className="room_item">
          <div className="room_item__info">
            <span style={{ fontSize: "23px" }}>
              {room.name}
            </span>
          </div>
        </div>
      </Link><br /></>
  )
}

function JoinRoom() {
  let history = useHistory();
  const [roomsData, setRoomsData] = useState(null);

  useEffect(() => {
    fetch("/api/get-rooms")
      .then(res => res.json())
      .then(data => {
        setRoomsData(data);
      });
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
        <Button className="back" onClick={() => history.goBack()} color="danger"> <BiArrowBack /> Back</Button>
      </div>
    </div>
  );
}

export default JoinRoom;