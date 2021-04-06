
function Room(props) {
    console.log(props);
    let code = props.match.params.code;
    return (
        "Room page: " + code
    );
}

export default Room;