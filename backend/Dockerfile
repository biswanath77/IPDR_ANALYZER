FROM python:3.11-slim
WORKDIR /app

# Install system deps for pandas and scikit-learn
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copy model artifacts and app code (outputs should be in repo root outputs/)
COPY outputs /app/outputs
COPY backend/app /app/app
COPY backend/fetch_and_start.py /app/fetch_and_start.py

EXPOSE 8000
# Use PORT env var when available (Render sets $PORT). Fallback to 8000.
CMD ["python", "/app/fetch_and_start.py"]
