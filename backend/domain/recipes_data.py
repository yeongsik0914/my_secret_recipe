# backend/domain/recipes_data.py
"""
한국 인기 유튜브 검증 레시피 데이터셋 (Python 백엔드 도메인)
"""

from typing import List
try:
    from domain.models import Recipe, RecipeIngredient, YouTubeMetadata, RecipeStep
except ImportError:
    from .models import Recipe, RecipeIngredient, YouTubeMetadata, RecipeStep

PYTHON_RECIPES_DATA: List[Recipe] = [
    Recipe(
        id="recipe_01",
        craft_no="OAK CRAFT NO. 01",
        title="스팸 김치 두부 짜글이",
        sub_title="찌개 • 나홀로 푸짐",
        description="잘 익은 김치와 짭조름한 스팸, 부드러운 두부가 자작한 국물에 어우러져 밥 두 공기 비우게 만드는 든든한 찌개.",
        theme="korean_stew",
        rating=4.9,
        review_count=324,
        time_minutes=20,
        difficulty="난이도 하",
        calorie=520,
        match_rate=90,
        youtube=YouTubeMetadata(
            channel="백종원의 요리비책",
            subscribers="568만명",
            views="348만회",
            title="스팸과 김치만 있으면 끝! 밥도둑 스팸김치짜글이",
            embed_id="N_7i62FEKkk",
            url="https://www.youtube.com/watch?v=N_7i62FEKkk"
        ),
        ingredients=[
            RecipeIngredient(name="스팸", need=1.0, unit="캔", shelf="meat", match=True),
            RecipeIngredient(name="김치", need=200.0, unit="g", shelf="sauce", match=True),
            RecipeIngredient(name="두부", need=1.0, unit="모", shelf="dairy", match=True),
            RecipeIngredient(name="대파", need=1.0, unit="대", shelf="vege", match=True),
            RecipeIngredient(name="양파", need=0.5, unit="개", shelf="vege", match=True),
            RecipeIngredient(name="다진마늘", need=1.0, unit="스푼", shelf="sauce", match=True),
        ],
        steps=[
            RecipeStep(step=1, title="재료 썰기", desc="스팸은 비닐봉지에 넣고 으깨거나 한입 크기로 깍둑썰기하고, 김치와 양파, 대파도 먹기 좋게 썹니다.", time="3분"),
            RecipeStep(step=2, title="스팸과 김치 볶기", desc="냄비에 스팸과 김치, 다진마늘을 넣고 중불에서 고소한 기름이 나올 때까지 볶아줍니다.", time="4분"),
            RecipeStep(step=3, title="물 붓고 자작하게 끓이기", desc="물 300ml와 고춧가루 1스푼, 진간장 1스푼을 넣고 센 불에서 팔팔 끓입니다.", time="7분"),
            RecipeStep(step=4, title="두부와 대파 넣고 완성", desc="도톰하게 썬 두부와 송송 썬 대파를 얹은 뒤 5분간 약불로 자작하게 졸여 마무리합니다.", time="6분"),
        ]
    ),
    Recipe(
        id="recipe_02",
        craft_no="MAPLE CRAFT NO. 02",
        title="황금 대파계란 볶음밥",
        sub_title="소소한 후라이팬 • 마가린",
        description="달궈진 팬에 대파를 듬뿍 볶아 풍미 가득한 파기름을 내고, 밥알 하나하나에 계란 코팅을 입힌 고소 그 자체 볶음밥.",
        theme="quick_15min",
        rating=5.0,
        review_count=512,
        time_minutes=12,
        difficulty="난이도 극하",
        calorie=430,
        match_rate=100,
        badge_text="1인가구 1위",
        youtube=YouTubeMetadata(
            channel="하루한끼 one meal a day",
            subscribers="420만명",
            views="6780만회",
            title="중국집 볶음밥보다 10배 맛있는 인생 파계란볶음밥",
            embed_id="A5Qg-JriOX4",
            url="https://www.youtube.com/watch?v=A5Qg-JriOX4"
        ),
        ingredients=[
            RecipeIngredient(name="대파", need=1.0, unit="대", shelf="vege", match=True),
            RecipeIngredient(name="계란", need=2.0, unit="알", shelf="dairy", match=True),
            RecipeIngredient(name="즉석밥", need=1.0, unit="공기", shelf="sauce", match=True),
            RecipeIngredient(name="간장", need=1.0, unit="스푼", shelf="sauce", match=True),
        ],
        steps=[
            RecipeStep(step=1, title="파기름 내기", desc="팬에 식용유 2스푼을 두르고 송송 썬 대파를 듬뿍 넣어 약불에서 노릇노릇 파기름을 냅니다.", time="3분"),
            RecipeStep(step=2, title="스크램블 에그", desc="파를 한쪽으로 밀어두고 빈 공간에 계란 2개를 풀어 부드러운 스크램블을 만듭니다.", time="2분"),
            RecipeStep(step=3, title="간장 불맛 입히기", desc="팬 가장자리에 간장 1스푼을 눌려 태우듯 끓여 불맛을 더한 뒤 계란, 파와 섞습니다.", time="2분"),
            RecipeStep(step=4, title="밥 넣고 고슬고슬 볶기", desc="즉석밥을 데우지 않고 그대로 넣어 주걱을 세워 밥알을 가르며 센 불에 고슬고슬 볶아냅니다.", time="5분"),
        ]
    ),
    Recipe(
        id="recipe_03",
        craft_no="WALNUT CRAFT NO. 03",
        title="양파 듬뿍 스팸 마요 덮밥",
        sub_title="달콤짭조름 • 단짠의 정석",
        description="달달하게 캐러멜라이징된 채선 양파와 노릇하게 구운 스팸 큐브, 부드러운 스크램블에그의 환상적인 조화.",
        theme="quick_15min",
        rating=4.8,
        review_count=190,
        time_minutes=15,
        difficulty="난이도 하",
        calorie=580,
        match_rate=95,
        youtube=YouTubeMetadata(
            channel="오메추 오늘의 메뉴",
            subscribers="120만명",
            views="180만회",
            title="집에서 간단하게 만들어 먹는 스팸마요덮밥!",
            embed_id="rjhoBi-mhMk",
            url="https://www.youtube.com/watch?v=rjhoBi-mhMk"
        ),
        ingredients=[
            RecipeIngredient(name="양파", need=1.0, unit="개", shelf="vege", match=True),
            RecipeIngredient(name="스팸", need=0.5, unit="캔", shelf="meat", match=True),
            RecipeIngredient(name="계란", need=2.0, unit="알", shelf="dairy", match=True),
            RecipeIngredient(name="마요네즈", need=2.0, unit="스푼", shelf="sauce", match=True),
            RecipeIngredient(name="즉석밥", need=1.0, unit="공기", shelf="sauce", match=True),
        ],
        steps=[
            RecipeStep(step=1, title="스팸 큐브 굽기", desc="스팸을 1cm 주사위 모양으로 썰어 팬에서 사방이 바삭하고 노릇해질 때까지 굽습니다.", time="4분"),
            RecipeStep(step=2, title="양파 조림 만들기", desc="채 썬 양파를 팬에 볶다가 간장 1스푼, 올리고당 1스푼을 넣고 숨이 푹 죽을 때까지 조려줍니다.", time="4분"),
            RecipeStep(step=3, title="계란 스크램블", desc="계란을 부드럽게 풀어 약불에서 80%만 익혀 몽글몽글한 식감을 살립니다.", time="2분"),
            RecipeStep(step=4, title="도마 플레이팅 & 마요네즈", desc="따뜻한 밥 위에 양파조림, 스크램블, 구운 스팸을 올리고 마요네즈를 격자로 뿌립니다.", time="5분"),
        ]
    )
]
