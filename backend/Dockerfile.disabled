FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y build-essential curl

# Install python dependencies
COPY requirements.txt .
RUN pip install --default-timeout=1000 -r requirements.txt

# Copy source code
COPY . .

# Expose port
EXPOSE 8000

# Start server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
