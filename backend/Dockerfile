FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package.json ./

# Install application dependencies inside Docker container
RUN npm install

# Copy application source
COPY tsconfig.json ./
COPY src/ ./src/

# Expose backend port
EXPOSE 4000

# Default command runs tsx watch for seamless development
CMD ["npm", "run", "dev"]
