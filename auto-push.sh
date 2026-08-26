#!/bin/bash

PROJECT_DIR="$(pwd)"

echo "👀 Watching $PROJECT_DIR for changes..."

while true; do
    inotifywait -r -e modify,create,delete,move \
        --exclude '\.git|target|\.idea|node_modules' \
        "$PROJECT_DIR"

    echo "📝 Change detected. Waiting 5 seconds..."
    sleep 5

    cd "$PROJECT_DIR" || exit

    if [[ -n $(git status --porcelain) ]]; then
        git add .
        git commit -m "YellowDoc upadte commit : $(date '+%Y-%m-%d %H:%M:%S')"
        git push
        echo "✅ Changes pushed!"
    fi
done
