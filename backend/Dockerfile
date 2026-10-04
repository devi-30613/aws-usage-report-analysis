# Production Dockerfile for AWS App Runner & Container Deployments
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Set environment variables for Python runtime in container
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000 \
    HOST=0.0.0.0

# Install production Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application code and sample dataset
COPY app/ ./app/
COPY data/ ./data/
COPY .env.example ./.env.example

# Expose application port
EXPOSE 8000

# Launch Uvicorn using the runtime PORT environment variable (AWS App Runner compatibility)
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
