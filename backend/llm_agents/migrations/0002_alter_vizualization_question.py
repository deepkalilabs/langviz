# Generated by Django 5.1.1 on 2024-10-15 19:47

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('chat', '0008_remove_message_session_assistantmessage_usermessage'),
        ('llm_agents', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='vizualization',
            name='question',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='chat.usermessage'),
        ),
    ]
