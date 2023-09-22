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

# no need to check if .devcontainer/devcontainer.env exists, it is checked in initialize process
# read .devcontainer/devcontainer.env,
# if the first line contains "EXAMPLE", then start a user prompt session to fill in the blanks, or skip and set later
# if the first line does not contain "EXAMPLE", then continue

first_line=$(head -n 1 .devcontainer/devcontainer.env)
if [[ $first_line == *"EXAMPLE"* ]]; then
    echo "devcontainer.env is not configured, please fill in the blanks"
    echo "Press enter to continue, leave ALL blank to set later"
    read

    # getting the bot client id
    echo "Please enter the bot client id:"
    read client_id 

    # getting the bot token
    echo "Please enter the bot token:"
    read token

    # getting the users id
    echo "Please enter the your discord ID:"
    read user_id

    # getting the guild id
    echo "Please enter the guild ID:"
    read guild_id

    # getting the openai api key
    echo "Please enter the openai api key:"
    read openai_key

    # checking if all the values are blank
    if [[ -z $client_id && -z $token && -z $user_id && -z $guild_id && -z $openai_key ]]; then
        echo "All values are blank, skipping..."
    else
        # replacing the values in the file
        sed -i "s/ID_NOT_SET/$client_id/g" .devcontainer/devcontainer.env
        sed -i "s/TOKEN_NOT_SET/$token/g" .devcontainer/devcontainer.env
        sed -i "s/OWNER_ID_NOT_SET/$user_id/g" .devcontainer/devcontainer.env
        sed -i "s/GUILD_ID_NOT_SET/$guild_id/g" .devcontainer/devcontainer.env
        sed -i "s/API_KEY_NOT_SET/$openai_key/g" .devcontainer/devcontainer.env

        # remove the first line
        sed -i '1d' .devcontainer/devcontainer.env
    fi
fi
