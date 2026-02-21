# Alembic Database Migrations

## Initial Migration

```bash
cd /control-plane/api
alembic init alembic
```

## Create new migration

```bash
alembic revision --autogenerate -m "description"
```

## Run migrations

```bash
alembic upgrade head
```

## Downgrade

```bash
alembic downgrade -1
```
