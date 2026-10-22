# DoodleDuck frontend: static files behind nginx, which also proxies /api to the backend.
# Stage 1 stamps content hashes and preload links into the pages (stamp.py, standard library only).
FROM python:3.12-slim AS stamp
WORKDIR /site
COPY . .
RUN python3 stamp.py /site && rm -f stamp.py Dockerfile nginx.conf

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=stamp /site /usr/share/nginx/html
EXPOSE 80
