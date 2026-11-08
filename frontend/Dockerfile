FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package.json ./

# Install npm dependencies inside Docker container
RUN npm install

# Copy source code
COPY index.html tsconfig.json vite.config.ts tailwind.config.js postcss.config.js ./
COPY src/ ./src/

# Expose Vite frontend port
EXPOSE 3000

# Run dev server with hot module replacement
CMD ["npm", "run", "dev"]

