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
            channel="백종원의 요리비책",
            subscribers="568만명",
            views="410만회",
            title="집에서 마라탕집 불맛 내는 마라 삼겹살 볶음 황금비법",
            embed_id="N_7i62FEKkk",
            url="https://www.youtube.com/watch?v=N_7i62FEKkk"
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
            channel="피지컬갤러리",
            subscribers="310만명",
            views="285만회",
            title="다이어터 필수! 닭가슴살 연어로 만드는 극강의 단백질 샐러드",
            embed_id="f9D_J3L_x1A",
            url="https://www.youtube.com/watch?v=f9D_J3L_x1A"
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
            views="520만회",
            title="카레에 이 비법만 더하면 인생 카레가 됩니다! 감자 듬뿍 황금 카레",
            embed_id="A5Qg-JriOX4",
            url="https://www.youtube.com/watch?v=A5Qg-JriOX4"
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
            channel="뚝딱이형",
            subscribers="250만명",
            views="360만회",
            title="기사식당 불맛 그대로! 인생 고추장 삼겹살 두루치기 레시피",
            embed_id="rjhoBi-mhMk",
            url="https://www.youtube.com/watch?v=rjhoBi-mhMk"
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
            channel="고기남자 MeatMan",
            subscribers="158만명",
            views="340만회",
            title="갈비가 입에서 살살 녹는 특제 양념 갈비구이의 모든 것",
            embed_id="2Xy3KzH04a4",
            url="https://www.youtube.com/watch?v=2Xy3KzH04a4"
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
]
