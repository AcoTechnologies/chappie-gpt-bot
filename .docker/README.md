# Docker Configuration for Your Bot

This directory contains the Docker configuration files for your bot application. These files are used to build a Docker image of your bot, which can then be run as a containerized application.

## Dockerfile

The Dockerfile (`Dockerfile`) defines the steps to create the Docker image for your bot. Here's a breakdown of what it does:

```markdown
1. It uses the `debian:bullseye-slim` as the base image.
2. Installs `curl` and the `bun` package manager.
3. Copies your `package.json`, `package-lock.json`, and `bun.lockb` files to the `/app` directory in the image.
4. Sets the working directory to `/app`.
5. Installs the bot's dependencies using `bun install`.
6. Copies your bot's source code from the `bot` directory to `/app`.
7. Copies the `deploy.sh` script from the `.docker/scripts` directory to `/app`.
8. Makes the `deploy.sh` script executable.
9. Sets the command to run the bot using `./deploy.sh`.
```

## deploy.sh

The `deploy.sh` script is a bash script that handles the deployment and execution of your bot. Here's what it does:

```markdown
1. Checks if the required environment variables (`DISCORD_BOT_TOKEN`, `DISCORD_CLIENT_ID`, `OPENAI_API_KEY`, and `DATABASE_URL`) are set. If any of them are missing, it prints an error message and exits with a non-zero status code.
2. Tests the PostgreSQL connection to the `postgres` database and retries if the connection fails.
3. Tests the PostgreSQL connection to the `bot` database and creates it if it doesn't exist. It also runs database migrations if the database exists.
4. Finally, it starts the bot using `./deploy.sh`.
```

Make sure to set the required environment variables before running the container.

## Building and Running the Docker Image

To build and run the Docker image for your bot, follow these steps:

1. Navigate to the directory containing this `README.md` file.

2. Build the Docker image:

```bash
docker build -t your-bot-image .
```

   Replace `your-bot-image` with a suitable image name.

3. Run the Docker container:

```bash
docker run -e DISCORD_BOT_TOKEN=<your_token> -e DISCORD_CLIENT_ID=<your_client_id> -e OPENAI_API_KEY=<your_api_key> -e DATABASE_URL=<your_database_url> your-bot-image
```

   Replace `<your_token>`, `<your_client_id>`, `<your_api_key>`, and `<your_database_url>` with your bot's specific configuration.

### Docker Compose

Example `docker-compose.yml` file:
```yaml
version: '3'
services:
  bot:
    build:
      context: .
      dockerfile: .docker/Dockerfile
    environment:
      - DISCORD_BOT_TOKEN=<your_token>
      - DISCORD_CLIENT_ID=<your_client_id>
      - OPENAI_API_KEY=<your_api_key>
      - DATABASE_URL=<your_database_url>
    depends_on:
      - db
  db:
    image: postgres:latest
    environment:
      - POSTGRES_DB=bot
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=your_password

```