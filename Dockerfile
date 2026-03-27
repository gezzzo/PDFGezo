# ── PDFGezo Dockerfile ────────────────────────────────────────────────
# Python 3.11 slim base + system deps (Poppler, Ghostscript, LibreOffice)
# ──────────────────────────────────────────────────────────────────────

FROM python:3.11-slim

# Prevent interactive prompts during apt installs
ENV DEBIAN_FRONTEND=noninteractive

# ── System dependencies ──────────────────────────────────────────────
RUN apt-get update && apt-get install -y --no-install-recommends \
    poppler-utils \
    ghostscript \
    libreoffice \
    fonts-liberation \
    fonts-dejavu-core \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# ── App setup ────────────────────────────────────────────────────────
WORKDIR /app

# Install Python dependencies first (cache layer)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create runtime directories
RUN mkdir -p uploads outputs

# ── Runtime ──────────────────────────────────────────────────────────
EXPOSE 5000

CMD ["python", "app.py"]
