from datetime import datetime
from typing import Optional

from ..config import get_settings
from ..logger import logger


def _now_iso() -> str:
    return datetime.utcnow().replace(microsecond=0).isoformat() + "Z"


def run_mock_analysis(plant_name: Optional[str] = None) -> dict:
    logger.debug("Running mock analysis")

    detected_name = plant_name or "Monstera Deliciosa"
    recommendations = [
        {
            "id": "tip_water_adjust",
            "title": "ลดการรดน้ำ",
            "desc": "ลดความถี่ลงเหลือทุก 5 วัน",
        },
        {
            "id": "tip_light",
            "title": "เพิ่มแสงอ่อน",
            "desc": "ตั้งใกล้หน้าต่างกรองแสงในตอนเช้า",
        },
    ]

    return {
        "id": "analysis_mock_001",
        "status": "completed",
        "plantName": detected_name,
        "issues": [
            {"code": "yellow_leaf", "severity": "moderate", "confidence": 0.72}
        ],
        "score": 0.85,
        "recommendations": recommendations,
        "weatherSnapshot": {
            "tempC": 33,
            "humidity": 70,
            "condition": "sunny",
            "capturedAt": _now_iso(),
        },
        "createdAt": _now_iso(),
    }


def analyze_image(image_url: Optional[str], image_base64: Optional[str]) -> dict:
    settings = get_settings()

    logger.info(
        "Received analysis request", extra={"hasUrl": bool(image_url), "hasBase64": bool(image_base64)}
    )

    if settings.mock_analysis:
        return run_mock_analysis()

    raise NotImplementedError("Real model inference not yet implemented")
