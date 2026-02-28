"""
Audit Log Service
==================

Records security-relevant and state-changing operations to the audit_logs table.
Provides a lightweight async interface used by routes and middleware.

Usage:
    from src.core.audit import audit_log

    await audit_log.record(
        action="user.login",
        resource_type="user",
        resource_id=user.id,
        user_id=user.id,
        user_role=user.role.value,
        ip_address=client_ip,
    )
"""

from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy import insert
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.logging import get_logger

logger = get_logger(__name__)


class AuditService:
    """Fire-and-forget audit logger backed by PostgreSQL."""

    async def record(
        self,
        session: AsyncSession,
        *,
        action: str,
        resource_type: str,
        resource_id: uuid.UUID | str | None = None,
        user_id: uuid.UUID | str | None = None,
        user_role: str | None = None,
        description: str | None = None,
        old_value: dict[str, Any] | None = None,
        new_value: dict[str, Any] | None = None,
        ip_address: str | None = None,
        user_agent: str | None = None,
        success: bool = True,
        error_message: str | None = None,
    ) -> None:
        """
        Insert an audit log row.

        This intentionally swallows exceptions so auditing errors never break
        the main request flow.
        """
        try:
            from src.models.analytics import AuditLog

            log = AuditLog(
                user_id=uuid.UUID(str(user_id)) if user_id else None,
                user_role=user_role,
                action=action,
                resource_type=resource_type,
                resource_id=uuid.UUID(str(resource_id)) if resource_id else None,
                description=description,
                old_value=old_value,
                new_value=new_value,
                ip_address=ip_address,
                user_agent=user_agent,
                success=success,
                error_message=error_message,
            )
            session.add(log)
            await session.flush()

            logger.debug(
                "Audit log recorded",
                action=action,
                resource_type=resource_type,
                resource_id=str(resource_id) if resource_id else None,
                user_id=str(user_id) if user_id else None,
            )
        except Exception as exc:
            logger.warning("Failed to write audit log", error=str(exc), action=action)


# Singleton
audit_log = AuditService()
