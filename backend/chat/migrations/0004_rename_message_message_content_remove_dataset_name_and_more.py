# Generated by Django 5.1.1 on 2024-10-02 17:28

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('chat', '0003_dataset_alter_chatsession_user_alter_message_session_and_more'),
    ]

    operations = [
        migrations.RenameField(
            model_name='message',
            old_name='message',
            new_name='content',
        ),
        migrations.RemoveField(
            model_name='dataset',
            name='name',
        ),
        migrations.AlterField(
            model_name='chatsession',
            name='main_dataset',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='chat_sessions', to='chat.dataset'),
        ),
    ]
