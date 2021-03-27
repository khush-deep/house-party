from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie

from http import HTTPStatus
import random
import string

from .models import Room, Song, Playlist
from .utils.serializers import custom_serializer
# Create your views here.

def get_rooms(request):
    rooms = custom_serializer(Room.objects.all(), fields=("name","code"))
    return JsonResponse(rooms, safe=False)

@ensure_csrf_cookie
def create_room(request):
    data = request.POST
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
        current_song=current_song
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