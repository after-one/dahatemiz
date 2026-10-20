from __future__ import annotations

import sys
import unittest
from pathlib import Path

import cv2
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.privacy_transform import (  # noqa: E402
    PrivacyTransformError,
    PrivacyTransformer,
    _image_dimensions,
)


class FixedRegionDetector:
    def __init__(self, regions: list[tuple[int, int, int, int]]) -> None:
        self.regions = np.array(regions, dtype=np.int32).reshape((-1, 4))

    def detectMultiScale(self, _image: np.ndarray, **_kwargs: object) -> np.ndarray:
        return self.regions


def encode_png(image: np.ndarray) -> bytes:
    success, encoded = cv2.imencode(".png", image)
    if not success:
        raise AssertionError("Could not create test image.")
    return encoded.tobytes()


class PrivacyTransformTests(unittest.TestCase):
    def setUp(self) -> None:
        self.image = np.zeros((128, 128, 3), dtype=np.uint8)
        checkerboard = np.indices((80, 80)).sum(axis=0) % 2 * 255
        self.image[24:104, 24:104] = checkerboard[:, :, None]

    def test_blurs_detected_regions_and_always_requires_human_review(self) -> None:
        transformer = PrivacyTransformer(
            face_detector=FixedRegionDetector([(35, 35, 48, 48)]),
            plate_detector=FixedRegionDetector([(50, 50, 44, 18)]),
        )

        result = transformer.transform(encode_png(self.image))
        decoded = cv2.imdecode(
            np.frombuffer(result.jpeg_bytes, dtype=np.uint8), cv2.IMREAD_COLOR
        )

        self.assertIsNotNone(decoded)
        self.assertEqual(result.face_region_count, 1)
        self.assertEqual(result.plate_region_count, 1)
        self.assertTrue(result.human_review_required)
        before = self.image[45:75, 45:75].std()
        after = decoded[45:75, 45:75].std()
        self.assertLess(after, before)

    def test_rejects_invalid_and_oversized_payloads_before_decode(self) -> None:
        transformer = PrivacyTransformer(
            face_detector=FixedRegionDetector([]),
            plate_detector=FixedRegionDetector([]),
        )

        with self.assertRaises(PrivacyTransformError):
            transformer.transform(b"not an image")

        oversized_png_header = b"\x89PNG\r\n\x1a\n" + (13).to_bytes(4, "big") + b"IHDR"
        oversized_png_header += (10_000).to_bytes(4, "big") + (2_000).to_bytes(4, "big")
        oversized_png_header += b"\x08\x02\x00\x00\x00"
        with self.assertRaises(PrivacyTransformError):
            transformer.transform(oversized_png_header)

    def test_reads_jpeg_dimensions_without_decoding(self) -> None:
        encoded = encode_png(self.image)
        success, jpeg = cv2.imencode(".jpg", cv2.imdecode(np.frombuffer(encoded, dtype=np.uint8), 1))
        self.assertTrue(success)
        self.assertEqual(_image_dimensions(jpeg.tobytes()), (128, 128))

    def test_installed_cascades_load_in_the_local_runtime(self) -> None:
        transformer = PrivacyTransformer()
        result = transformer.transform(encode_png(np.zeros((96, 128, 3), dtype=np.uint8)))

        self.assertTrue(result.jpeg_bytes.startswith(b"\xff\xd8"))
        self.assertTrue(result.human_review_required)


if __name__ == "__main__":
    unittest.main()
