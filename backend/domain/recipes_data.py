import re
import urllib.parse
from typing import List
try:
    from domain.models import Recipe, RecipeIngredient, YouTubeMetadata, RecipeStep
except ImportError:
    from .models import Recipe, RecipeIngredient, YouTubeMetadata, RecipeStep


def extract_clean_keywords(title: str = "") -> str:
    """
    레시피 제목에서 불필요한 장식성 수식어(AIR CRAFT NO. 13, 바삭 촉촉, 초간단, 황금 등)를
    제거하고 순수 요리명 키워드만 정밀 추출
    """
    if not title or not isinstance(title, str):
        return ""
    
    clean = title.strip()
    clean = re.sub(r'\[.*?\]', ' ', clean)
    clean = re.sub(r'\(.*?\)', ' ', clean)
    clean = re.sub(r'\b[A-Za-z0-9_\s-]*?\bNO\.\s*\d+\b', ' ', clean, flags=re.I)
    clean = re.sub(r'\b(?:AI|CHEF|SPECIAL|CRAFT)\b', ' ', clean, flags=re.I)

    buzzwords = [
        '바삭 촉촉', '바삭촉촉', '바삭한', '바삭 바삭한', '바삭바삭한', '바삭',
        '촉촉한', '촉촉', '겉바속촉',
        '초간단', '초간편', '초간단한', '간단한', '간단',
        '황금', '비법', '특제', '특선', '시그니처',
        '얼큰 칼칼', '얼큰칼칼', '얼큰한', '얼큰', '칼칼한', '칼칼',
        '매콤달콤', '매콤 달콤', '매콤 얼얼', '매콤얼얼', '매콤한', '매콤',
        '달콤 짭조름', '달콤 짭짤', '달콤', '단짠단짠', '단짠',
        '구수하고 진한', '구수한', '진한', '깊은',
        '노릇노릇', '노릇한', '고소한', '고소',
        '골든 풍미', '골든', '풍미 가득', '풍미', '감칠맛',
        '실패 없는', '실패없는', '10분 컷', '15분', '뚝딱',
        '집에서 누구나', '전문점 맛', '인생', '불맛 가득', '불맛',
        '1:1 맞춤', '맞춤 특선', '맞춤', '든든한', '한 끼', '웰빙', '레스토랑급',
        '오리엔탈'
    ]
    buzzwords.sort(key=lambda x: len(x), reverse=True)
    for word in buzzwords:
        clean = re.sub(rf'(?:^|\s){re.escape(word)}(?:\s|$)', ' ', clean, flags=re.I)

    clean = re.sub(r'[★*•·|/\\~^!?,]', ' ', clean)
    clean = re.sub(r'\s+', ' ', clean).strip()

    if not clean:
        clean = re.sub(r'[\[\]★*•·|/\\~^!?,]', ' ', title).strip()
    return clean


def generate_youtube_search_url(keyword: str = "") -> str:
    """추출된 키워드로 YouTube 공식 관련 영상 검색 URL 생성"""
    clean_kw = extract_clean_keywords(keyword) if keyword else ""
    target = clean_kw or keyword or "요리"
    return f"https://www.youtube.com/results?search_query={urllib.parse.quote(target + ' 레시피')}"


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
            RecipeIngredient(name="양파", need=1.0, unit="개", shelf="vege", match=True),
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
            RecipeIngredient(name="스팸", need=1.0, unit="캔", shelf="meat", match=True),
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
    ),
    Recipe(
        id="recipe_04",
        craft_no="TEAK CRAFT NO. 04",
        title="칼칼한 스팸 순두부찌개",
        sub_title="얼큰 국물 • 스트레스 해소",
        description="고소한 스팸 기름과 고춧가루를 볶아 얼큰한 고추기름을 내고, 몽글몽글 순두부와 계란을 톡 터뜨린 완벽 식사.",
        theme="korean_stew",
        rating=4.7,
        review_count=142,
        time_minutes=25,
        difficulty="난이도 중",
        calorie=490,
        match_rate=85,
        badge_text="얼큰 순두부",
        youtube=YouTubeMetadata(
            channel="백종원의 요리비책",
            subscribers="568만명",
            views="420만회",
            title="K-FOOD 대표 순두부찌개! 실패 0% 순두부찌개 황금레시피",
            embed_id="nj-DjQFEZb0",
            url="https://www.youtube.com/watch?v=nj-DjQFEZb0",
            search_url="https://www.youtube.com/results?search_query=%EC%88%9C%EB%91%90%EB%B6%80%EC%A7%8C%EA%B0%9C%20%EB%A0%88%EC%8B%9C%ED%94%BC"
        ),
        ingredients=[
            RecipeIngredient(name="스팸", need=1.0, unit="캔", shelf="meat", match=True),
            RecipeIngredient(name="계란", need=1.0, unit="알", shelf="dairy", match=True),
            RecipeIngredient(name="대파", need=1.0, unit="대", shelf="vege", match=True),
            RecipeIngredient(name="두부", need=1.0, unit="모", shelf="dairy", match=True),
            RecipeIngredient(name="고춧가루", need=2.0, unit="스푼", shelf="sauce", match=False)
        ],
        steps=[
            RecipeStep(step=1, title="스팸 으깨기", desc="스팸을 숟가락으로 거칠게 으깨 팬에서 기름이 나올 때까지 볶습니다.", time="4분"),
            RecipeStep(step=2, title="고추기름 내기", desc="으깬 스팸에 송송 썬 대파와 다진마늘, 고춧가루를 넣어 타지 않게 약불에 볶습니다.", time="5분"),
            RecipeStep(step=3, title="육수와 두부 투하", desc="물 350ml를 붓고 끓으면 두부를 큼직하게 썰어 넣고 국간장으로 간을 맞춥니다.", time="10분"),
            RecipeStep(step=4, title="계란 톡!", desc="불을 끄기 1분 전 신선란 1개를 가운데 톡 깨 넣고 후춧가루를 톡톡 뿌려 완성합니다.", time="6분")
        ]
    ),
    Recipe(
        id="recipe_05",
        craft_no="BIRCH CRAFT NO. 05",
        title="치즈 듬뿍 바삭 김치전",
        sub_title="비 오는 날 간식 • 바삭쫀득",
        description="가장자리는 튀기듯 바삭하게, 가운데는 쭉 늘어나는 모차렐라/체다 치즈를 듬뿍 넣어 새콤매콤함과 고소함이 공존하는 김치전.",
        theme="quick_15min",
        rating=4.9,
        review_count=226,
        time_minutes=18,
        difficulty="난이도 하",
        calorie=460,
        match_rate=90,
        badge_text="치즈 김치전",
        youtube=YouTubeMetadata(
            channel="백종원의 요리비책",
            subscribers="568만명",
            views="530만회",
            title="겉은 바삭 속은 쫄깃! 천둥 소리 날 때 부치는 초간단 김치전",
            embed_id="_-oaae1jjWs",
            url="https://www.youtube.com/watch?v=_-oaae1jjWs",
            search_url="https://www.youtube.com/results?search_query=%EA%B9%80%EC%B9%98%EC%A0%84%20%EB%A0%88%EC%8B%9C%ED%94%BC"
        ),
        ingredients=[
            RecipeIngredient(name="김치", need=300.0, unit="g", shelf="sauce", match=True),
            RecipeIngredient(name="양파", need=1.0, unit="개", shelf="vege", match=True),
            RecipeIngredient(name="체다치즈", need=2.0, unit="장", shelf="dairy", match=True),
            RecipeIngredient(name="부침가루", need=1.0, unit="컵", shelf="sauce", match=True)
        ],
        steps=[
            RecipeStep(step=1, title="김치 반죽 만들기", desc="잘 익은 김치를 가위로 잘게 썰고, 찬물과 부침가루를 1:1 비율로 가볍게 섞습니다.", time="5분"),
            RecipeStep(step=2, title="팬 달구기 & 튀기듯 부치기", desc="기름을 넉넉히 두르고 반죽을 얇게 펴서 가장자리가 바삭해지도록 중강불에 부칩니다.", time="5분"),
            RecipeStep(step=3, title="뒤집고 치즈 올리기", desc="한 번 뒤집은 후 윗면에 체다치즈나 피자치즈를 듬뿍 얹고 뚜껑을 덮어 치즈를 녹입니다.", time="4분"),
            RecipeStep(step=4, title="도마 위에 얹어 완성", desc="우드 도마 위에 바삭하게 플레이팅하여 가위로 피자처럼 잘라 즐깁니다.", time="4분")
        ]
    ),
    Recipe(
        id="recipe_06",
        craft_no="HINOKI CRAFT NO. 06",
        title="초간단 두부 계란 부침",
        sub_title="단백 단백질 • 10분 맛있는 반찬",
        description="물기 뺀 두부에 노릇한 계란물을 입혀 구워내어 대파 양념장에 찍어 먹는 영양만점 고소한 단백 한 끼.",
        theme="diet_clean",
        rating=4.9,
        review_count=89,
        time_minutes=10,
        difficulty="난이도 극하",
        calorie=280,
        match_rate=100,
        badge_text="완벽 일치 100%",
        youtube=YouTubeMetadata(
            channel="백종원의 요리비책",
            subscribers="568만명",
            views="380만회",
            title="매콤하게 졸여서~ 밥도둑 두부조림 & 두부부침 황금레시피",
            embed_id="Eino3yP-Wk0",
            url="https://www.youtube.com/watch?v=Eino3yP-Wk0",
            search_url="https://www.youtube.com/results?search_query=%EB%91%90%EB%B6%80%EB%B6%80%EC%B9%A8%20%EB%A0%88%EC%8B%9C%ED%94%BC"
        ),
        ingredients=[
            RecipeIngredient(name="두부", need=1.0, unit="모", shelf="dairy", match=True),
            RecipeIngredient(name="계란", need=2.0, unit="알", shelf="dairy", match=True),
            RecipeIngredient(name="대파", need=1.0, unit="대", shelf="vege", match=True),
            RecipeIngredient(name="진간장", need=1.0, unit="스푼", shelf="sauce", match=True)
        ],
        steps=[
            RecipeStep(step=1, title="두부 썰고 물기 제거", desc="두부를 1cm 두께로 도톰하게 썰어 키친타월로 가볍게 눌러 물기를 빼고 소금을 살짝 뿌립니다.", time="3분"),
            RecipeStep(step=2, title="계란물 입히기", desc="볼에 계란 2개를 풀고 송송 썬 대파를 넣은 뒤 두부에 계란옷을 골고루 입힙니다.", time="2분"),
            RecipeStep(step=3, title="앞뒤로 노릇하게 굽기", desc="기름 두른 팬에 두부를 올리고 약불에서 앞뒤로 황금빛이 돌 때까지 노릇하게 굽습니다.", time="4분"),
            RecipeStep(step=4, title="양념장과 함께 완성", desc="간장 1스푼, 고춧가루 약간, 참기름을 섞은 양념장과 함께 도마 위에 정갈히 담아냅니다.", time="1분")
        ]
    ),
    Recipe(
        id="recipe_07",
        craft_no="CEDAR CRAFT NO. 07",
        title="얼큰 불맛 마라 삼겹살 볶음",
        sub_title="마라의 알싸함 • 지글지글 볶음",
        description="노릇하게 구운 삼겹살에 특제 마라소스와 아삭한 파프리카, 브로콜리를 센 불에 휘몰아치듯 볶아낸 극상의 한 끼.",
        theme="korean_stew",
        rating=4.95,
        review_count=428,
        time_minutes=15,
        difficulty="난이도 하",
        calorie=580,
        match_rate=95,
        badge_text="인기 볶음 1위",
        youtube=YouTubeMetadata(
            channel="1분요리 뚝딱이형",
            subscribers="294만명",
            views="310만회",
            title="집에서 5분 만에 끝내는 냉장고 털기 마라샹궈",
            embed_id="JsXnSWmvNEU",
            url="https://www.youtube.com/watch?v=JsXnSWmvNEU",
            search_url="https://www.youtube.com/results?search_query=%EB%A7%88%EB%9D%BC%EC%83%89%EA%B5%AC%20%EB%A0%88%EC%8B%9C%ED%94%BC"
        ),
        ingredients=[
            RecipeIngredient(name="삼겹살", need=200.0, unit="g", shelf="meat", match=True),
            RecipeIngredient(name="마라소스", need=2.0, unit="스푼", shelf="sauce", match=True),
            RecipeIngredient(name="파프리카", need=1.0, unit="개", shelf="vege", match=True),
            RecipeIngredient(name="브로콜리", need=1.0, unit="송이", shelf="vege", match=True)
        ],
        steps=[
            RecipeStep(step=1, title="삼겹살 노릇하게 굽기", desc="팬을 달군 후 삼겹살을 한입 크기로 썰어 센 불에서 겉면이 바삭하게 노릇노릇 구워 기름을 냅니다.", time="4분"),
            RecipeStep(step=2, title="채소 투하 & 센 불 볶기", desc="삼겹살 기름에 먹기 좋게 썬 파프리카와 브로콜리를 넣고 아삭한 식감이 살아있게 볶습니다.", time="3분"),
            RecipeStep(step=3, title="마라소스 코팅", desc="특제 마라소스 2스푼을 두르고 팬을 흔들며 고기와 채소에 매콤알싸한 양념을 골고루 입힙니다.", time="3분"),
            RecipeStep(step=4, title="도마 플레이팅 완성", desc="우드 도마 위에 김이 모락모락 나는 마라 삼겹살 볶음을 수북이 담아냅니다.", time="2분")
        ]
    ),
    Recipe(
        id="recipe_08",
        craft_no="OLIVE CRAFT NO. 08",
        title="그릴드 닭가슴살 연어 샐러드 볼",
        sub_title="고단백 클린식 • 상큼 아삭",
        description="촉촉하게 구운 닭가슴살과 훈제 연어샐러드, 신선한 토마토와 상추에 고소한 치즈 토핑을 곁들인 완벽한 다이어트 클린 한 끼.",
        theme="diet_clean",
        rating=4.9,
        review_count=310,
        time_minutes=12,
        difficulty="난이도 극하",
        calorie=340,
        match_rate=100,
        badge_text="단백질 42g",
        youtube=YouTubeMetadata(
            channel="맛있는 다이어트",
            subscribers="95만명",
            views="260만회",
            title="닭가슴살과 신선 채소로 만드는 극강의 단백질 샐러드",
            embed_id="xiLqt4FUEzc",
            url="https://www.youtube.com/watch?v=xiLqt4FUEzc",
            search_url="https://www.youtube.com/results?search_query=%EB%8B%AD%EA%B0%80%EC%8A%B4%EC%82%B4%20%EC%83%90%EB%9F%AC%EB%93%9C%20%EB%A0%88%EC%8B%9C%ED%94%BC"
        ),
        ingredients=[
            RecipeIngredient(name="닭가슴살", need=1.0, unit="팩", shelf="meat", match=True),
            RecipeIngredient(name="연어샐러드", need=1.0, unit="팩", shelf="meat", match=True),
            RecipeIngredient(name="토마토", need=1.0, unit="개", shelf="vege", match=True),
            RecipeIngredient(name="상추", need=5.0, unit="장", shelf="vege", match=True),
            RecipeIngredient(name="치즈", need=1.0, unit="장", shelf="dairy", match=True)
        ],
        steps=[
            RecipeStep(step=1, title="닭가슴살 굽기", desc="달궈진 팬에 올리브유를 살짝 두르고 닭가슴살을 촉촉하게 노릇노릇 구워 결대로 찢어둡니다.", time="4분"),
            RecipeStep(step=2, title="신선 채소 손질", desc="상추는 한입 크기로 뜯고, 토마토는 도톰한 웨지 모양으로 썰어 찬물에 헹궈 물기를 뺍니다.", time="3분"),
            RecipeStep(step=3, title="연어와 채소 볼 세팅", desc="도마형 우드 볼에 상추와 토마토를 깔고 연어샐러드와 구운 닭가슴살을 듬뿍 얹습니다.", time="3분"),
            RecipeStep(step=4, title="치즈 토핑 & 완성", desc="고소한 치즈를 얇게 채 썰어 윗면에 눈꽃처럼 솔솔 뿌려 완성합니다.", time="2분")
        ]
    ),
    Recipe(
        id="recipe_09",
        craft_no="GOLDEN CRAFT NO. 09",
        title="진한 풍미 골든 감자 카레라이스",
        sub_title="15분 컷 한그릇 • 달콤포슬 카레",
        description="포슬포슬 감자와 달콤한 당근, 고소한 고기를 볶아 진한 골든 카레 루를 풀어 완성하는 남녀노소 호불호 없는 최고의 한그릇 요리.",
        theme="quick_15min",
        rating=4.95,
        review_count=540,
        time_minutes=15,
        difficulty="난이도 하",
        calorie=510,
        match_rate=100,
        badge_text="온가족 한그릇",
        youtube=YouTubeMetadata(
            channel="백종원의 요리비책",
            subscribers="568만명",
            views="490만회",
            title="돼지고기와 감자가 듬뿍! 백종원표 진한 풍미 감자 카레라이스",
            embed_id="I6oK6Ew0hno",
            url="https://www.youtube.com/watch?v=I6oK6Ew0hno",
            search_url="https://www.youtube.com/results?search_query=%EA%B0%90%EC%9E%90%20%EC%B9%B4%EB%A0%88%EB%9D%BC%EC%9D%B4%EC%8A%A4%20%EB%A0%88%EC%8B%9C%ED%94%BC"
        ),
        ingredients=[
            RecipeIngredient(name="카레", need=1.0, unit="봉", shelf="sauce", match=True),
            RecipeIngredient(name="감자", need=1.0, unit="개", shelf="vege", match=True),
            RecipeIngredient(name="당근", need=1.0, unit="개", shelf="vege", match=True),
            RecipeIngredient(name="삼겹살", need=150.0, unit="g", shelf="meat", match=True)
        ],
        steps=[
            RecipeStep(step=1, title="감자 • 당근 깍둑썰기", desc="감자와 당근, 고기를 2cm 크기로 먹기 좋게 깍둑썰기합니다.", time="3분"),
            RecipeStep(step=2, title="고기와 채소 달달 볶기", desc="냄비에 기름을 두르고 고기를 먼저 볶아 기름을 낸 뒤 감자와 당근을 넣고 투명해질 때까지 볶습니다.", time="4분"),
            RecipeStep(step=3, title="물 붓고 카레 풀기", desc="물 500ml를 붓고 채소가 익을 때까지 끓인 후 불을 끄고 카레 가루를 뭉침 없이 부드럽게 풉니다.", time="5분"),
            RecipeStep(step=4, title="자작하게 졸여 완성", desc="다시 약불로 3분간 저어가며 걸쭉한 농도가 될 때까지 끓여 밥 위에 푸짐하게 부어냅니다.", time="3분")
        ]
    ),
    Recipe(
        id="recipe_10",
        craft_no="ACACIA CRAFT NO. 10",
        title="매콤달콤 고추장 삼겹살 두루치기",
        sub_title="한식 볶음 • 쌈채소 곁들임",
        description="지글지글 삼겹살에 특제 고추장 양념장을 넣어 센 불에 볶아낸 뒤 신선한 상추에 싸먹는 매콤달콤 한식의 정석.",
        theme="korean_stew",
        rating=4.9,
        review_count=390,
        time_minutes=15,
        difficulty="난이도 하",
        calorie=590,
        match_rate=100,
        badge_text="밥도둑 1위",
        youtube=YouTubeMetadata(
            channel="백종원의 요리비책",
            subscribers="568만명",
            views="670만회",
            title="불 맛 가득! 실패 없는 제육볶음 & 돼지고기 두루치기 황금레시피",
            embed_id="j7s9VRsrm9o",
            url="https://www.youtube.com/watch?v=j7s9VRsrm9o",
            search_url="https://www.youtube.com/results?search_query=%EB%91%90%EB%A3%A8%EC%B9%98%EA%B8%B0%20%EB%A0%88%EC%8B%9C%ED%94%BC"
        ),
        ingredients=[
            RecipeIngredient(name="삼겹살", need=200.0, unit="g", shelf="meat", match=True),
            RecipeIngredient(name="고추장", need=2.0, unit="스푼", shelf="sauce", match=True),
            RecipeIngredient(name="당근", need=1.0, unit="개", shelf="vege", match=True),
            RecipeIngredient(name="파프리카", need=1.0, unit="개", shelf="vege", match=True),
            RecipeIngredient(name="상추", need=6.0, unit="장", shelf="vege", match=True)
        ],
        steps=[
            RecipeStep(step=1, title="삼겹살 센 불 굽기", desc="팬을 센 불로 달구고 삼겹살을 넣어 겉면을 바삭하게 구워 풍부한 돼지기름을 만듭니다.", time="4분"),
            RecipeStep(step=2, title="채소와 고추장 양념 투하", desc="채 썬 당근, 파프리카와 고추장 2스푼, 설탕 0.5스푼을 넣고 센 불에서 강하게 볶아 불맛을 냅니다.", time="4분"),
            RecipeStep(step=3, title="자작하게 양념 코팅", desc="양념이 고기 속까지 쏙 배어들도록 약불에서 3분간 뒤적이며 윤기 나게 졸입니다.", time="3분"),
            RecipeStep(step=4, title="상추 쌈과 함께 도마 세팅", desc="도마 위에 깨끗이 씻은 상추를 정갈히 깔고 뜨거운 두루치기를 소복이 올려 완성합니다.", time="2분")
        ]
    ),
    Recipe(
        id="recipe_11",
        craft_no="RUSTIC CRAFT NO. 11",
        title="특제 양념 갈비구이 & 감자조림",
        sub_title="육즙 폭발 • 단짠단짠 명작",
        description="두툼한 갈비를 양념에 재워 감자와 함께 노릇하게 구워내고 감칠맛 넘치는 양념에 졸여낸 도마 위 특선 고기 요리.",
        theme="korean_stew",
        rating=5.0,
        review_count=460,
        time_minutes=22,
        difficulty="난이도 중",
        calorie=620,
        match_rate=100,
        badge_text="셰프 시그니처",
        youtube=YouTubeMetadata(
            channel="백종원의 요리비책",
            subscribers="568만명",
            views="410만회",
            title="입에서 살살 녹는 단짠단짠 돼지갈비찜 & 갈비구이 황금레시피",
            embed_id="E4so3rBlG2o",
            url="https://www.youtube.com/watch?v=E4so3rBlG2o",
            search_url="https://www.youtube.com/results?search_query=%EA%B0%88%EB%B9%84%EA%B5%AC%EC%9D%B4%20%EB%A0%88%EC%8B%9C%ED%94%BC"
        ),
        ingredients=[
            RecipeIngredient(name="갈비", need=300.0, unit="g", shelf="meat", match=True),
            RecipeIngredient(name="감자", need=1.0, unit="개", shelf="vege", match=True),
            RecipeIngredient(name="당근", need=1.0, unit="개", shelf="vege", match=True),
            RecipeIngredient(name="고추장", need=1.0, unit="스푼", shelf="sauce", match=True)
        ],
        steps=[
            RecipeStep(step=1, title="갈비 칼집 내기 & 밑간", desc="갈비에 사선으로 촘촘히 칼집을 내어 육질을 부드럽게 만들고 양념이 잘 스며들게 합니다.", time="5분"),
            RecipeStep(step=2, title="채소 손질 및 초벌 굽기", desc="감자와 당근을 큼직하게 썰고, 팬에서 갈비의 겉면을 노릇하게 초벌구이합니다.", time="5분"),
            RecipeStep(step=3, title="양념장 붓고 졸이기", desc="고추장 1스푼과 물 200ml, 간장을 더한 양념장을 붓고 감자와 함께 뚜껑을 덮어 중약불에 졸입니다.", time="8분"),
            RecipeStep(step=4, title="도마 위 갈비 컷팅 & 완성", desc="도마 위에 갈비와 포슬포슬 익은 감자를 올리고 먹기 좋은 크기로 썰어 서빙합니다.", time="4분")
        ]
    )
,
    Recipe(
        id="recipe_12",
        craft_no="BAMBOO CRAFT NO. 12",
        title="고소한 치즈 토마토 두부 카프레제",
        sub_title="이탈리안 퓨전 • 가벼운 클린식",
        description="노릇하게 구운 두부 사이에 슬라이스 토마토와 치즈를 겹겹이 쌓고 데친 브로콜리를 곁들여 즐기는 건강하고 고급스러운 도마 요리.",
        theme="diet_clean",
        rating=4.85,
        review_count=195,
        time_minutes=12,
        difficulty="난이도 극하",
        calorie=290,
        match_rate=100,
        badge_text="저칼로리 고단백",
        youtube=YouTubeMetadata(
            channel="반이짝이 1분 레시피",
            subscribers="68만명",
            views="145만회",
            title="방울토마토 보코치니 카프레제 샐러드 w. 발사믹소스 드레싱",
            embed_id="J1v721PgaUE",
            url="https://www.youtube.com/watch?v=J1v721PgaUE",
            search_url="https://www.youtube.com/results?search_query=%ED%86%A0%EB%A7%88%ED%86%A0%20%EC%B9%B4%ED%94%84%EB%A0%88%EC%A0%9C%20%EB%A0%88%EC%8B%9C%ED%94%BC"
        ),
        ingredients=[
            RecipeIngredient(name="두부", need=1.0, unit="모", shelf="dairy", match=True),
            RecipeIngredient(name="치즈", need=2.0, unit="장", shelf="dairy", match=True),
            RecipeIngredient(name="토마토", need=1.0, unit="개", shelf="vege", match=True),
            RecipeIngredient(name="브로콜리", need=1.0, unit="송이", shelf="vege", match=True),
        ],
        steps=[
            RecipeStep(step=1, title="두부 도톰하게 썰기", desc="두부를 1.5cm 두께로 정갈하게 썰어 키친타월로 가볍게 물기를 제거합니다.", time="3분"),
            RecipeStep(step=2, title="두부 팬에 노릇하게 굽기", desc="기름을 살짝 두른 팬에 두부를 올려 앞뒤로 은은한 황금빛이 나도록 구워냅니다.", time="4분"),
            RecipeStep(step=3, title="토마토 슬라이스 & 카프레제 스택", desc="토마토를 동글게 썰고, 도마 위에 [구운 두부 - 토마토 - 치즈] 순으로 번갈아 겹쳐 세팅합니다.", time="3분"),
            RecipeStep(step=4, title="브로콜리 가니시 & 완성", desc="살짝 데친 브로콜리를 주변에 곁들이고 취향에 따라 발사믹이나 소금을 살짝 곁들입니다.", time="2분"),
        ]
    ),
    Recipe(
        id="recipe_13",
        craft_no="AIR CRAFT NO. 13",
        title="바삭 촉촉 닭가슴살 감자 에어프라이어 구이",
        sub_title="초간단 15분 • 담백 고소",
        description="먹기 좋게 썬 닭가슴살과 웨지 감자, 브로콜리, 파프리카를 에어프라이어에 노릇하게 구워 고소한 땅콩 토핑을 곁들인 웰빙 요리.",
        theme="diet_clean",
        rating=4.95,
        review_count=375,
        time_minutes=15,
        difficulty="난이도 하",
        calorie=360,
        match_rate=100,
        badge_text="에어프라이어 1위",
        youtube=YouTubeMetadata(
            channel="식탁일기 table diary",
            subscribers="152만명",
            views="280만회",
            title="닭가슴살을 가장 맛있게 먹는 방법 (에어프라이어 겉바속촉 구이 레시피)",
            embed_id="_Vq0HnbVqyo",
            url="https://www.youtube.com/watch?v=_Vq0HnbVqyo",
            search_url="https://www.youtube.com/results?search_query=%EB%8B%AD%EA%B0%80%EC%8A%B4%EC%82%B4%20%EA%B0%90%EC%9E%90%20%EC%97%90%EC%96%B4%ED%94%84%EB%9D%BC%EC%9D%B4%EC%96%B4%20%EA%B5%AC%EC%9D%B4%20%EB%A0%88%EC%8B%9C%ED%94%BC"
        ),
        ingredients=[
            RecipeIngredient(name="닭가슴살", need=1.0, unit="팩", shelf="meat", match=True),
            RecipeIngredient(name="감자", need=1.0, unit="개", shelf="vege", match=True),
            RecipeIngredient(name="브로콜리", need=1.0, unit="송이", shelf="vege", match=True),
            RecipeIngredient(name="파프리카", need=1.0, unit="개", shelf="vege", match=True),
            RecipeIngredient(name="땅콩", need=1.0, unit="줌", shelf="sauce", match=True),
        ],
        steps=[
            RecipeStep(step=1, title="재료 깍둑썰기 & 오일 코팅", desc="닭가슴살과 감자, 파프리카를 한입 크기로 썰고 올리브유와 소금 약간을 버무립니다.", time="4분"),
            RecipeStep(step=2, title="에어프라이어 1차 굽기", desc="180도 예열된 에어프라이어에 닭가슴살과 감자를 넣고 10분간 바삭하게 구워냅니다.", time="6분"),
            RecipeStep(step=3, title="브로콜리 투하 & 2차 굽기", desc="브로콜리와 파프리카를 추가로 넣고 180도에서 4분간 더 구워 노릇한 색감을 살립니다.", time="3분"),
            RecipeStep(step=4, title="도마 세팅 & 땅콩 토핑", desc="도마 위에 구워진 재료들을 먹음직스럽게 쏟아붓고 으깬 땅콩을 고소하게 솔솔 뿌려 마무리합니다.", time="2분"),
        ]
    ),
    Recipe(
        id="recipe_14",
        craft_no="POT CRAFT NO. 14",
        title="얼큰 마라 두부 삼겹 찌개",
        sub_title="마라 전골 • 깊은 국물 요리",
        description="고소한 삼겹살 기름에 마라소스를 볶아 진한 마라 육수를 내고 부드러운 두부와 채소를 듬뿍 넣어 끓여낸 중독적인 맛의 찌개.",
        theme="korean_stew",
        rating=4.9,
        review_count=290,
        time_minutes=20,
        difficulty="난이도 하",
        calorie=540,
        match_rate=100,
        badge_text="얼큰 국물 끝판왕",
        youtube=YouTubeMetadata(
            channel="다솔쿠 DASOL COO",
            subscribers="120만명",
            views="150만회",
            title="라면보다 쉬운 집에서 끓이는 얼큰 마라탕 & 마라두부전골 찌개",
            embed_id="gFoT-Df74Kk",
            url="https://www.youtube.com/watch?v=gFoT-Df74Kk"
        ),
        ingredients=[
            RecipeIngredient(name="삼겹살", need=150.0, unit="g", shelf="meat", match=True),
            RecipeIngredient(name="마라소스", need=2.0, unit="스푼", shelf="sauce", match=True),
            RecipeIngredient(name="두부", need=1.0, unit="모", shelf="dairy", match=True),
            RecipeIngredient(name="파프리카", need=1.0, unit="개", shelf="vege", match=True),
        ],
        steps=[
            RecipeStep(step=1, title="삼겹살과 마라소스 볶기", desc="냄비에 삼겹살을 넣고 볶다가 기름이 나오면 마라소스 2스푼을 넣어 칼칼한 향을 냅니다.", time="4분"),
            RecipeStep(step=2, title="물 붓고 육수 우려내기", desc="물 400ml를 붓고 센 불에서 팔팔 끓여 삼겹살의 고소한 육수가 배어나오게 합니다.", time="6분"),
            RecipeStep(step=3, title="두부와 파프리카 투하", desc="도톰하게 썬 두부와 아삭한 파프리카를 넣고 중불에서 5분간 자작하게 끓입니다.", time="6분"),
            RecipeStep(step=4, title="도마 위 뚝배기 플레이팅", desc="뜨거운 국물 요리를 우드 도마 받침 위에 정갈하게 올려 식지 않게 즐깁니다.", time="4분"),
        ]
    )
]

for _r in PYTHON_RECIPES_DATA:
    if _r.youtube and not _r.youtube.search_url:
        _r.youtube.search_url = generate_youtube_search_url(_r.title)
