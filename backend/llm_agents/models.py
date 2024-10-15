from django.db import models
from chat.models import UserMessage, Dataset
    
class Vizualization(models.Model):
    question = models.ForeignKey(UserMessage, on_delete=models.CASCADE)
    name = models.CharField(max_length=200)
    js_code = models.TextField()
    description = models.TextField()
    contract = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name
    
class DerivedDataset(models.Model):
    visualization = models.ForeignKey(Vizualization, on_delete=models.CASCADE)
    name = models.CharField(max_length=200)
    description = models.TextField()
    uri = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name