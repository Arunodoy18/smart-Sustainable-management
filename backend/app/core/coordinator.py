from typing import Dict, List, Set
from fastapi import WebSocket
from loguru import logger
import json
import asyncio


class RealtimeCoordinator:
    def __init__(self):
        # user_id -> set of active websockets
        self.user_connections: Dict[str, Set[WebSocket]] = {}
        # role-based broadcast groups
        self.role_connections: Dict[str, Set[WebSocket]] = {
            "driver": set(),
            "admin": set(),
        }
        # SSE client queues: user_id -> set of queues
        self.sse_clients: Dict[str, Set[asyncio.Queue]] = {}

    def add_sse_client(self, user_id: str, queue: asyncio.Queue):
        if user_id not in self.sse_clients:
            self.sse_clients[user_id] = set()
        self.sse_clients[user_id].add(queue)
        logger.info(f"SSE client connected for user {user_id}")

    def remove_sse_client(self, user_id: str, queue: asyncio.Queue):
        if user_id in self.sse_clients:
            self.sse_clients[user_id].discard(queue)
            if not self.sse_clients[user_id]:
                del self.sse_clients[user_id]
        logger.info(f"SSE client disconnected for user {user_id}")

    async def connect(self, websocket: WebSocket, user_id: str, role: str):
        await websocket.accept()

        if user_id not in self.user_connections:
            self.user_connections[user_id] = set()
        self.user_connections[user_id].add(websocket)

        if role in self.role_connections:
            self.role_connections[role].add(websocket)

        logger.info(f"User {user_id} ({role}) connected to realtime coordinator")

    def disconnect(self, websocket: WebSocket, user_id: str, role: str):
        if user_id in self.user_connections:
            self.user_connections[user_id].discard(websocket)
            if not self.user_connections[user_id]:
                del self.user_connections[user_id]

        if role in self.role_connections:
            self.role_connections[role].discard(websocket)

        logger.info(f"User {user_id} disconnected")

    async def notify_user(self, user_id: str, message: dict):
        # Notify via WebSocket
        if user_id in self.user_connections:
            disconnected = set()
            for ws in self.user_connections[user_id]:
                try:
                    await ws.send_json(message)
                except Exception:
                    disconnected.add(ws)

            for ws in disconnected:
                self.user_connections[user_id].discard(ws)

        # Notify via SSE
        if user_id in self.sse_clients:
            for queue in self.sse_clients[user_id]:
                try:
                    await queue.put(message)
                except Exception:
                    pass

    async def broadcast_to_role(self, role: str, message: dict):
        if role in self.role_connections:
            disconnected = set()
            for ws in self.role_connections[role]:
                try:
                    await ws.send_json(message)
                except Exception:
                    disconnected.add(ws)

            for ws in disconnected:
                self.role_connections[role].discard(ws)


coordinator = RealtimeCoordinator()
