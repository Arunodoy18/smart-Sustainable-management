from typing import List, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, WebSocket, WebSocketDisconnect, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.api import deps
from app.services.waste_service import WasteService
from app.schemas.waste import WasteEntryResponse, WasteEntryUpdate
from app.models.user import Profile
from app.core.coordinator import coordinator
from app.core.config import settings
import json
from uuid import UUID
import asyncio

router = APIRouter()

@router.post("/classify", response_model=WasteEntryResponse)
async def classify_waste(
    *,
    db: Session = Depends(deps.get_db),
    file: UploadFile = File(...),
    location: Optional[str] = Form(None),
    current_user: Profile = Depends(deps.get_current_active_user)
) -> Any:
    """
    Classify waste from an uploaded image and record it.
    """
    waste_service = WasteService(db)
    
    # Step 1: Persist image
    file_content = await file.read()
    image_url = await waste_service.upload_image(file_content, file.filename)
    
    # Step 2: Classify and record
    loc_data = json.loads(location) if location else None
    entry = await waste_service.classify_and_record(
        user_id=current_user.id,
        image_url=image_url,
        location=loc_data
    )
    
    return entry

@router.get("/history", response_model=List[WasteEntryResponse])
def get_history(
    db: Session = Depends(deps.get_db),
    current_user: Profile = Depends(deps.get_current_active_user),
    limit: int = 50
) -> Any:
    """
    Get user's waste classification history.
    """
    waste_service = WasteService(db)
    return waste_service.get_user_entries(user_id=current_user.id, limit=limit)

@router.get("/pending", response_model=List[WasteEntryResponse])
def get_pending_pickups(
    db: Session = Depends(deps.get_db),
    current_driver: Profile = Depends(deps.get_current_active_driver)
) -> Any:
    """
    Get all pending pickups (Driver only).
    """
    waste_service = WasteService(db)
    return waste_service.get_pending_pickups()

@router.post("/{entry_id}/accept", response_model=WasteEntryResponse)
async def accept_pickup(
    entry_id: UUID,
    db: Session = Depends(deps.get_db),
    current_driver: Profile = Depends(deps.get_current_active_driver)
) -> Any:
    """
    Driver accepts a pending pickup.
    """
    waste_service = WasteService(db)
    return await waste_service.update_status(
        entry_id=entry_id,
        status="accepted",
        collector_id=current_driver.id
    )

@router.post("/{entry_id}/collect", response_model=WasteEntryResponse)
async def collect_waste(
    entry_id: UUID,
    file: UploadFile = File(...),
    location: Optional[str] = Form(None),
    db: Session = Depends(deps.get_db),
    current_driver: Profile = Depends(deps.get_current_active_driver)
) -> Any:
    """
    Driver confirms collection with proof image.
    """
    waste_service = WasteService(db)
    
    # Upload proof image
    file_content = await file.read()
    collection_image_url = await waste_service.upload_image(file_content, file.filename)
    
    loc_data = json.loads(location) if location else None
    
    return await waste_service.update_status(
        entry_id=entry_id,
        status="collected",
        collector_id=current_driver.id,
        collection_image_url=collection_image_url,
        driver_location=loc_data
    )

@router.get("/analytics")
def get_analytics(
    db: Session = Depends(deps.get_db),
    current_user: Profile = Depends(deps.get_current_active_user)
) -> Any:
    """
    Get real-time analytics.
    """
    waste_service = WasteService(db)
    return waste_service.get_analytics()


@router.get("/sse/{token}")
async def sse_endpoint(
    request: Request,
    token: str
):
    """
    Server-Sent Events for real-time updates.
    Fallback for browsers that don't support WebSocket well.
    """
    from app.core import security
    from jose import jwt
    
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        user_id = payload.get("sub")
    except Exception:
        return StreamingResponse(
            iter(["data: {\"error\": \"Invalid token\"}\n\n"]),
            media_type="text/event-stream"
        )
    
    async def event_generator():
        queue = asyncio.Queue()
        
        # Register this client
        coordinator.add_sse_client(user_id, queue)
        
        try:
            while True:
                if await request.is_disconnected():
                    break
                    
                try:
                    # Wait for events with timeout for keepalive
                    event = await asyncio.wait_for(queue.get(), timeout=30.0)
                    yield f"data: {json.dumps(event)}\n\n"
                except asyncio.TimeoutError:
                    # Send keepalive
                    yield f": keepalive\n\n"
        finally:
            coordinator.remove_sse_client(user_id, queue)
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


@router.websocket("/ws/{token}")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str
):
    """
    Real-time coordination via WebSocket.
    """
    try:
        # Validate token and get user
        from app.core import security
        from jose import jwt
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        user_id = payload.get("sub")
        
        # Get user from DB to check role
        db = next(deps.get_db())
        user = db.query(Profile).filter(Profile.id == user_id).first()
        if not user:
            await websocket.close(code=1008)
            return
            
        role = user.role
        
        await coordinator.connect(websocket, user_id, role)
        
        try:
            while True:
                # Keep connection alive and handle incoming messages if needed
                data = await websocket.receive_text()
                # Handle heartbeat or other messages
        except WebSocketDisconnect:
            coordinator.disconnect(websocket, user_id, role)
            
    except Exception as e:
        print(f"WebSocket error: {e}")
        await websocket.close(code=1011)
