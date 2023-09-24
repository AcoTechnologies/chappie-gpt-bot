FROM oven/bun:1.0

# copy package.json, package-lock.json, and bun.lockb
COPY package.json /app/package.json
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
