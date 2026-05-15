import json
import logging
from fastapi import WebSocket, WebSocketDisconnect

logger = logging.getLogger("server")


class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, post_id: str):
        await websocket.accept()
        if post_id not in self.active_connections:
            self.active_connections[post_id] = []
        self.active_connections[post_id].append(websocket)
        logger.info(f"WebSocket connected for post {post_id}. Total: {len(self.active_connections[post_id])}")

    def disconnect(self, websocket: WebSocket, post_id: str):
        if post_id in self.active_connections:
            self.active_connections[post_id] = [ws for ws in self.active_connections[post_id] if ws != websocket]
            if not self.active_connections[post_id]:
                del self.active_connections[post_id]

    async def broadcast(self, post_id: str, message: dict):
        if post_id in self.active_connections:
            for connection in self.active_connections[post_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    pass


ws_manager = ConnectionManager()
