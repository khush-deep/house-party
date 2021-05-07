import { useEffect, useState, useRef } from "react";
import { Button, Modal, ModalHeader, ModalBody } from "reactstrap";
import { useHistory } from "react-router-dom";
import { BiArrowBack } from "react-icons/bi";
import { MdSkipNext } from "react-icons/md";
import { FiUpload } from "react-icons/fi";
import UploadLocalSong from "./UploadLocalSong";
import "./Room.css";

const defaultCoverUrl = "https://s3.jp-tok.cloud-object-storage.appdomain.cloud/library-bucket/default-cover.jpg";

function Room(props) {
  let history = useHistory();
  let [code, setCode] = useState(props.match.params.code);
  let [roomName, setRoomName] = useState(props.location.name || "");
  let [votesToSkip, setVotesToSkip] = useState(1);
  let [currentVotes, setCurrentVotes] = useState(0);

  let [songId, setSongId] = useState(0);
  let [coverUrl, setCoverUrl] = useState(defaultCoverUrl);
  let [songUrl, setSongUrl] = useState("");
  let [songName, setSongName] = useState("No song to play! Add songs to library");
  let [playlist, setPlaylist] = useState([]);

  let [timeDeltaMS, setTimeDeltaMS] = useState(0);
  let [startTime, setStartTime] = useState("");
  let [elapsedTime, setElapsedTime] = useState(0);
  let [songDuration, setSongDuration] = useState(0);
  let [songEnded, setSongEnded] = useState(true);

  let [nextSongName, setNextSong] = useState("next-song");
  let [voteCasted, setVoteCasted] = useState(false);
  let [changingSong, setChangingSong] = useState(true);
  let [skipHover, setSkipHover] = useState(false);
  let [trigger, setTrigger] = useState(null);
  let [modal, setModal] = useState(false);

  const hiddenAudioElement = useRef(null);
  const formattedTime = (timeInSec) => new Date(timeInSec * 1000).toISOString().substr(15, 4);

  function getSongFromPlaylist() {
    return playlist.filter(song => {
      return song.id === songId;
    })[0]
  }

  function getNextSongFromPlaylist() {
    const n = playlist.length;
    for (let i = 0; i < n; i++) {
      if (playlist[i].id === songId)
        return playlist[(i + 1) % n];
    }
  }

  const toggle = () => setModal(!modal);
  
  useEffect(() => {
    setElapsedTime(hiddenAudioElement.current?.currentTime || 0);
    setSongDuration(hiddenAudioElement.current?.duration || 0);
    if (songEnded) hiddenAudioElement.current?.pause()?.catch(e => console.log());
    else hiddenAudioElement.current?.play()?.catch(e => console.log());
    console.log("timeDelta:", timeDeltaMS);
    const tempCurrentTime = new Date() - new Date(startTime) - timeDeltaMS;
    if (Math.abs(tempCurrentTime - hiddenAudioElement.current?.currentTime*1000) > 500) {
      if (tempCurrentTime/1000 < hiddenAudioElement.current?.duration)
        hiddenAudioElement.current.currentTime = tempCurrentTime / 1000;
    }
    if (!changingSong && (currentVotes >= votesToSkip || Math.abs(tempCurrentTime/1000 - hiddenAudioElement.current?.duration) < 1.5)) {
      let song_start_time = new Date(new Date() - timeDeltaMS);
      song_start_time.setSeconds(song_start_time.getSeconds() + 2);
      let data = {
        "change_song": true,
        "current_song": getNextSongFromPlaylist().id,
        "song_start_time": new Date(song_start_time),
      }
      console.log(data);
      setChangingSong(true);
      setTimeout(() => {
        setSongEnded(true);
        setSongUrl("");
      }, 400);
      fetch("/api/update-room/" + code, {
        method: "POST",
        body: JSON.stringify(data),
      });
    }
    else if (!changingSong && tempCurrentTime/1000 > hiddenAudioElement.current.duration) {
      let data = {
        "change_song": true,
        "current_song": getSongFromPlaylist().id,
        "song_start_time": new Date(new Date() - elapsedTime*1000 - timeDeltaMS),
      }
      console.log(data);
      setChangingSong(true);
      fetch("/api/update-room/" + code, {
        method: "POST",
        body: JSON.stringify(data),
      });
    }
  }, [trigger])


  useEffect(() => {
    let song = getSongFromPlaylist();
    let nextSong = getNextSongFromPlaylist();
    if (!!song) {
      setChangingSong(false);
      setSongUrl(song.song_url);
      setCoverUrl(song.cover_art_url);
      setSongName(song.title + " - " + song.artist);
      setNextSong(nextSong.title + " - " + nextSong.artist);
    }
  }, [playlist, songId, startTime])

  useEffect(() => {
    setVoteCasted(false);
    setTimeout(() => setSongEnded(false), 100);
  }, [songId, startTime])


  async function getRoomInfo(controller) {
    const signal = controller.signal;
    const start = new Date();
    await fetch("/api/get-room-info/" + code, {signal})
      .then(res => {
        if (res.status === 200) {
          res.json()
            .then(res => {
              setTimeDeltaMS(new Date() - new Date(res.time));
              setStartTime(res.song_start_time);
              setSongId(res.current_song);
              setPlaylist(res.playlist);
              setCurrentVotes(res.current_votes);
            });
            if (hiddenAudioElement.current)
              hiddenAudioElement.current.muted = false;
            console.log("polling finished -", (new Date() - start)/1000);
        }
      })
      .catch(e => console.log());
  }


  useEffect(() => {
    const controller = new AbortController();
    let [intervalId1, intervalId2] = [0, 0];
  
    fetch("/api/get-room-info/" + code)
      .then(res => {
        if (res.status !== 200) {
          setCode("");
          res.json().then(res => alert(res.error));
        }
        else {
          res.json()
            .then(res => {
              setCode(res.code);
              setTimeDeltaMS(new Date() - new Date(res.time));
              setRoomName(res.name);
              setVotesToSkip(res.votes_to_skip);
              setCurrentVotes(res.current_votes);
              setStartTime(res.song_start_time)
              setSongId(res.current_song);
              setPlaylist(res.playlist);
              setSongEnded(false);
            });
          intervalId1 = setInterval(() => getRoomInfo(controller), 2500);
          intervalId2 = setInterval(() => setTrigger(Date.now()), 1000);
        }
      });
    return () => {
      clearInterval(intervalId1);
      clearInterval(intervalId2);
    };
  }, []);


  function handleSkip() {
    setVoteCasted(true);
    setCurrentVotes(currentVotes + 1);
    let data = {
      "increase_votes": 1
    }
    fetch("/api/update-room/" + code, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  return (
    <div className="room">
      <h3>{roomName}</h3><br />
      {code ? (
        <div className="room_available">
          <div className="cover" >
            <img src={coverUrl} alt="Thumbnail" />
          </div>
          <div className="song_detail">
            {songName}
          </div>
          <audio ref={hiddenAudioElement} onEnded={event => setSongEnded(true)} src={songUrl}></audio>
          <div className="playback_bar">
            <div className="progress_bar">
              <div className="playback_time">
                <div className="progress_time">
                  {formattedTime(elapsedTime)}
                </div>
                <div className="playback_duration">
                  {formattedTime(songDuration)}
                </div>
              </div>
              <progress max={songDuration} value={elapsedTime}></progress>
            </div>
            <div className="skip">
              <Button disabled={voteCasted} onMouseOver={e => setSkipHover(true)} onMouseOut={e => setSkipHover(false)} onClick={handleSkip} color="success">
                <MdSkipNext />
                { !skipHover && currentVotes +"/"+ votesToSkip }
                { skipHover && "Vote" }
              </Button>
              <div className="tooltip">
                Next: {nextSongName}
              </div>
            </div>
          </div>
        </div>) : (
          <div className="room_not_available">
            <h4>Room not available!</h4>
          </div>
        )}
      <br />
      <div className="back_upload">
        <Button className="back" onClick={() => history.push("/join")} color="danger"> <BiArrowBack /> Back</Button>
        <Button className="upload" onClick={toggle} color="primary"> <FiUpload /> Upload Song</Button>
      </div>

      <Modal isOpen={modal} toggle={toggle} >
        <ModalHeader toggle={toggle}>
          Upload Song
        </ModalHeader>
        <ModalBody>
          <UploadLocalSong code={code} toggle={toggle} />
        </ModalBody>
      </Modal>
    </div>
  );
}

export default Room;