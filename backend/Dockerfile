FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY src/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY src/ .

# Railway uses PORT environment variable
ENV PORT=8000

# Run the application with dynamic port
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT}
