import json
import logging
from fastapi import WebSocket
from typing import Set

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active_connections.add(ws)
        logger.info("WebSocket client connected. Total: %d", len(self.active_connections))

    def disconnect(self, ws: WebSocket):
        self.active_connections.discard(ws)
        logger.info("WebSocket client disconnected. Total: %d", len(self.active_connections))

    async def broadcast(self, payload: dict):
        """Push payload to ALL connected dashboard clients."""
        if not self.active_connections:
            return
        message = json.dumps(payload)
        dead: Set[WebSocket] = set()
        for ws in self.active_connections:
            try:
                await ws.send_text(message)
            except Exception:
                dead.add(ws)
        self.active_connections -= dead
        logger.info(
            "Broadcast sent to %d clients (%d dead removed)",
            len(self.active_connections),
            len(dead),
        )


manager = ConnectionManager()
