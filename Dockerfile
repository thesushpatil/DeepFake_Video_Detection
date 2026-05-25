FROM python:3.10-slim

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libsndfile1 \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements first (for Docker layer caching)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY main.py .
COPY frontend/ ./frontend/
COPY audio_deepfake/ ./audio_deepfake/
COPY model/ ./model/

# Expose port (HF Spaces uses 7860, configurable via PORT env)
EXPOSE 7860

# Start the server
CMD ["python", "main.py"]
