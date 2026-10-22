# One Uvicorn API process owns a bounded export process pool.
FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 \
    HOST=0.0.0.0 PORT=8876 DUCK_DB=/data/doodleduck.db DUCK_ASSETS=/assets
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY *.py ./
RUN useradd --system --uid 10001 duck && mkdir -p /data && chown duck /data
USER duck
VOLUME /data
EXPOSE 8876
HEALTHCHECK --interval=30s --timeout=3s CMD python3 -c "import urllib.request;urllib.request.urlopen('http://127.0.0.1:8876/api/health',timeout=2)"
CMD ["python3", "server.py"]
