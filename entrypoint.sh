#!/bin/sh

set -e

# while ! netcat -z db 5432; do
#   sleep 1
# done
# TODO: fix /usr/src/app -> /app

cd /usr/src/app

python manage.py makemigrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser --noinput \
    --username $DJANGO_SUPERUSER_USERNAME \
    --email $DJANGO_SUPERUSER_EMAIL || true

# Start server
python manage.py runserver 0.0.0.0:8000

exec "$@"
