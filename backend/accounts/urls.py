from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
# Add your viewsets here, for example:
# router.register(r'users', views.UserViewSet)

urlpatterns = [
    path('', include(router.urls)),
    # Add any additional URL patterns for the accounts app here
]