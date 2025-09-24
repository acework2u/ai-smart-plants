# syntax=docker/dockerfile:1.6
FROM node:20-alpine AS base
WORKDIR /usr/src/app
COPY package.json ./
RUN npm install --include=dev
COPY tsconfig.json tsconfig.build.json .eslintrc.cjs .prettierrc ./
COPY src ./src
CMD ["npm", "run", "dev"]

FROM node:20-alpine AS builder
WORKDIR /usr/src/app
COPY package.json ./
RUN npm install
COPY . ./
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /usr/src/app
ENV NODE_ENV=production
COPY --from=builder /usr/src/app/package.json ./
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
CMD ["node", "dist/server.js"]
