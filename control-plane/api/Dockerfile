FROM python:3.11-slim

WORKDIR /app

# Install dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Run migrations and start server
CMD alembic upgrade head && python seed_admin.py ${ADMIN_EMAIL:-admin@localhost} ${ADMIN_PASSWORD:-admin} 2>/dev/null || true && uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
