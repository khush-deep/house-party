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
  let [modal, setModal] = useState(false);
  let [code, setCode] = useState(props.match.params.code);
  let [roomName, setRoomName] = useState(props.location.name || "");
  let [votesToSkip, setVotesToSkip] = useState(1);
  let [currentVotes, setCurrentVotes] = useState(0);
  let [coverUrl, setCoverUrl] = useState(defaultCoverUrl);
  let [songUrl, setSongUrl] = useState("");
  let [songName, setSongName] = useState("No song to play! Add songs to library");
  let [playlist, setPlaylist] = useState([]);
  let [songId, setSongId] = useState(null);
  let [startTime, setStartTime] = useState("");
  let [elapsedTime, setElapsedTime] = useState(0);
  let [songDuration, setSongDuration] = useState(0);
  let [nextSongName, setNextSong] = useState("next-song");
  let [voteCasted, setVoteCasted] = useState(false);
  let [songEnded, setSongEnded] = useState(false);
  const hiddenAudioElement = useRef(null);

  function formattedTime(timeInSec) {
    return new Date(timeInSec * 1000).toISOString().substr(15, 4);
  }

  function getSongFromPlaylist() {
    for (const song of playlist) {
      if (song.id === songId) {
        return song;
      }
    }
  }
  function getNextSongFromPlaylist() {
    const n = playlist.length;
    for (let i = 0; i < n; i++) {
      if (playlist[i].id === songId) {
        return playlist[(i + 1) % n];
      }
    }
  }

  const handleSongEnd = event => {
    songEnded = true;
    try {
      hiddenAudioElement.current.pause().catch(() => console.log());
    } catch (error) {
    }
  };

  function toggle() {
    setModal(!modal);
  }

  function updateRoom() {
    const tempCurrentTime = new Date() - new Date(startTime);
    if (Math.abs(tempCurrentTime - hiddenAudioElement.current.currentTime*1000) > 500) {
      if (tempCurrentTime/1000 < hiddenAudioElement.current.duration)
        hiddenAudioElement.current.currentTime = tempCurrentTime / 1000;
    }
    setElapsedTime(hiddenAudioElement.current.currentTime || 0);
    setSongDuration(hiddenAudioElement.current.duration || 0);
    if (currentVotes >= votesToSkip || Math.abs(tempCurrentTime/1000 - hiddenAudioElement.current.duration) < 2) {
      let data = {
        "change_song": true,
        "current_song": getNextSongFromPlaylist().id
      }
      console.log(data);
      fetch("/api/update-room/" + code, {
        method: "POST",
        body: JSON.stringify(data),
      });
    }
    else if (tempCurrentTime/1000 > hiddenAudioElement.current.duration) {
      let data = {
        "change_song": true,
        "current_song": getSongFromPlaylist().id
      }
      fetch("/api/update-room/" + code, {
        method: "POST",
        body: JSON.stringify(data),
      });
    }
  }

  function getRoomInfo() {
    fetch("/api/get-room-info/" + code)
      .then(res => {
        if (res.status === 200) {
          res.json()
            .then(res => {
              setCurrentVotes(parseInt(res.current_votes));
              currentVotes = parseInt(res.current_votes);
              if (startTime !== res.song_start_time) {
                setVoteCasted(false);
                songEnded = false;
              }
              startTime = res.song_start_time;
              songId = parseInt(res.current_song);
              playlist = res.playlist;
              let song = getSongFromPlaylist();
              let nextSong = getNextSongFromPlaylist();
              if (!!song) {
                setSongUrl(song.song_url);
                setCoverUrl(song.cover_art_url);
                setSongName(song.title + " - " + song.artist);
                setNextSong(nextSong.title + " - " + nextSong.artist);
              }
            });
          if (!songEnded) {
            try {
              hiddenAudioElement.current.play().catch(() => console.log());
            } catch (error) {
            }
          }
          hiddenAudioElement.current.muted = false;
        }
      });
  }


  useEffect(() => {
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
              setRoomName(res.name);
              setVotesToSkip(parseInt(res.votes_to_skip));
              votesToSkip = parseInt(res.votes_to_skip);
              setCurrentVotes(parseInt(res.current_votes));
              currentVotes = parseInt(res.current_votes);
              startTime = res.song_start_time;
              songId = parseInt(res.current_song);
              playlist = res.playlist;
              let song = getSongFromPlaylist();
              let nextSong = getNextSongFromPlaylist();
              if (!!song) {
                setSongUrl(song.song_url);
                setCoverUrl(song.cover_art_url);
                setSongName(song.title + " - " + song.artist);
                setNextSong(nextSong.title + " - " + nextSong.artist);
              }

            });
          hiddenAudioElement.current.play().catch(() => console.log());
          hiddenAudioElement.current.muted = false;
          intervalId1 = setInterval(getRoomInfo, 1500);
          intervalId2 = setInterval(updateRoom, 1000);
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
          <audio ref={hiddenAudioElement} onEnded={handleSongEnd} src={songUrl}></audio>
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
              <Button disabled={voteCasted} onClick={handleSkip} color="success">
                <MdSkipNext />
                {currentVotes}/{votesToSkip}
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
        <Button className="back" onClick={() => history.goBack()} color="danger"> <BiArrowBack /> Back</Button>
        <Button className="upload" onClick={toggle} color="primary"> <FiUpload /> Upload Song</Button>
      </div>

      <Modal isOpen={modal} toggle={toggle} >
        <ModalHeader toggle={toggle}>
          Upload Song
        </ModalHeader>
        <ModalBody>
          <UploadLocalSong toggle={toggle} />
        </ModalBody>
      </Modal>
    </div>
  );
}

export default Room;