#!usr/bin/env bash

# install dependencies
bun install

# check if bot/auth.json exists
if [ ! -f "bot/auth.json" ]; then
    echo "auth.json not found, creating one..."
    cp bot/auth.json.example bot/auth.json
fi

# check if bot/openai.json exists
if [ ! -f "bot/openai.json" ]; then
    echo "openai.json not found, creating one..."
    cp bot/openai.json.example bot/openai.json
fi