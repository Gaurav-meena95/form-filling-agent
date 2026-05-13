#!/bin/bash

PORT=3000

# Find PID of process listening on the port
PID=$(lsof -t -i:$PORT)

if [ -n "$PID" ]; then
    echo "Port $PORT is occupied by PID $PID. Killing it..."
    kill -9 $PID
    sleep 1
fi

echo "Starting backend in ${ENV_STATE:-dev} mode on port $PORT..."
if [ -d "venv" ]; then
    source venv/bin/activate
fi

ENV_STATE=${ENV_STATE:-dev} uvicorn backend.main:app --host 0.0.0.0 --port $PORT --reload
