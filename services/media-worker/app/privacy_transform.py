"""Advisory face and license-plate blur for private image derivatives.

This module detects visual regions only. It does not recognize faces, identify people,
or decide whether an image is safe to publish. Every output requires human review.
"""

from __future__ import annotations

import os
import struct
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Protocol

import cv2
import numpy as np

MAX_IMAGE_BYTES = 12 * 1024 * 1024
MAX_IMAGE_PIXELS = 16_000_000
MAX_IMAGE_DIMENSION = 10_000
JPEG_QUALITY = 92


class PrivacyTransformError(ValueError):
    """Raised when an image cannot be processed within the worker's limits."""


class RegionDetector(Protocol):
    def detectMultiScale(self, image: np.ndarray, **kwargs: object) -> np.ndarray: ...


@dataclass(frozen=True)
class TransformResult:
    jpeg_bytes: bytes
    face_region_count: int
    plate_region_count: int
    human_review_required: bool = True


def _jpeg_dimensions(data: bytes) -> tuple[int, int] | None:
    if len(data) < 4 or data[:2] != b"\xff\xd8":
        return None

    start_of_frame = {
        0xC0,
        0xC1,
        0xC2,
        0xC3,
        0xC5,
        0xC6,
        0xC7,
        0xC9,
        0xCA,
        0xCB,
        0xCD,
        0xCE,
        0xCF,
    }
    offset = 2
    while offset < len(data):
        if data[offset] != 0xFF:
            offset += 1
            continue
        while offset < len(data) and data[offset] == 0xFF:
            offset += 1
        if offset >= len(data):
            break
        marker = data[offset]
        offset += 1
        if marker in {0xD8, 0xD9, 0x01, *range(0xD0, 0xD8)}:
            continue
        if offset + 2 > len(data):
            break
        segment_length = struct.unpack_from(">H", data, offset)[0]
        if segment_length < 2 or offset + segment_length > len(data):
            break
        if marker in start_of_frame and segment_length >= 7:
            height, width = struct.unpack_from(">HH", data, offset + 3)
            return width, height
        if marker == 0xDA:
            break
        offset += segment_length
    return None


def _image_dimensions(data: bytes) -> tuple[int, int]:
    if data.startswith(b"\x89PNG\r\n\x1a\n") and len(data) >= 24:
        return struct.unpack_from(">II", data, 16)
    dimensions = _jpeg_dimensions(data)
    if dimensions is not None:
        return dimensions
    raise PrivacyTransformError("Only valid JPEG and PNG images are accepted.")


def _validate_dimensions(width: int, height: int) -> None:
    if (
        width <= 0
        or height <= 0
        or width > MAX_IMAGE_DIMENSION
        or height > MAX_IMAGE_DIMENSION
        or width * height > MAX_IMAGE_PIXELS
    ):
        raise PrivacyTransformError("Image dimensions exceed the processing limit.")


def _expand_region(
    x: int, y: int, width: int, height: int, image_width: int, image_height: int
) -> tuple[int, int, int, int]:
    margin_x = max(4, int(width * 0.18))
    margin_y = max(4, int(height * 0.18))
    left = max(0, x - margin_x)
    top = max(0, y - margin_y)
    right = min(image_width, x + width + margin_x)
    bottom = min(image_height, y + height + margin_y)
    return left, top, right, bottom


def _blur_region(image: np.ndarray, box: tuple[int, int, int, int]) -> None:
    left, top, right, bottom = box
    region = image[top:bottom, left:right]
    if region.size == 0:
        return
    block_width = max(1, region.shape[1] // 12)
    block_height = max(1, region.shape[0] // 12)
    mosaic = cv2.resize(
        region,
        (block_width, block_height),
        interpolation=cv2.INTER_AREA,
    )
    pixelated = cv2.resize(
        mosaic,
        (region.shape[1], region.shape[0]),
        interpolation=cv2.INTER_NEAREST,
    )
    kernel_size = max(15, (min(region.shape[:2]) // 2) | 1)
    blurred = cv2.GaussianBlur(pixelated, (kernel_size, kernel_size), 0)
    image[top:bottom, left:right] = blurred


def _cascade_default_path(filename: str) -> Path | None:
    bundled_path = getattr(getattr(cv2, "data", None), "haarcascades", None)
    candidates = [
        Path(bundled_path) / filename if bundled_path else None,
        Path(sys.prefix) / "share/opencv4/haarcascades" / filename,
        Path("/usr/share/opencv4/haarcascades") / filename,
        Path("/opt/homebrew/share/opencv4/haarcascades") / filename,
    ]
    return next((path for path in candidates if path and path.is_file()), None)


def _load_detector(environment_key: str, fallback_name: str) -> RegionDetector:
    configured = os.environ.get(environment_key, "").strip()
    path = Path(configured) if configured else _cascade_default_path(fallback_name)
    if path is None or not path.is_file():
        raise RuntimeError(f"Required visual-region model is unavailable: {environment_key}.")
    detector = cv2.CascadeClassifier(str(path))
    if detector.empty():
        raise RuntimeError(f"Required visual-region model could not be loaded: {environment_key}.")
    return detector


class PrivacyTransformer:
    def __init__(
        self,
        face_detector: RegionDetector | None = None,
        plate_detector: RegionDetector | None = None,
    ) -> None:
        self.face_detector = face_detector or _load_detector(
            "FACE_CASCADE_PATH", "haarcascade_frontalface_default.xml"
        )
        self.plate_detector = plate_detector or _load_detector(
            "PLATE_CASCADE_PATH", "haarcascade_license_plate_rus_16stages.xml"
        )
        cv2.setNumThreads(1)

    def transform(self, data: bytes) -> TransformResult:
        if not data or len(data) > MAX_IMAGE_BYTES:
            raise PrivacyTransformError("Image payload is empty or exceeds the size limit.")

        width, height = _image_dimensions(data)
        _validate_dimensions(width, height)

        encoded = np.frombuffer(data, dtype=np.uint8)
        image = cv2.imdecode(encoded, cv2.IMREAD_COLOR)
        if image is None:
            raise PrivacyTransformError("Image data could not be decoded.")
        image_height, image_width = image.shape[:2]
        _validate_dimensions(image_width, image_height)

        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        face_regions = self.face_detector.detectMultiScale(
            gray,
            scaleFactor=1.05,
            minNeighbors=4,
            minSize=(24, 24),
        )
        plate_regions = self.plate_detector.detectMultiScale(
            gray,
            scaleFactor=1.05,
            minNeighbors=3,
            minSize=(48, 14),
        )

        for regions in (face_regions, plate_regions):
            for x, y, box_width, box_height in regions:
                box = _expand_region(
                    int(x),
                    int(y),
                    int(box_width),
                    int(box_height),
                    image_width,
                    image_height,
                )
                _blur_region(image, box)

        success, output = cv2.imencode(
            ".jpg",
            image,
            [cv2.IMWRITE_JPEG_QUALITY, JPEG_QUALITY],
        )
        if not success:
            raise PrivacyTransformError("Processed image could not be encoded.")
        return TransformResult(
            jpeg_bytes=output.tobytes(),
            face_region_count=len(face_regions),
            plate_region_count=len(plate_regions),
        )
