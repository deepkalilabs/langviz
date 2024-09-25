#!/bin/bash

# Stop all running containers
echo "Stopping all running containers..."
docker compose down

# Remove all build cache
echo "Removing Docker build cache..."
docker builder prune -a -f

docker compose logs -f
