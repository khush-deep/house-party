from django.urls import path

from . import views

urlpatterns = [
    path("get-rooms", views.get_rooms, name="get-rooms"),
    path("get-room-info/<str:code>", views.get_room_info, name="get-room-info"),
    path("update-room/<str:code>", views.update_room, name="update-room"),
    path("create-room", views.create_room, name="create-room"),
    path("upload/local", views.upload_local_song, name="upload-local-song"),
]