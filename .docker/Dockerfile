FROM debian:bullseye-slim

#install curl, then bun
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends curl \
    && BUN_INSTALL=/usr/local \
    && -fsSL https://bun.sh/install | bash \
    && apt-get clean 

# copy package.json, package-lock.json, and bun.lockb
COPY package.json /app/package.json
COPY package-lock.json /app/package-lock.json
COPY bun.lockb /app/bun.lockb

# set working directory
WORKDIR /app

# install dependencies with bun install
RUN cd /app && bun install

# copy the bot source code
COPY bot /app/bot

# copy the deploy.sh script
COPY .docker/scripts/deploy.sh /app/deploy.sh

# run the deploy.sh script
RUN chmod +x /app/deploy.sh

# run the bot
CMD ["./deploy.sh"]
