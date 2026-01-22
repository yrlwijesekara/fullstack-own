FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
ENV PORT=5008
EXPOSE 5008
CMD ["npm","start"]
