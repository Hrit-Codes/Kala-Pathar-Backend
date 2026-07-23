# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

#RUN npm install 
 RUN npm ci 

COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --only=production
COPY --from=builder /app/dist ./dist
RUN mkdir -p uploads/profile-images
EXPOSE 8888
CMD ["npm", "start"]