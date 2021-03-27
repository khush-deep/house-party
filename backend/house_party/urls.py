from django.urls import path

from . import views

urlpatterns = [
    path("get-rooms", views.get_rooms, name="get-rooms"),
    path("create-room", views.create_room, name="create-room"),
]