"""Internal authenticated HTTP wrapper for the privacy-transform function."""

from __future__ import annotations

import hmac
import json
import os
import socket
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from app.privacy_transform import MAX_IMAGE_BYTES, PrivacyTransformError, PrivacyTransformer

MAX_TOKEN_LENGTH = 4096


def make_handler(
    shared_secret: str,
    transformer: PrivacyTransformer,
) -> type[BaseHTTPRequestHandler]:
    class WorkerHandler(BaseHTTPRequestHandler):
        server_version = "DahaMizMediaWorker"
        sys_version = ""

        def log_message(self, _format: str, *_args: object) -> None:
            # Avoid writing request addresses, paths, payload sizes, or credentials to logs.
            return

        def _send_json(self, status: int, payload: dict[str, str]) -> None:
            body = json.dumps(payload, separators=(",", ":")).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(body)

        def do_GET(self) -> None:
            if self.path != "/health":
                self._send_json(404, {"error": "Not found."})
                return
            self._send_json(200, {"status": "ok"})

        def do_POST(self) -> None:
            if self.path != "/v1/transform":
                self._send_json(404, {"error": "Not found."})
                return

            authorization = self.headers.get("Authorization", "")
            scheme, _, provided_secret = authorization.partition(" ")
            if (
                scheme.lower() != "bearer"
                or len(provided_secret) > MAX_TOKEN_LENGTH
                or not hmac.compare_digest(provided_secret, shared_secret)
            ):
                self._send_json(401, {"error": "Unauthorized."})
                return

            content_type = self.headers.get("Content-Type", "").split(";", 1)[0].strip().lower()
            if content_type not in {"image/jpeg", "image/png"}:
                self._send_json(415, {"error": "JPEG or PNG images are required."})
                return
            try:
                content_length = int(self.headers.get("Content-Length", ""))
            except ValueError:
                self._send_json(400, {"error": "A valid Content-Length is required."})
                return
            if content_length <= 0:
                self._send_json(400, {"error": "Image body is required."})
                return
            if content_length > MAX_IMAGE_BYTES:
                self._send_json(413, {"error": "Image exceeds the processing limit."})
                return

            self.connection.settimeout(15)
            try:
                image_bytes = self.rfile.read(content_length)
                if len(image_bytes) != content_length:
                    self._send_json(400, {"error": "Image body was incomplete."})
                    return
                result = transformer.transform(image_bytes)
            except (PrivacyTransformError, socket.timeout):
                self._send_json(422, {"error": "Image could not be processed."})
                return
            except Exception:
                self._send_json(500, {"error": "Image processing failed."})
                return

            self.send_response(200)
            self.send_header("Content-Type", "image/jpeg")
            self.send_header("Content-Length", str(len(result.jpeg_bytes)))
            self.send_header("Cache-Control", "no-store")
            self.send_header("X-Detected-Face-Regions", str(result.face_region_count))
            self.send_header("X-Detected-Plate-Regions", str(result.plate_region_count))
            self.send_header("X-Human-Review-Required", "true")
            self.end_headers()
            self.wfile.write(result.jpeg_bytes)

    return WorkerHandler


def create_server(
    host: str,
    port: int,
    shared_secret: str,
    transformer: PrivacyTransformer | None = None,
) -> ThreadingHTTPServer:
    if len(shared_secret.encode("utf-8")) < 32:
        raise ValueError("MEDIA_WORKER_SHARED_SECRET must be at least 32 bytes.")
    active_transformer = transformer or PrivacyTransformer()
    handler = make_handler(shared_secret, active_transformer)
    return ThreadingHTTPServer((host, port), handler)


def main() -> None:
    secret = os.environ.get("MEDIA_WORKER_SHARED_SECRET", "")
    host = os.environ.get("MEDIA_WORKER_HOST", "127.0.0.1")
    port_value = os.environ.get("MEDIA_WORKER_PORT", "8081")
    try:
        port = int(port_value)
        server = create_server(host, port, secret)
    except (RuntimeError, ValueError, OSError) as error:
        print(f"Media worker startup failed: {error}", file=sys.stderr)
        raise SystemExit(1) from error
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
