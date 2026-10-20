from __future__ import annotations

import sys
import threading
import unittest
import urllib.error
import urllib.request
from pathlib import Path

import cv2
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.privacy_transform import PrivacyTransformer  # noqa: E402
from app.server import create_server  # noqa: E402


class WorkerServerTests(unittest.TestCase):
    def setUp(self) -> None:
        self.secret = "local-test-secret-with-enough-bytes-1234"
        self.server = create_server("127.0.0.1", 0, self.secret, PrivacyTransformer())
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.base_url = f"http://127.0.0.1:{self.server.server_port}"
        image = np.zeros((96, 128, 3), dtype=np.uint8)
        success, encoded = cv2.imencode(".png", image)
        if not success:
            raise AssertionError("Could not create test image.")
        self.image_bytes = encoded.tobytes()

    def tearDown(self) -> None:
        self.server.shutdown()
        self.thread.join(timeout=2)
        self.server.server_close()

    def test_transform_requires_a_bearer_secret(self) -> None:
        request = urllib.request.Request(
            f"{self.base_url}/v1/transform",
            data=self.image_bytes,
            method="POST",
            headers={"Content-Type": "image/png"},
        )
        with self.assertRaises(urllib.error.HTTPError) as error:
            urllib.request.urlopen(request, timeout=3)
        self.assertEqual(error.exception.code, 401)

    def test_transform_response_is_private_uncacheable_and_requires_review(self) -> None:
        request = urllib.request.Request(
            f"{self.base_url}/v1/transform",
            data=self.image_bytes,
            method="POST",
            headers={
                "Authorization": f"Bearer {self.secret}",
                "Content-Type": "image/png",
            },
        )
        with urllib.request.urlopen(request, timeout=3) as response:
            body = response.read()
            self.assertEqual(response.status, 200)
            self.assertEqual(response.headers.get("Content-Type"), "image/jpeg")
            self.assertEqual(response.headers.get("Cache-Control"), "no-store")
            self.assertEqual(response.headers.get("X-Human-Review-Required"), "true")
            self.assertEqual(response.headers.get("X-Detected-Face-Regions"), "0")
            self.assertEqual(response.headers.get("X-Detected-Plate-Regions"), "0")
        self.assertTrue(body.startswith(b"\xff\xd8"))

    def test_transform_rejects_unsupported_content_type(self) -> None:
        request = urllib.request.Request(
            f"{self.base_url}/v1/transform",
            data=b"GIF89a",
            method="POST",
            headers={
                "Authorization": f"Bearer {self.secret}",
                "Content-Type": "image/gif",
            },
        )
        with self.assertRaises(urllib.error.HTTPError) as error:
            urllib.request.urlopen(request, timeout=3)
        self.assertEqual(error.exception.code, 415)

    def test_server_refuses_short_secrets(self) -> None:
        with self.assertRaises(ValueError):
            create_server("127.0.0.1", 0, "too-short")


if __name__ == "__main__":
    unittest.main()
