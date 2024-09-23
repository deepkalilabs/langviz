#!/bin/sh

set -e

# Wait for the database to be ready
if [ "$POSTGRES_DB" != "" ]
then
    echo "Waiting for postgres..."

    while ! nc -z db 5432; do
      sleep 0.1
    done

    echo "PostgreSQL started"
fi

echo "Current directory contents:"
ls -la

cd backend
echo "Backend directory contents:"
ls -la

# Run migrations
python manage.py migrate
python manage.py createsuperuser --noinput || true
# Start server
exec python manage.py runserver 0.0.0.0:8000
