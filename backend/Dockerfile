FROM node:20
WORKDIR /app

# 1. Build the React frontend
COPY frontend/ ./client/
WORKDIR /app/client
RUN npm install
RUN npm run build

# 2. Move the build where the backend expects it
RUN mv build /app/client-build

# 3. Install the backend
WORKDIR /app
COPY backend/ ./
RUN npm install

# 4. Start the server
CMD ["npm", "start"]
