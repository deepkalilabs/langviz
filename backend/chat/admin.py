from django.contrib import admin

# Register your models here.
from .models import Dataset, ChatSession, UserMessage, AssistantMessage

admin.site.register(Dataset)
admin.site.register(ChatSession)
admin.site.register(UserMessage)
admin.site.register(AssistantMessage)