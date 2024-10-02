from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

# Create your models here.
class DataSet(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    #data_connection = models.ForeignKey(DataConnection, on_delete=models.SET_NULL, null=True)
    data = models.JSONField()
    uploaded_at = models.DateTimeField(auto_now_add=True)
    name = models.CharField(max_length=255)
    #file_type = models.CharField(max_length=50)

    def __str__(self):
        return f"{self.file_name} uploaded by {self.user.username}"