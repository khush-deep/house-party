import json
import logging
import random
import string
from datetime import datetime
from http import HTTPStatus

from django.db.models import F
from django.http.response import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie

from .models import Playlist, Room, Song
from .utils.cloud_storage_helper import get_item_url, upload_to_bucket
from .utils.serializers import custom_serializer

# Create your views here.


def get_rooms(request):
    rooms = custom_serializer(Room.objects.all(), fields=("name", "code"))
    return JsonResponse(rooms, safe=False)


def get_room_info(request, id):
    playlists = Playlist.objects.all()
    playlist = [song for song in playlists if song.room.id == id]
    if playlist:
        room = playlist[0].room
    else:
        room = Room.objects.get(id=id)
    for i in range(len(playlist)):
        playlist[i] = playlist[i].song
    res = custom_serializer([room])[0]
    res["playlist"] = custom_serializer(playlist)
    return JsonResponse(res)


@ensure_csrf_cookie
def create_room(request):
    data = json.loads(request.body)
    room_code = data.get("code")
    if not room_code:
        room_code = ''.join(random.choices(
            string.ascii_uppercase + string.digits, k=6))

    if Room.objects.filter(code=room_code).exists():
        res = {"error": "Room already exists"}
        return JsonResponse(res, status=HTTPStatus.CONFLICT)

    if data.get("votes_to_skip") and int(data["votes_to_skip"]) < 1:
        res = {"error": "Votes to skip should be greater than 0"}
        return JsonResponse(res, status=HTTPStatus.BAD_REQUEST)

    songs = list(Song.objects.all())
    random.shuffle(songs)
    current_song = songs[0] if songs else None
    room = Room(
        name=data.get("name", room_code),
        code=room_code,
        votes_to_skip=int(data.get("votes_to_skip", 1)),
        current_votes=0,
        current_song=current_song,
        song_start_time=datetime.now()
    )
    room.save()
    playlist = []
    for song in songs:
        playlist.append(Playlist(
            room=room,
            song=song
        ))
    Playlist.objects.bulk_create(playlist)

    res = custom_serializer([room])[0]
    res["playlist"] = custom_serializer(songs)
    return JsonResponse(res, status=HTTPStatus.CREATED)


@ensure_csrf_cookie
def update_room(request, id):
    data = json.loads(request.body)
    added_votes = 1 if data.get("increase_votes") else 0
    fields = {
        "current_votes": F("current_votes") + added_votes
    }
    if data.get("change_song"):
        fields["current_song"] = data["current_song"]
        fields["song_start_time"] = datetime.now()
    Room.objects.filter(id=id).update(**fields)
    return get_room_info(request, id)


def upload_local_song(request):
    data = request.POST
    files = request.FILES
    song_file = files.get("song")
    if not song_file or not data.get("title"):
        res = {"error": "Insufficient data"}
        return JsonResponse(res, HTTPStatus.BAD_REQUEST)
    song_filename = data["title"] + " - " + data.get("artist", "") + ".mp3"
    success, message = upload_to_bucket(song_filename, song_file)
    if not success:
        logging.error(message)
        res = {"error": "Error while uploading song"}
        return JsonResponse(res, status=HTTPStatus.INTERNAL_SERVER_ERROR)

    cover_file = files.get("cover")
    cover_filename = data["title"] + " - " + data.get("artist", "") + ".jpg"
    success, message = upload_to_bucket(cover_filename, cover_file)
    if not success:
        logging.error(message)
        res = {"error": "Error while uploading cover art"}
        return JsonResponse(res, status=HTTPStatus.INTERNAL_SERVER_ERROR)

    song = Song(
        title=data["title"],
        artist=data.get("artist", ""),
        song_url=get_item_url(song_filename),
        cover_art_url=get_item_url(cover_filename)
    )
    song.save()

    def append_song_to_playlists(song):
        rooms = Room.objects.all()
        playlists = []
        for room in rooms:
            playlists.append(Playlist(
                room=room,
                song=song
            ))
        Playlist.objects.bulk_create(playlists)
    append_song_to_playlists(song)

    res = {"message": "Song uploaded"}
    return JsonResponse(res, status=HTTPStatus.CREATED)
