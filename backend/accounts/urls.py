from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SignupView, LoginView, GoogleAuthView, VerifyEmailView

router = DefaultRouter()
# Add your viewsets here, for example:
# router.register(r'users', views.UserViewSet)

urlpatterns = [
    path('api/v1/accounts/signup', SignupView.as_view(), name='signup'),
    path('api/v1/accounts/login', LoginView.as_view(), name='login'),
    path('api/v1/accounts/google-auth', GoogleAuthView.as_view(), name='google-auth'),
    path('api/v1/accounts/verify-email/<str:token>', VerifyEmailView.as_view(), name='verify-email'),
    # Add any additional URL patterns for the accounts app here
]