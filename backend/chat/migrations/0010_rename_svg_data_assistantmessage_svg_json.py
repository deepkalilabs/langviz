# Generated by Django 5.1.1 on 2024-10-15 22:35

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('chat', '0009_delete_message'),
    ]

    operations = [
        migrations.RenameField(
            model_name='assistantmessage',
            old_name='svg_data',
            new_name='svg_json',
        ),
    ]
