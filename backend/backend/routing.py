from django.urls import re_path
from chat import consumers

urlpatterns = [
    re_path(r"ws/chat/$", consumers.ChatConsumer.as_asgi())
]