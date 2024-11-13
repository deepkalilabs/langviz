from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

admin.site.register(User, UserAdmin)

# Register your models here.
# Customize UserAdmin to include is_verified and is_google_account fields
UserAdmin.list_display += ('is_verified', 'is_google_account')
UserAdmin.list_filter += ('is_verified', 'is_google_account')
UserAdmin.fieldsets += (
    ('Verification', {'fields': ('is_verified', 'is_google_account')}),
)

