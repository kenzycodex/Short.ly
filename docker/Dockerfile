FROM node:16-alpine

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Bundle app source
COPY . .

# Expose the port
EXPOSE 3000

# Start the app
CMD ["npm", "run", "dev"]