from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
# router.register(r'datasets', views.DatasetViewSet)
# router.register(r'chat-sessions', views.ChatSessionViewSet)
# router.register(r'messages', views.MessageViewSet)

urlpatterns = [
    # path('', include(router.urls)),
    path('chat-sessions/', views.ChatSession.as_view(), name='chat-sessions'),
    path('chat-sessions/message/', views.ChatSessionMessage.as_view(), name='chat-sessions-message'),
    # path('chat-sessions/<int:pk>/send-message/', views.ChatSessionViewSet.as_view({'post': 'send_message'}), name='chat-send-message'),
    # path('chat-sessions/<int:pk>/chat-history/', views.ChatSessionViewSet.as_view({'get': 'chat_history'}), name='chat-history'),
]