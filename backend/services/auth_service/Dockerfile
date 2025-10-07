FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

# Install nodemon globally
RUN npm install -g nodemon

COPY . .

EXPOSE 3001

CMD ["nodemon", "src/index.ts"]