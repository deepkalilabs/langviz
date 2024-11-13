from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SignupView, LoginView, GoogleAuthView, VerifyEmailView

router = DefaultRouter()
# Add your viewsets here, for example:
# router.register(r'users', views.UserViewSet)

urlpatterns = [
    path('v1/signup', SignupView.as_view(), name='signup'),
    path('v1/login', LoginView.as_view(), name='login'),
    path('v1/google-auth', GoogleAuthView.as_view(), name='google-auth'),
    path('v1/verify-email', VerifyEmailView.as_view(), name='verify-email'),
    # Add any additional URL patterns for the accounts app here
]