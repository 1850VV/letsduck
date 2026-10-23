# letsduck frontend: static files behind nginx, which also proxies /api to the backend.
# Stage 1 bundles, minifies and precompresses the code (build.mjs, esbuild pinned in package-lock.json).
FROM node:22-alpine AS build
WORKDIR /src
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN node build.mjs /site

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /site /usr/share/nginx/html
EXPOSE 80
