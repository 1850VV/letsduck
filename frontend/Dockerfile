# Build the shared TypeScript renderer, then serve only its public output.
FROM node:24.20.0-bookworm-slim AS build
ENV ELECTRON_SKIP_BINARY_DOWNLOAD=1
WORKDIR /source
COPY . .
RUN npm ci && npm run build

FROM nginx:1.27-alpine
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /source/frontend/dist/ /usr/share/nginx/html/
EXPOSE 80
