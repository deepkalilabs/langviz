#! /usr/bin/env python3
from django.db import models
from django.db.models import Manager
from accounts.models import User
import uuid

class DatasetManager(Manager):
    def get(self, *args, **kwargs):
        obj = super().get(*args, **kwargs)
        # You can add custom logic here if needed
        return obj

class Dataset(models.Model):
    name = models.CharField(max_length=200, null=True, blank=True)
    description = models.TextField()
    uri = models.TextField()
    enriched_columns_properties = models.JSONField(null=True, blank=True)
    enriched_dataset_schema = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    objects = DatasetManager()
    
    def __str__(self):
        return self.name
    
    def get_object(self):
        return self


class ChatSession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    main_dataset = models.ForeignKey(Dataset, on_delete=models.CASCADE, null=True, blank=True, related_name='chat_sessions')
    session_id = models.UUIDField(default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return str(self.session_id)

class Message(models.Model):
    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, null=True, blank=True)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.message

