# backend/domain/models.py
"""
키친 셰프 (Kitchen Chef) 도메인 데이터 모델 정의
"""

from dataclasses import dataclass, field, asdict
from typing import List, Optional, Dict, Any

@dataclass
class Ingredient:
    id: str
    name: str
    count: float
    unit: str
    shelf: str  # vege, meat, dairy, sauce
    freshness: str = "fresh"  # fresh, expiring
    days_left: int = 7
    selected: bool = True

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class RecipeIngredient:
    name: str
    need: float
    unit: str
    shelf: str
    match: bool = False

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class YouTubeMetadata:
    channel: str
    subscribers: str
    views: str
    title: str
    embed_id: str
    url: str

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class RecipeStep:
    step: int
    title: str
    desc: str
    time: str

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class Recipe:
    id: str
    craft_no: str
    title: str
    sub_title: str
    description: str
    theme: str
    rating: float
    review_count: int
    time_minutes: int
    difficulty: str
    calorie: int
    match_rate: int
    youtube: YouTubeMetadata
    ingredients: List[RecipeIngredient]
    steps: List[RecipeStep]
    missing_ingredients: List[str] = field(default_factory=list)
    badge_text: Optional[str] = None
    quality_badge: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "craftNo": self.craft_no,
            "title": self.title,
            "subTitle": self.sub_title,
            "description": self.description,
            "theme": self.theme,
            "rating": self.rating,
            "reviewCount": self.review_count,
            "timeMinutes": self.time_minutes,
            "difficulty": self.difficulty,
            "calorie": self.calorie,
            "matchRate": self.match_rate,
            "badgeText": self.badge_text,
            "qualityBadge": self.quality_badge,
            "youtube": self.youtube.to_dict(),
            "ingredients": [i.to_dict() for i in self.ingredients],
            "steps": [s.to_dict() for s in self.steps],
            "missingIngredients": self.missing_ingredients
        }


@dataclass
class User:
    id: str
    name: str
    level: str
    email: str
    avatar: str
    is_logged_in: bool = True

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class CommunityPost:
    id: str
    author: str
    author_badge: str
    tag: str
    time_ago: str
    rating: float
    content: str
    recipe_name: str
    chef_tip: str = ""
    likes: int = 1
    comments: int = 0
    verified: bool = True

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)
