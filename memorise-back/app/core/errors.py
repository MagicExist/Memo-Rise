"""Global error handling — fail closed, generic client messages (SEC-15 / business rule R5)."""

import logging

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

_logger = logging.getLogger("error")


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(Exception)
    async def _unhandled(request: Request, exc: Exception) -> JSONResponse:
        correlation_id = getattr(request.state, "correlation_id", None)
        # Log the real error internally (with correlation id); never expose it to the client.
        _logger.exception(
            "Unhandled error on %s %s",
            request.method,
            request.url.path,
            extra={"correlation_id": correlation_id},
        )
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error", "correlation_id": correlation_id},
        )
