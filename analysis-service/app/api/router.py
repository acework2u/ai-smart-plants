from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, HttpUrl

from ..services.analyzer import analyze_image

router = APIRouter(prefix="/v1")


class AnalyzeRequest(BaseModel):
    imageUrl: HttpUrl | None = None
    imageBase64: str | None = None

    def validate_payload(self) -> None:
        if not self.imageUrl and not self.imageBase64:
            raise ValueError("Either imageUrl or imageBase64 must be provided")


class AnalyzeResponse(BaseModel):
    id: str
    status: str
    plantName: str
    issues: list[dict]
    score: float
    recommendations: list[dict]
    weatherSnapshot: dict
    createdAt: str


@router.get('/health')
async def health() -> dict:
    return {"data": {"status": "ok"}, "meta": {}, "errors": []}


@router.post('/analyze', response_model=AnalyzeResponse)
async def analyze(req: AnalyzeRequest) -> AnalyzeResponse:
    try:
        req.validate_payload()
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    result = analyze_image(req.imageUrl, req.imageBase64)
    return AnalyzeResponse(**result)
