FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npm run prisma:generate

COPY nest-cli.json tsconfig*.json ./
COPY src ./src
RUN npm run build

FROM node:22-alpine AS production-dependencies

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev --omit=optional

FROM node:22-alpine AS runtime

ENV NODE_ENV=production
WORKDIR /app

COPY --from=production-dependencies /app/node_modules ./node_modules
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/dist ./dist
COPY package.json ./
COPY prisma ./prisma

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
