import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "reactstrap";
import "./JoinRoom.css";

function roomsListItem(props) {
    return (
        <>
        <Link to={"/room/" + props.code} style={{textDecoration: "none"}}>
            <div key={props.id} className="room_item">
                <div className="room_item__info">
                    <span style={{fontSize: "23px"}}>
                        {props.name ? props.name : props.code}
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
                console.log(data);
                setRoomsData(data);
            });
    }, []);

    return (
        <div className="join"><br/>
            <div style={{fontSize: "34px"}}>
                {roomsData === [] ? "No rooms to show :(" : "Rooms available"}
            </div><br/>
            {roomsData === null ? "Loading..." : roomsData.map(room => {
                room["key"] = room.id;
                return roomsListItem(room);
            })}
        </div>
    );
}

export default JoinRoom;