# Generated by Django 5.1.1 on 2024-10-23 03:32

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('chat', '0013_remove_usermessage_reply_to_assistant_message_and_more'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='dataset',
            name='uri',
        ),
        migrations.AddField(
            model_name='dataset',
            name='publicUrl',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='dataset',
            name='s3Uri',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='dataset',
            name='description',
            field=models.TextField(blank=True, null=True),
        ),
    ]
