.PHONY: help build up down logs test clean dev-api dev-ui

help:
	@echo "OpenClaw Fleet - Available Commands:"
	@echo "  make build     - Build all Docker images"
	@echo "  make up        - Start all services"
	@echo "  make down      - Stop all services"
	@echo "  make logs      - View all logs"
	@echo "  make test      - Run tests"
	@echo "  make clean     - Remove all containers and volumes"
	@echo "  make dev-api   - Run API locally (requires Postgres/Redis)"
	@echo "  make dev-ui    - Run UI locally"

build:
	cd control-plane/infra && docker-compose build

up:
	cd control-plane/infra && docker-compose up -d

down:
	cd control-plane/infra && docker-compose down

logs:
	cd control-plane/infra && docker-compose logs -f

test:
	cd control-plane/api && pytest

clean:
	cd control-plane/infra && docker-compose down -v --remove-orphans

dev-api:
	cd control-plane/api && \
	DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/openclaw_fleet \
	REDIS_URL=redis://localhost:6379/0 \
	uvicorn app.main:app --reload

dev-ui:
	cd control-plane/ui && npm run dev

setup:
	cd control-plane/infra && sudo ./setup.sh $(DOMAIN)
