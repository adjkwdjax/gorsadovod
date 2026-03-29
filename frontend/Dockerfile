FROM node:20-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --include=optional
RUN npm install lightningcss-linux-x64-gnu@1.30.1 @tailwindcss/oxide-linux-x64-gnu@4.1.11 --no-save

COPY . .

RUN npm run build
RUN npm install -g serve

EXPOSE 3000

CMD ["serve", "-s", "out", "-l", "3000"]
