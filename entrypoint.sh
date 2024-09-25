#!/bin/sh

set -e

while ! nc -z db 5432; do
  sleep 1
done

python manage.py migrate

# Create superuser
python manage.py createsuperuser --noinput \
    --username $DJANGO_SUPERUSER_USERNAME \
    --email $DJANGO_SUPERUSER_EMAIL || true

# Start server
python manage.py runserver 0.0.0.0:8000

exec "$@"
