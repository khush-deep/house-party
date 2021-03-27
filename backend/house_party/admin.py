from django.contrib import admin

from .models import Song, Room, Playlist

# Register your models here.
admin.site.register(Song)
admin.site.register(Room)
admin.site.register(Playlist)