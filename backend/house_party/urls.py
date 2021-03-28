from django.urls import path

from . import views

urlpatterns = [
    path("get-rooms", views.get_rooms, name="get-rooms"),
    path("get-room-info/<int:id>", views.get_room_info, name="get-room-info"),
    path("update-room/<int:id>", views.update_room, name="update-room"),
    path("create-room", views.create_room, name="create-room"),
]