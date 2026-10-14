import os

# Define a URL base da API FastAPI (padrão local: http://localhost:8000)
DABF_API_URL = os.getenv("DABF_API_URL", "http://localhost:8000").rstrip("/")

# Timeout das requisições HTTP em segundos
DABF_API_TIMEOUT = int(os.getenv("DABF_API_TIMEOUT", "5"))