#!usr/bin/env bash

# install dependencies
bun install

# check if bot/config/config.json exists
if [ ! -f "bot/config/config.json" ]; then
    echo "auth.json not found, creating one..."
    cp bot/auth.json.example bot/auth.json
fi

# check if .sql/init.json exists
if [ ! -f ".sql/init.json" ]; then
    echo "init.json not found, creating one..."
    cp .sql/init.json.example .sql/init.json
fi