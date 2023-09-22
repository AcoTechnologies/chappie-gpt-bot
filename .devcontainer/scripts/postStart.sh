#!/usr/bin/bash

# Function to test PostgreSQL connection
test_postgres_connection() {
    ok=$(psql -h db -U postgres -d "$1" -c "SELECT 1" 2>&1)
    if [[ $ok == *"error"* ]]; then
        return 1  # Connection failed
    else
        return 0  # Connection successful
    fi
}

# install/update dependencies (corrected command)
bun install

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
echo "PostgreSQL connection successful for database postgres"

# Check PostgreSQL connection to database bot
echo "Testing PostgreSQL connection for database bot..."
if ! test_postgres_connection bot; then
    echo "Database bot not found, creating one..."
    psql -h db -U postgres -d postgres -c "CREATE DATABASE bot;"
    psql -h db -U postgres -d bot -f .sql/init.sql
    bun .sql/init.js  # Use the correct command for your JavaScript backend
fi
echo "PostgreSQL connection successful for database bot"
