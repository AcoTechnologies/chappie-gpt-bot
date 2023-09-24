#!/bin/bash

# check the environment variables: DISCORD_BOT_TOKEN, DISCORD_CLIENT_ID, OPENAI_API_KEY
client_id=$DISCORD_CLIENT_ID
token=$DISCORD_BOT_TOKEN
api_key=$OPENAI_API_KEY
db_url=$DATABASE_URL

# if client id is empty, then print message: "DISCORD_CLIENT_ID is not set"
if [ -z "$client_id" ]
then
    echo "DISCORD_CLIENT_ID is not set"
fi
if [ -z "$token" ]
then
    echo "DISCORD_BOT_TOKEN is not set"
fi
if [ -z "$api_key" ]
then
    echo "OPENAI_API_KEY is not set"
fi
if [ -z "$db_url" ]
then
    echo "DATABASE_URL is not set"
fi
if [ -z "$client_id" ] || [ -z "$token" ] || [ -z "$api_key" ] || [ -z "$db_url" ]
then
    exit 1
fi

# Function to test PostgreSQL connection
test_postgres_connection() {
    ok=$(psql -h db -U postgres -d "$1" -c "SELECT 1" 2>&1)
    if [[ $ok == *"error"* ]]; then
        return 1  # Connection failed
    else
        return 0  # Connection successful
    fi
}

# Check PostgreSQL connection to database postgres
echo "Testing PostgreSQL connection for database postgres..."
if ! test_postgres_connection postgres; then
    echo "PostgreSQL connection failed, retrying in 5 seconds..."
    sleep 5
    if ! test_postgres_connection postgres; then
        echo "PostgreSQL connection failed, please check the logs"
        exit 1
    fi
fi

# Check PostgreSQL connection to database bot
echo "Testing PostgreSQL connection for database bot..."
if ! test_postgres_connection bot; then
    echo "Database bot not found, creating one..."
    psql -h db -U postgres -d postgres -c "CREATE DATABASE bot;"
    bun db-init
    echo "Database bot created successfully, and initialized with provided values"
    exit 0
else
    echo "Database bot found"
    echo "running migrations"
    bun db-migrate
    echo "migrations complete"
fi

# run the bot
echo "Running the bot..."
bun start

# exit with code 0
exit 0