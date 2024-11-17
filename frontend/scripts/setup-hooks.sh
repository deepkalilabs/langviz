#!/bin/sh

# Get the git root directory
GIT_ROOT=$(git rev-parse --git-dir)

# Create symbolic link from .git/hooks to our .hooks directory
ln -sf "../.hooks/pre-commit" "$GIT_ROOT/hooks/pre-commit"
chmod +x ../.hooks/pre-commit

echo "Git hooks installed succesfully!"
