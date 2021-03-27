from django.db import models

# Create your models here.
class Song(models.Model):
    title = models.CharField(max_length=100)
    artist = models.CharField(max_length=100)
    song_url = models.CharField(max_length=300)
    cover_art_url = models.URLField(max_length=300)

    def __str__(self) -> str:
        return self.title + "-" + self.artist

class Room(models.Model):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=10)
    votes_to_skip = models.IntegerField()
    current_votes = models.IntegerField()
    current_song = models.ForeignKey(Song, on_delete=models.PROTECT, null=True)
    song_start_time = models.TimeField(auto_now_add=True)

    def __str__(self) -> str:
        return self.code

class Playlist(models.Model):
    room = models.ForeignKey(Room, on_delete=models.CASCADE)
    song = models.ForeignKey(Song, on_delete=models.CASCADE)

    def __str__(self) -> str:
        return self.room.__str__() + ":" + self.song.__str__()