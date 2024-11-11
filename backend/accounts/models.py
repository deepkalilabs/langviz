from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    """
    User model for authentication and authorization.

    NOTE: This model explicitly inherits from AbstractUser which contains fields for username, email, and password.
    """
    is_verified = models.BooleanField(default=False)
    # Verification token for email verification
    verification_token = models.CharField(max_length=255, null=True, blank=True)

    #Google Auth
    google_id = models.CharField(max_length=255, null=True, blank=True)
    google_access_token = models.TextField(null=True, blank=True)
    google_refresh_token = models.TextField(null=True, blank=True)
    is_google_account = models.BooleanField(default=False)


    def __str__(self):
        return self.email
    

