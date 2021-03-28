import json
import random
import string
from datetime import datetime
from http import HTTPStatus

from django.db.models import F
from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie

from .models import Room, Song, Playlist
from .utils.serializers import custom_serializer
# Create your views here.

def get_rooms(request):
    rooms = custom_serializer(Room.objects.all(), fields=("name","code"))
    return JsonResponse(rooms, safe=False)

def get_room_info(request, id):
    # room = Room.objects.filter(code=code)
    # if not room.exists():
    #     res = {"error": "Room does not exist"}
    #     return JsonResponse(res, status=HTTPStatus.NOT_FOUND)

    # room = room.first()
    # res = custom_serializer([room])[0]
    # playlist = list(Playlist.objects.filter(room=room.id))
    # for i in range(len(playlist)):
    #     playlist[i] = playlist[i].song
    # res["playlist"] = custom_serializer(playlist)
    # return JsonResponse(res)
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
        "current_votes":F("current_votes") + added_votes
    }
    if data.get("change_song"):
        fields["current_song"] = data["current_song"]
        fields["song_start_time"] = datetime.now()
    Room.objects.filter(id=id).update(**fields)
    return get_room_info(request, id)
