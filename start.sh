#!/bin/bash
# Zilobook - Development Startup Script
# Starts Docker DB, Backend, and Frontend concurrently

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

cleanup() {
    echo -e "\n${YELLOW}Shutting down services...${NC}"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    echo -e "${GREEN}All services stopped.${NC}"
    exit 0
}
trap cleanup SIGINT SIGTERM

# 1. Start/ensure PostgreSQL Docker container
echo -e "${CYAN}[1/3] Starting PostgreSQL...${NC}"
if docker ps --format '{{.Names}}' | grep -q '^zilobook-db$'; then
    echo -e "${GREEN}  Database already running.${NC}"
elif docker ps -a --format '{{.Names}}' | grep -q '^zilobook-db$'; then
    docker start zilobook-db
    echo -e "${GREEN}  Database container started.${NC}"
else
    docker run -d \
        --name zilobook-db \
        -e POSTGRES_PASSWORD=secret \
        -e POSTGRES_DB=zilobook \
        -p 5432:5432 \
        postgres:16-alpine
    echo -e "${GREEN}  Database container created and started.${NC}"
fi

# Wait for DB to be ready
echo -e "${YELLOW}  Waiting for database to accept connections...${NC}"
for i in $(seq 1 30); do
    if docker exec zilobook-db pg_isready -U postgres > /dev/null 2>&1; then
        echo -e "${GREEN}  Database ready.${NC}"
        break
    fi
    sleep 1
    if [ $i -eq 30 ]; then
        echo -e "${RED}  Database failed to start in 30s. Exiting.${NC}"
        exit 1
    fi
done

# 2. Start Backend
echo -e "${CYAN}[2/3] Starting Backend (Go + Gin on :8080)...${NC}"
cd "$PROJECT_DIR/backend"
go run main.go &
BACKEND_PID=$!
echo -e "${GREEN}  Backend PID: $BACKEND_PID${NC}"

# 3. Start Frontend
echo -e "${CYAN}[3/3] Starting Frontend (Next.js on :3000)...${NC}"
cd "$PROJECT_DIR/frontend"
npm run dev &
FRONTEND_PID=$!
echo -e "${GREEN}  Frontend PID: $FRONTEND_PID${NC}"

echo ""
echo -e "${GREEN}==============================================${NC}"
echo -e "${GREEN}  Zilobook Dev Environment Running${NC}"
echo -e "${GREEN}==============================================${NC}"
echo -e "  Frontend:  ${CYAN}http://localhost:3000${NC}"
echo -e "  Backend:   ${CYAN}http://localhost:8080${NC}"
echo -e "  Database:  ${CYAN}localhost:5432${NC} (postgres/secret)"
echo -e "${YELLOW}  Press Ctrl+C to stop all services${NC}"
echo ""

wait
