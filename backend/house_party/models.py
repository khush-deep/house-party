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
    code = models.CharField(max_length=10, primary_key=True)
    votes_to_skip = models.IntegerField()
    current_votes = models.IntegerField()
    songs = models.ManyToManyField(Song)
    current_song = models.IntegerField(null=True)
    song_start_time = models.DateTimeField()

    def __str__(self) -> str:
        return self.code
