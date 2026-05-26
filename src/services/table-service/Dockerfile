# container using node version 22 alpine
FROM node:22-alpine AS builder

# install libc6-compat for postgresql driver
RUN apk add --no-cache libc6-compat

# set main folder inside the container
WORKDIR /app

# copy file package.json and package.lock.json
COPY package*.json ./
COPY prisma .prisma/
COPY src/services/table-service/package*.json ./src/services/table-service/

# install dependencies
RUN npm install


# copy all file project
COPY . .

# generate prisma client
RUN npx prisma generate

#  build project
RUN npm run build

# -- PRODUCTION --
FROM node:22-alpine

# set environment variable
ENV NODE_ENV=production

WORKDIR /app

# install libc6-compat for postgresql driver
RUN apk add --no-cache libc6-compat

# copy file from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/src/services/table-service/package*.json ./src/services/table-service/
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/generated ./generated

# install production dependencies
RUN npm install --omit=dev

USER node

# command run
CMD ["node", "dist/services/table-service/table.server.js"]