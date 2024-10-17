#!/bin/bash

# Stop all running containers
echo "Stopping all running containers..."
docker compose down

# Remove all build cache
echo "Removing Docker build cache..."
docker builder prune -a -f

docker compose logs -f

Only run this if ur sure u wanna delete everything.
# docker system prune -a --volumes

