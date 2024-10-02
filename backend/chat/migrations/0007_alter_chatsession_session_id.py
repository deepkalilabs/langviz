# Generated by Django 5.1.1 on 2024-10-02 21:03

import uuid
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('chat', '0006_dataset_name'),
    ]

    operations = [
        migrations.AlterField(
            model_name='chatsession',
            name='session_id',
            field=models.UUIDField(default=uuid.uuid4, editable=False),
        ),
    ]