FROM mcr.microsoft.com/devcontainers/base:debian

# [Optional] Uncomment this section to install additional OS packages.
#install ffmpeg,
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends ffmpeg curl

# [Optional] Uncomment if you want to install an additional version of node using nvm
# ARG EXTRA_NODE_VERSION=10
# RUN su node -c "source /usr/local/share/nvm/nvm.sh && nvm install ${EXTRA_NODE_VERSION}"

# [Optional] Uncomment if you want to install more global node modules
# RUN su node -c "npm install -g <your-package-list-here>"

#ENV BUN_INSTALL=/usr/local

#RUN curl -fsSL https://bun.sh/install | bash