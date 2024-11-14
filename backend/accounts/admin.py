from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

class CustomUserAdmin(UserAdmin):
    # Add these fields to the existing list_display
    list_display = UserAdmin.list_display + ('is_verified', 'is_google_account')
    # Add these fields to the existing fieldsets
    fieldsets = UserAdmin.fieldsets + (
        ('Verification', {'fields': ('is_verified', 'is_google_account')}),
    )

admin.site.register(User, CustomUserAdmin)

# Register your models here.
