# Generated by Django 5.1.1 on 2024-10-16 20:23

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('chat', '0012_alter_usermessage_reply_to_assistant_message'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='usermessage',
            name='reply_to_assistant_message',
        ),
        migrations.AddField(
            model_name='assistantmessage',
            name='parent_user_message',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='assistant_messages', to='chat.usermessage'),
        ),
    ]