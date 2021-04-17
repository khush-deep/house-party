import { useState, useRef } from "react";
import { Button, Col, Input, Row } from "reactstrap";
import { Spinner } from 'reactstrap';

import "./UploadLocalSong.css";

function UploadLocalSong(props) {
  let [songTitle, setSongTitle] = useState("");
  let [songArtist, setSongArtist] = useState("");
  let [songFilename, setSongFilename] = useState("No file chosen");
  let [coverFilename, setCoverFilename] = useState("");
  let [songFile, setSongFile] = useState(null);
  let [coverFile, setCoverFile] = useState(null);
  let [uploading, setUploadState] = useState(true);
  const hiddenSongInput = useRef(null);
  const hiddenCoverInput = useRef(null);

  const handleSongFile = event => {
    const file = event.target.files[0];
    setSongFile(file);
    setSongFilename(file.name);
  };
  const handleCoverFile = event => {
    const file = event.target.files[0];
    setCoverFile(file);
    setCoverFilename(file.name);
  };

  function handleUpload() {
    if (songTitle.trim() === "") {
      alert("Song title is required"); return;
    }
    if (songArtist.trim() === "") {
      alert("Song artist is required"); return;
    }
    if (songFile === null) {
      alert("Choose song file first"); return;
    }
    let fd = new FormData();
    fd.append("title", songTitle);
    fd.append("artist", songArtist);
    fd.append("song", songFile);
    if (coverFile) fd.append("cover", coverFile);
    setUploadState(true);
    fetch("/api/upload/local", {
      method: "POST",
      body: fd,
    }).then(res => {
      setUploadState(false);
      if (res.status !== 201) {
        res.json().then(res => alert(res.error));
      }
      else {
        res.json().then(res => alert("Song Uploaded!"));
      }
    });
  }
  return (
    <div>
      <Row>
        <Col>
          <h6>Title</h6>
          <Input
            placeholder="Song Title"
            value={songTitle}
            onChange={e => setSongTitle(e.target.value)}
          />
        </Col>
        <Col>
          <h6>Artist</h6>
          <Input
            placeholder="Song Artist"
            value={songArtist}
            onChange={e => setSongArtist(e.target.value)}
          />
        </Col>
      </Row><br />
      <Row>
        <Col>
          <h6>Song</h6>
          <Button color="danger" onClick={(e) => hiddenSongInput.current.click()}>
            Choose file
                    </Button>
          <input
            type="file"
            ref={hiddenSongInput}
            onChange={handleSongFile}
            style={{ display: 'none' }}
          />
          <div>
            {songFilename}
          </div>
        </Col>
        <Col>
          <h6>Cover image (Optional)</h6>
          <Button color="danger" onClick={(e) => hiddenCoverInput.current.click()}>
            Choose file
                    </Button>
          <input
            type="file"
            ref={hiddenCoverInput}
            onChange={handleCoverFile}
            style={{ display: 'none' }}
          />
          <div>
            {coverFilename}
          </div>
        </Col>
      </Row>
      <hr />
      <div className="footer">
        <Button color="primary" disabled={uploading} onClick={handleUpload}>
          Submit {uploading && <Spinner size="sm" color="light" style={{ marginBottom: "2px" }} />}
        </Button>
        <Button color="secondary" onClick={props.toggle}>
          Cancel
                </Button>
      </div>
    </div>
  );
}

export default UploadLocalSong;