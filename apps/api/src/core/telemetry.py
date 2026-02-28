"""
OpenTelemetry Instrumentation
==============================

Distributed tracing, metrics, and logs via OpenTelemetry.
Instruments FastAPI, SQLAlchemy, Redis, httpx automatically.

Controlled by:
  - OTEL_ENABLED (bool)
  - OTEL_EXPORTER_OTLP_ENDPOINT (str, default localhost:4317)
  - OTEL_SERVICE_NAME (str, default smart-waste-api)
"""

from __future__ import annotations

import functools
import time
from contextlib import contextmanager
from typing import Any, Generator

from src.core.config import settings
from src.core.logging import get_logger

logger = get_logger(__name__)

_tracer: Any = None
_meter: Any = None

# Metrics counters (populated after init)
_request_counter: Any = None
_request_duration: Any = None
_classification_counter: Any = None
_classification_duration: Any = None
_db_query_duration: Any = None
_active_ws_gauge: Any = None


def setup_telemetry(app: Any) -> None:
    """
    Initialize OpenTelemetry tracing + metrics and instrument the app.
    Safe no-op if OTEL_ENABLED is False or SDK packages are missing.
    """
    global _tracer, _meter
    global _request_counter, _request_duration
    global _classification_counter, _classification_duration
    global _db_query_duration, _active_ws_gauge

    if not settings.otel_enabled:
        logger.info("OpenTelemetry disabled (OTEL_ENABLED=false)")
        return

    try:
        from opentelemetry import metrics, trace
        from opentelemetry.exporter.otlp.proto.grpc.metric_exporter import (
            OTLPMetricExporter,
        )
        from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import (
            OTLPSpanExporter,
        )
        from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
        from opentelemetry.sdk.metrics import MeterProvider
        from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader
        from opentelemetry.sdk.resources import Resource
        from opentelemetry.sdk.trace import TracerProvider
        from opentelemetry.sdk.trace.export import BatchSpanProcessor
    except ImportError as exc:
        logger.warning(
            "OpenTelemetry SDK not installed — skipping instrumentation",
            missing=str(exc),
        )
        return

    resource = Resource.create(
        {
            "service.name": settings.otel_service_name,
            "service.version": "1.0.0",
            "deployment.environment": settings.app_env,
        }
    )

    # -- Tracing --
    tracer_provider = TracerProvider(resource=resource)
    span_exporter = OTLPSpanExporter(endpoint=settings.otel_exporter_otlp_endpoint)
    tracer_provider.add_span_processor(BatchSpanProcessor(span_exporter))
    trace.set_tracer_provider(tracer_provider)
    _tracer = trace.get_tracer(__name__)

    # -- Metrics --
    metric_exporter = OTLPMetricExporter(endpoint=settings.otel_exporter_otlp_endpoint)
    metric_reader = PeriodicExportingMetricReader(metric_exporter, export_interval_millis=15_000)
    meter_provider = MeterProvider(resource=resource, metric_readers=[metric_reader])
    metrics.set_meter_provider(meter_provider)
    _meter = metrics.get_meter(__name__)

    # Define application metrics
    _request_counter = _meter.create_counter(
        "http.server.request_count",
        description="Total HTTP requests",
    )
    _request_duration = _meter.create_histogram(
        "http.server.duration",
        unit="ms",
        description="HTTP request duration in ms",
    )
    _classification_counter = _meter.create_counter(
        "ml.classification_count",
        description="Total ML classifications",
    )
    _classification_duration = _meter.create_histogram(
        "ml.classification_duration",
        unit="ms",
        description="ML classification duration in ms",
    )
    _db_query_duration = _meter.create_histogram(
        "db.query_duration",
        unit="ms",
        description="Database query duration in ms",
    )
    _active_ws_gauge = _meter.create_up_down_counter(
        "ws.active_connections",
        description="Active WebSocket connections",
    )

    # Auto-instrument FastAPI
    FastAPIInstrumentor.instrument_app(app)

    # Attempt to instrument SQLAlchemy
    try:
        from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
        from src.core.database import engine

        SQLAlchemyInstrumentor().instrument(engine=engine.sync_engine)
    except Exception:
        pass  # optional

    # Attempt to instrument Redis
    try:
        from opentelemetry.instrumentation.redis import RedisInstrumentor

        RedisInstrumentor().instrument()
    except Exception:
        pass

    # Attempt to instrument httpx
    try:
        from opentelemetry.instrumentation.httpx import HTTPXClientInstrumentor

        HTTPXClientInstrumentor().instrument()
    except Exception:
        pass

    logger.info(
        "OpenTelemetry initialized",
        endpoint=settings.otel_exporter_otlp_endpoint,
        service=settings.otel_service_name,
    )


# ---------------------------------------------------------------------------
# Convenience helpers for manual instrumentation
# ---------------------------------------------------------------------------


@contextmanager
def trace_span(name: str, attributes: dict[str, Any] | None = None) -> Generator:
    """Create a trace span (no-op if OTel is disabled)."""
    if _tracer is None:
        yield None
        return
    with _tracer.start_as_current_span(name, attributes=attributes or {}) as span:
        yield span


def record_classification(category: str, confidence: float, duration_ms: float) -> None:
    """Record an ML classification metric."""
    if _classification_counter:
        _classification_counter.add(1, {"category": category})
    if _classification_duration:
        _classification_duration.record(duration_ms, {"category": category})


def record_request(method: str, path: str, status_code: int, duration_ms: float) -> None:
    """Record an HTTP request metric."""
    attrs = {"http.method": method, "http.route": path, "http.status_code": status_code}
    if _request_counter:
        _request_counter.add(1, attrs)
    if _request_duration:
        _request_duration.record(duration_ms, attrs)


def record_ws_connect() -> None:
    if _active_ws_gauge:
        _active_ws_gauge.add(1)


def record_ws_disconnect() -> None:
    if _active_ws_gauge:
        _active_ws_gauge.add(-1)
