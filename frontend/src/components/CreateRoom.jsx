import { useState } from "react";
import { Button, Input } from "reactstrap";
import { useHistory } from "react-router-dom";
import { BiArrowBack } from "react-icons/bi";
import { RiSave3Fill } from "react-icons/ri";
import { Spinner } from 'reactstrap';

import "./CreateRoom.css";

const generateRoomCode = () => {
  let code = "";
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const charsLength = chars.length;
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * charsLength)];
  }
  return code;
}

function CreateRoom() {
  let history = useHistory();
  const [roomCode, setRoomCode] = useState(generateRoomCode());
  const [roomName, setRoomName] = useState("");
  const [votesToSkip, setVotes] = useState(1);
  const [reqInProgress, setReqInProgress] = useState(false);

  const createRoomHandler = () => {
    if (votesToSkip < 1) {
      alert("Votes to skip should be greater than 0");
      return;
    }
    let data = {
      "code": roomCode.trim(),
      "votes_to_skip": votesToSkip
    }
    if (roomName.trim() !== "") data["name"] = roomName.trim();
    
    setReqInProgress(true);
    fetch("/api/create-room", {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
      .then(res => {
        setReqInProgress(false);
        if (res.status !== 201) {
          res.json().then(res => alert(res.error));
        }
        else {
          res.json().then(res => alert("Room: " + res.name + " created!"));
        }
      })
  }

  return (
    <div className="create_room">
      <div>
        <h2>Create Room</h2>
      </div><br />
      <div className="create_room_element">
        <h6>Name</h6>
        <Input
          placeholder="Room name(optional)"
          value={roomName}
          onChange={e => setRoomName(e.target.value)}
        />
      </div>
      <div className="create_room_element">
        <h6>Code</h6>
        <Input
          placeholder="Room code"
          value={roomCode}
          onChange={e => setRoomCode(e.target.value)}
        />
      </div>
      <div className="create_room_element">
        <h6>Votes required to skip a song</h6>
        <Input
          placeholder="Votes required to skip a song"
          value={votesToSkip}
          type="number"
          onChange={e => setVotes(e.target.value)}
        />
      </div>
      <div className="submit">
        <Button
          color="success"
          onClick={createRoomHandler}
        >
          Submit { reqInProgress ? 
            <Spinner size="sm" color="light" style={{ marginBottom: "2px" }} /> 
            : <RiSave3Fill style={{marginLeft:"3px"}} />}
        </Button>
      </div>
      <div>
        <Button className="back" onClick={() => history.push("/")} color="danger"> <BiArrowBack /> Back</Button>
      </div>
    </div>
  );
}

export default CreateRoom;