from django.contrib import admin

# Register your models here.
from .models import Dataset, ChatSession, Message

admin.site.register(Dataset)
admin.site.register(ChatSession)
admin.site.register(Message)