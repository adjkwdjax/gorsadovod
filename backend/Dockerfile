FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["sh", "-c", "set -e; echo '[backend] makemigrations...'; python manage.py makemigrations api; echo '[backend] migrate...'; python manage.py migrate; echo '[backend] checking superuser...'; if python -c \"import os, sys; os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings'); import django; django.setup(); from django.contrib.auth import get_user_model; sys.exit(0 if get_user_model().objects.filter(is_superuser=True).exists() else 1)\"; then echo '[backend] superuser exists, skip createsuperuser'; else echo '[backend] no superuser found, starting createsuperuser'; python manage.py createsuperuser; fi; echo '[backend] runserver...'; python manage.py runserver 0.0.0.0:8000"]
