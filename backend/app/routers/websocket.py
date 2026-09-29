from fastapi import (
    APIRouter,
    WebSocket,
    WebSocketDisconnect
)

from app.websocket_manager import manager


router = APIRouter(
    tags=["WebSocket"]
)


@router.websocket("/ws/dashboard")
async def dashboard_websocket(
    websocket: WebSocket
):

    await manager.connect(
        websocket
    )

    try:

        while True:

            # Keeps the connection alive.
            await websocket.receive_text()

    except WebSocketDisconnect:

        manager.disconnect(
            websocket
        )

    except Exception:

        manager.disconnect(
            websocket
        )