FROM mcr.microsoft.com/devcontainers/javascript-node:22

# Install docker CLI and Claude Code as root during image build
RUN apt-get update && apt-get install -y docker.io && rm -rf /var/lib/apt/lists/*
RUN npm install -g @anthropic-ai/claude-code

# Allow node user to use the docker socket
RUN usermod -aG docker node
