import { useEffect, useState } from "react";
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
  let [name, setName] = useState(props.location.name || "");
  let [votesToSkip, setVotesToSkip] = useState(1);
  let [currentVotes, setCurrentVotes] = useState(0);
  let [coverUrl, setCoverUrl] = useState(defaultCoverUrl);
  let [songName, setSongName] = useState("No song to play! Add songs to library");
  let [nextSongName, setNextSong] = useState("next-song");

  function getSongFromPlaylist(currentSongId, playlist) {
    for (const song of playlist) {
      if (song.id === currentSongId) {
        return song;
      }
    }
  }

  function toggle() {
    setModal(!modal);
  }
  useEffect(() => {
    fetch("/api/get-room-info/" + code)
      .then(res => {
        if (res.status !== 200) {
          setCode("");
          res.json().then(res => alert(res.error));
        }
        else {
          res.json()
            .then(res => {
              setName(res.name);
              setVotesToSkip(res.votes_to_skip);
              setCurrentVotes(res.current_votes);
              let song = getSongFromPlaylist(res.current_song, res.playlist);
              if (!!song) {
                setSongName(song.title + " - " + song.artist);
                setCoverUrl(song.cover_art_url);
              }
            })
        }
      })
  }, [])
  return (
    <div className="room">
      <h3>{name}</h3><br />
      {code ? (
        <div className="room_available">
          <div className="cover" >
            <img src={coverUrl} alt="Thumbnail" />
          </div>
          <div className="song_detail">
            {songName}
          </div>
          <div className="playback_bar">
            <div className="progress_bar">
              <div className="playback_time">
                <div className="progress_time">
                  0:00
                </div>
                <div className="playback_duration">
                  1:00
                </div>
              </div>
              <progress max="2" value="0.5"></progress>
            </div>
            <div className="skip">
              <Button color="success" style={{}}>
                <MdSkipNext />
                {currentVotes}/{votesToSkip}
              </Button>
              <div className="tooptip">
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