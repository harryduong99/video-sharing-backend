# DEVELOPMENT RUN

FROM --platform=linux/amd64 node:20-alpine AS development

WORKDIR /user/src/app

RUN npm install -g npm@10.2.3

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

RUN npx prisma generate


# PREPARE FOR PRODUCTION RUN

FROM --platform=linux/amd64 node:20-alpine AS build-production

WORKDIR /user/src/app

RUN npm install -g npm@10.2.3

COPY --from=development /user/src/app ./

RUN npm run build

USER node


# PRODUCTION RUN

FROM --platform=linux/amd64 node:20-alpine AS production

WORKDIR /user/src/app

RUN npm install -g npm@10.2.3

COPY --from=development /user/src/app/node_modules ./node_modules
COPY --from=build-production /user/src/app/dist ./dist
COPY package.json ./

RUN npm prune --production

CMD ["npm", "run", "start:prod"]
