import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
// import { Button } from "reactstrap";
import "./JoinRoom.css";

function roomsListItem(props) {
    return (
        <>
        <Link to={"/room/" + props.code} style={{textDecoration: "none"}}>
            <div key={props.id} className="room_item">
                <div className="room_item__info">
                    <span style={{fontSize: "23px"}}>
                        {props.name}
                    </span>
                </div>
            </div>
        </Link><br/></>
    )
}

function JoinRoom() {
    const [roomsData, setRoomsData] = useState(null);

    useEffect(() => {
        fetch("/api/get-rooms")
            .then(res => res.json())
            .then(data => {
                setRoomsData(data);
            });
    }, []);

    return (
        <div className="join_room"><br/>
            <div style={{fontSize: "34px"}}>
                {roomsData === [] ? "No rooms to show :(" : "Rooms available"}
            </div><br/>
            {roomsData === null ? "Loading..." : roomsData.map(room => {
                return roomsListItem(room);
            })}
        </div>
    );
}

export default JoinRoom;