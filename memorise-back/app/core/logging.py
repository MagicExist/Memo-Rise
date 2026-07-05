"""Structured JSON logging + per-request correlation id (SEC-2 / business rule R4).

Never log secrets, tokens, or PII.
"""

import json
import logging
import sys
import uuid
from collections.abc import Awaitable, Callable

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

_CORRELATION_HEADER = "X-Correlation-ID"


class _JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload = {
            "timestamp": self.formatTime(record),
            "level": record.levelname,
            "message": record.getMessage(),
            "logger": record.name,
        }
        correlation_id = getattr(record, "correlation_id", None)
        if correlation_id:
            payload["correlation_id"] = correlation_id
        return json.dumps(payload)


def configure_logging() -> None:
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(_JsonFormatter())
    root = logging.getLogger()
    root.handlers = [handler]
    root.setLevel(logging.INFO)


class CorrelationIdMiddleware(BaseHTTPMiddleware):
    """Assign a correlation id per request and expose it on the response."""

    async def dispatch(
        self, request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        correlation_id = request.headers.get(_CORRELATION_HEADER, str(uuid.uuid4()))
        request.state.correlation_id = correlation_id
        logging.getLogger("request").info(
            "%s %s", request.method, request.url.path,
            extra={"correlation_id": correlation_id},
        )
        response = await call_next(request)
        response.headers[_CORRELATION_HEADER] = correlation_id
        return response
