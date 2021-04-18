import { useEffect, useState, useRef } from "react";
import { Button, Modal, ModalHeader, ModalBody } from "reactstrap";
import { useHistory } from "react-router-dom";
import { BiArrowBack } from "react-icons/bi";
import { MdSkipNext } from "react-icons/md";
import { FiUpload } from "react-icons/fi";
import UploadLocalSong from "./UploadLocalSong";
import "./Room.css";

const defaultCoverUrl = "https://s3.jp-tok.cloud-object-storage.appdomain.cloud/library-bucket/default-cover.jpg";
const song_url = "https://s3.jp-tok.cloud-object-storage.appdomain.cloud/library-bucket/Something%20just%20like%20this%20-%20Chainsmokers%20ft.%20Coldplay.mp3";

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
  let [startTime, setStartTime] = useState("");
  let [elapsedTime, setElapsedTime] = useState(0);
  let [songDuration, setSongDuration] = useState(0);
  let [nextSongName, setNextSong] = useState("next-song");
  let [voteCasted, setVoteCasted] = useState(false);
  const hiddenAudioElement = useRef(null);

  function formattedTime(timeInSec) {
    return new Date(timeInSec * 1000).toISOString().substr(15, 4);
  }

  function getSongFromPlaylist(currentSongId, playlist) {
    for (const song of playlist) {
      if (song.id === currentSongId) {
        return song;
      }
    }
  }
  function getNextSongFromPlaylist(currentSongId, playlist) {
    const n = playlist.length;
    for (let i = 0; i < n; i++) {
      if (playlist[i].id === currentSongId) {
        return playlist[(i + 1) % n];
      }
    }
  }

  function toggle() {
    setModal(!modal);
  }
  function getRoomInfo() {
    fetch("/api/get-room-info/" + code)
      .then(res => {
        if (res.status === 200) {
          res.json()
            .then(res => {
              console.log("Polled");
              setCurrentVotes(res.current_votes);
              setStartTime(res.song_start_time);
              let song = getSongFromPlaylist(res.current_song, res.playlist);
              let nextSong = getNextSongFromPlaylist(res.current_song, res.playlist);
              if (!!song) {
                setSongUrl(song.song_url);
                setCoverUrl(song.cover_art_url);
                setSongName(song.title + " - " + song.artist);
                setNextSong(nextSong.title + " - " + nextSong.artist);
              }
            });
          hiddenAudioElement.current.play();
          hiddenAudioElement.current.muted = false;
        }
      });
  }

  function updateRoom() {
    console.log("updated");
    setElapsedTime(hiddenAudioElement.current.currentTime || 0);
    setSongDuration(hiddenAudioElement.current.duration || 0);
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
              setVotesToSkip(res.votes_to_skip);
              setCurrentVotes(res.current_votes);
              setStartTime(res.song_start_time);
              let song = getSongFromPlaylist(res.current_song, res.playlist);
              let nextSong = getNextSongFromPlaylist(res.current_song, res.playlist);
              if (!!song) {
                setSongUrl(song.song_url);
                setCoverUrl(song.cover_art_url);
                setSongName(song.title + " - " + song.artist);
                setNextSong(nextSong.title + " - " + nextSong.artist);
              }

            });
          hiddenAudioElement.current.play();
          hiddenAudioElement.current.muted = false;
          intervalId1 = setInterval(getRoomInfo, 3000);
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
          <audio ref={hiddenAudioElement} src={songUrl}></audio>
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