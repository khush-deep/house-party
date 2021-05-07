import json
import logging
import random
import string
from datetime import datetime, timezone
from http import HTTPStatus
import time

from django.db.models import F
from django.http.response import JsonResponse

from .models import Room, Song
from .utils.cloud_storage_helper import get_item_url, upload_to_bucket
from .utils.serializers import custom_serializer

# Create your views here.


def get_rooms(request):
    start_time = time.time()
    rooms = custom_serializer(Room.objects.all(), fields=("name", "code"), primary_key="code")
    print("Time for get_rooms: ", time.time() - start_time)
    return JsonResponse(rooms, safe=False)


def get_room_info(request, code):
    start_time = time.time()
    room = Room.objects.filter(code=code).prefetch_related("songs").first()
    if not room:
        res = {"error": "Room not found!"}
        return JsonResponse(res, status=HTTPStatus.NOT_FOUND)

    res = custom_serializer([room], primary_key="code")[0]
    res["playlist"] = custom_serializer(room.songs.all())
    res["time"] = datetime.now(tz=timezone.utc)
    print("Time for get_room_info: ", time.time() - start_time)
    return JsonResponse(res)


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
        current_song=current_song.id if current_song else None,
        song_start_time=datetime.fromtimestamp(0, tz=timezone.utc)
    )
    room.save()
    for song in songs:
        room.songs.add(song)

    res = custom_serializer([room], primary_key="code")[0]
    res["playlist"] = custom_serializer(songs)
    return JsonResponse(res, status=HTTPStatus.CREATED)


def update_room(request, code):
    data = json.loads(request.body)
    added_votes = 1 if data.get("increase_votes") else 0
    fields = {
        "current_votes": F("current_votes") + added_votes
    }

    if data.get("change_song"):
        fields["current_song"] = data["current_song"]
        fields["song_start_time"] = data.get("song_start_time", datetime.now(tz=timezone.utc))
        fields["current_votes"] = 0

    Room.objects.filter(code=code).update(**fields)

    res = {"message": "Room updated"}
    return JsonResponse(res)


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

    if cover_file:
        cover_filename = data["title"] + " - " + data.get("artist", "") + ".jpg"
        success, message = upload_to_bucket(cover_filename, cover_file)
        if not success:
            logging.error(message)
            res = {"error": "Error while uploading cover art"}
            return JsonResponse(res, status=HTTPStatus.INTERNAL_SERVER_ERROR)
    else:
        cover_filename = "default-cover.jpg"

    song = Song(
        title=data["title"],
        artist=data.get("artist", ""),
        song_url=get_item_url(song_filename),
        cover_art_url=get_item_url(cover_filename)
    )
    song.save()

    code = data["code"]

    room = Room.objects.filter(code=code).first()
    if not room:
        res = {"error": "Room not found!"}
        return JsonResponse(res, status=HTTPStatus.NOT_FOUND)
        
    room.songs.add(song)
    if not room.current_song:
        room.current_song = song.id
        room.save()

    res = {"message": "Song uploaded"}
    return JsonResponse(res, status=HTTPStatus.CREATED)
