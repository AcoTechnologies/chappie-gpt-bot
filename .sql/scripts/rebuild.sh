#!/usr/bin/bash

# teardown the database using the teardown.sql script
psql -h db -U postgres -d bot -f .sql/scripts/teardown.sql

# reinitialize the database using the init.sql script
psql -h db -U postgres -d bot -f .sql/scripts/init.sql

# run the db-init command to initialize the database
bun db-init