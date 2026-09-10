FROM node:22-alpine

ENV NODE_ENV=production
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY index.html privacy.html terms.html styles.css script.js ./
COPY server ./server

USER node
EXPOSE 3000
CMD ["node", "server/app.js"]
