# Generated by Django 5.1.1 on 2024-11-12 19:17

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('chat', '0016_alter_assistantmessage_session_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='assistantmessage',
            name='extra_attrs',
            field=models.JSONField(blank=True, null=True),
        ),
    ]
