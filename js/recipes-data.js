// js/recipes-data.js
// 한국 인기 유튜브 요리 채널 데이터 기반 검증된 최적 도마 레시피 데이터셋

export const RECIPES_DATA = [
  {
    id: "recipe_01",
    craftNo: "OAK CRAFT NO. 01",
    title: "스팸 김치 두부 짜글이",
    subTitle: "찌개 • 나홀로 푸짐",
    description: "잘 익은 김치와 짭조름한 스팸, 부드러운 두부가 자작한 국물에 어우러져 밥 두 공기 비우게 만드는 든든한 찌개.",
    theme: "korean_stew",
    rating: 4.9,
    reviewCount: 324,
    timeMinutes: 20,
    difficulty: "난이도 하",
    calorie: 520,
    matchRate: 90,
    youtube: {
      channel: "백종원의 요리비책",
      subscribers: "568만명",
      views: "348만회",
      title: "스팸과 김치만 있으면 끝! 밥도둑 스팸김치짜글이",
      embedId: "N_7i62FEKkk",
      url: "https://www.youtube.com/watch?v=N_7i62FEKkk"
    },
    // 사용자 냉장고 식재료 매칭 및 소모 수량
    ingredients: [
      { name: "스팸", need: 1, unit: "캔", match: true, shelf: "meat" },
      { name: "김치", need: 200, unit: "g", match: true, shelf: "sauce" },
      { name: "두부", need: 1, unit: "모", match: true, shelf: "dairy" },
      { name: "대파", need: 1, unit: "대", match: true, shelf: "vege" },
      { name: "양파", need: 1, unit: "개", match: true, shelf: "vege" },
      { name: "다진마늘", need: 1, unit: "스푼", match: true, shelf: "sauce" }
    ],
    missingIngredients: [],
    steps: [
      { step: 1, title: "재료 썰기", desc: "스팸은 비닐봉지에 넣고 으깨거나 한입 크기로 깍둑썰기하고, 김치와 양파, 대파도 먹기 좋게 썹니다.", time: "3분" },
      { step: 2, title: "스팸과 김치 볶기", desc: "냄비에 스팸과 김치, 다진마늘을 넣고 중불에서 고소한 기름이 나올 때까지 볶아줍니다.", time: "4분" },
      { step: 3, title: "물 붓고 자작하게 끓이기", desc: "물 300ml와 고춧가루 1스푼, 진간장 1스푼을 넣고 센 불에서 팔팔 끓입니다.", time: "7분" },
      { step: 4, title: "두부와 대파 넣고 완성", desc: "도톰하게 썬 두부와 송송 썬 대파를 얹은 뒤 5분간 약불로 자작하게 졸여 마무리합니다.", time: "6분" }
    ]
  },
  {
    id: "recipe_02",
    craftNo: "MAPLE CRAFT NO. 02",
    title: "황금 대파계란 볶음밥",
    subTitle: "소소한 후라이팬 • 마가린",
    description: "달궈진 팬에 대파를 듬뿍 볶아 풍미 가득한 파기름을 내고, 밥알 하나하나에 계란 코팅을 입힌 고소그 자체 볶음밥.",
    theme: "quick_15min",
    rating: 5.0,
    reviewCount: 512,
    timeMinutes: 12,
    difficulty: "난이도 극하",
    calorie: 430,
    matchRate: 100,
    badgeText: "1인가구 1위",
    youtube: {
      channel: "하루한끼 one meal a day",
      subscribers: "420만명",
      views: "6780만회",
      title: "중국집 볶음밥보다 10배 맛있는 인생 파계란볶음밥",
      embedId: "A5Qg-JriOX4",
      url: "https://www.youtube.com/watch?v=A5Qg-JriOX4"
    },
    ingredients: [
      { name: "대파", need: 1, unit: "대", match: true, shelf: "vege" },
      { name: "계란", need: 2, unit: "알", match: true, shelf: "dairy" },
      { name: "즉석밥", need: 1, unit: "공기", match: true, shelf: "sauce" },
      { name: "간장", need: 1, unit: "스푼", match: true, shelf: "sauce" }
    ],
    missingIngredients: [],
    steps: [
      { step: 1, title: "파기름 내기", desc: "팬에 식용유 2스푼을 두르고 송송 썬 대파를 듬뿍 넣어 약불에서 노릇노릇 파기름을 냅니다.", time: "3분" },
      { step: 2, title: "스크램블 에그", desc: "파를 한쪽으로 밀어두고 빈 공간에 계란 2개를 풀어 부드러운 스크램블을 만듭니다.", time: "2분" },
      { step: 3, title: "간장 불맛 입히기", desc: "팬 가장자리에 간장 1스푼을 눌려 태우듯 끓여 불맛을 더한 뒤 계란, 파와 섞습니다.", time: "2분" },
      { step: 4, title: "밥 넣고 고슬고슬 볶기", desc: "즉석밥을 데우지 않고 그대로 넣어 주걱을 세워 밥알을 가르며 센 불에 고슬고슬 볶아냅니다.", time: "5분" }
    ]
  },
  {
    id: "recipe_03",
    craftNo: "WALNUT CRAFT NO. 03",
    title: "양파 듬뿍 스팸 마요 덮밥",
    subTitle: "달콤짭조름 • 단짠의 정석",
    description: "달달하게 캐러멜라이징된 채선 양파와 노릇하게 구운 스팸 큐브, 부드러운 스크램블에그의 환상적인 조화.",
    theme: "quick_15min",
    rating: 4.8,
    reviewCount: 190,
    timeMinutes: 15,
    difficulty: "난이도 하",
    calorie: 580,
    matchRate: 95,
    youtube: {
      channel: "오메추 오늘의 메뉴",
      subscribers: "120만명",
      views: "180만회",
      title: "집에서 초간단으로 맛있게 만드는 스팸마요 덮밥!",
      embedId: "rjhoBi-mhMk",
      url: "https://www.youtube.com/watch?v=rjhoBi-mhMk"
    },
    ingredients: [
      { name: "양파", need: 1, unit: "개", match: true, shelf: "vege" },
      { name: "스팸", need: 1, unit: "캔", match: true, shelf: "meat" },
      { name: "계란", need: 2, unit: "알", match: true, shelf: "dairy" },
      { name: "마요네즈", need: 2, unit: "스푼", match: true, shelf: "sauce" },
      { name: "즉석밥", need: 1, unit: "공기", match: true, shelf: "sauce" }
    ],
    missingIngredients: [],
    steps: [
      { step: 1, title: "스팸 큐브 굽기", desc: "스팸을 1cm 주사위 모양으로 썰어 팬에서 사방이 바삭하고 노릇해질 때까지 굽습니다.", time: "4분" },
      { step: 2, title: "양파 조림 만들기", desc: "채 썬 양파를 팬에 볶다가 간장 1스푼, 올리고당 1스푼을 넣고 숨이 푹 죽을 때까지 조려줍니다.", time: "4분" },
      { step: 3, title: "계란 스크램블", desc: "계란을 부드럽게 풀어 약불에서 80%만 익혀 몽글몽글한 식감을 살립니다.", time: "2분" },
      { step: 4, title: "도마 플레이팅 & 마요네즈", desc: "따뜻한 밥 위에 양파조림, 스크램블, 구운 스팸을 올리고 마요네즈를 격자로 뿌립니다.", time: "5분" }
    ]
  },
  {
    id: "recipe_04",
    craftNo: "TEAK CRAFT NO. 04",
    title: "칼칼한 스팸 순두부찌개",
    subTitle: "얼큰 국물 • 스트레스 해소",
    description: "고소한 스팸 기름과 고춧가루를 볶아 얼큰한 고추기름을 내고, 몽글몽글 순두부와 계란을 톡 터뜨린 완벽 식사.",
    theme: "korean_stew",
    rating: 4.7,
    reviewCount: 142,
    timeMinutes: 25,
    difficulty: "난이도 중",
    calorie: 490,
    matchRate: 85,
    youtube: {
      channel: "집밥 백선생 & 백종원",
      subscribers: "568만명",
      views: "215만회",
      title: "고기 없어도 스팸 하나면 충분한 순두부찌개 황금레시피",
      embedId: "2Xy3KzH04a4",
      url: "https://www.youtube.com/watch?v=2Xy3KzH04a4"
    },
    ingredients: [
      { name: "스팸", need: 1, unit: "캔", match: true, shelf: "meat" },
      { name: "계란", need: 1, unit: "알", match: true, shelf: "dairy" },
      { name: "대파", need: 1, unit: "대", match: true, shelf: "vege" },
      { name: "두부", need: 1, unit: "모", match: true, shelf: "dairy" },
      { name: "고춧가루", need: 2, unit: "스푼", match: false, shelf: "sauce" }
    ],
    missingIngredients: ["고춧가루 1스푼(대체요청)"],
    steps: [
      { step: 1, title: "스팸 으깨기", desc: "스팸을 숟가락으로 거칠게 으깨 팬에서 기름이 나올 때까지 볶습니다.", time: "4분" },
      { step: 2, title: "고추기름 내기", desc: "으깬 스팸에 송송 썬 대파와 다진마늘, 고춧가루를 넣어 타지 않게 약불에 볶습니다.", time: "5분" },
      { step: 3, title: "육수와 두부 투하", desc: "물 350ml를 붓고 끓으면 두부를 큼직하게 썰어 넣고 국간장으로 간을 맞춥니다.", time: "10분" },
      { step: 4, title: "계란 톡!", desc: "불을 끄기 1분 전 신선란 1개를 가운데 톡 깨 넣고 후춧가루를 톡톡 뿌려 완성합니다.", time: "6분" }
    ]
  },
  {
    id: "recipe_05",
    craftNo: "BIRCH CRAFT NO. 05",
    title: "치즈 듬뿍 바삭 김치전",
    subTitle: "비 오는 날 간식 • 바삭쫀득",
    description: "가장자리는 튀기듯 바삭하게, 가운데는 쭉 늘어나는 모차렐라/체다 치즈를 듬뿍 넣어 새콤매콤함과 고소함이 공존하는 김치전.",
    theme: "quick_15min",
    rating: 4.9,
    reviewCount: 226,
    timeMinutes: 18,
    difficulty: "난이도 하",
    calorie: 460,
    matchRate: 90,
    youtube: {
      channel: "승우아빠",
      subscribers: "140만명",
      views: "430만회",
      title: "바삭함이 끝까지 유지되는 치즈 김치전의 비밀",
      embedId: "O9-x8T3K314",
      url: "https://www.youtube.com/watch?v=O9-x8T3K314"
    },
    ingredients: [
      { name: "김치", need: 300, unit: "g", match: true, shelf: "sauce" },
      { name: "양파", need: 1, unit: "개", match: true, shelf: "vege" },
      { name: "체다치즈", need: 2, unit: "장", match: true, shelf: "dairy" },
      { name: "부침가루", need: 1, unit: "컵", match: true, shelf: "sauce" }
    ],
    missingIngredients: [],
    steps: [
      { step: 1, title: "김치 반죽 만들기", desc: "잘 익은 김치를 가위로 잘게 썰고, 찬물과 부침가루를 1:1 비율로 가볍게 섞습니다.", time: "5분" },
      { step: 2, title: "팬 달구기 & 튀기듯 부치기", desc: "기름을 넉넉히 두르고 반죽을 얇게 펴서 가장자리가 바삭해지도록 중강불에 부칩니다.", time: "5분" },
      { step: 3, title: "뒤집고 치즈 올리기", desc: "한 번 뒤집은 후 윗면에 체다치즈나 피자치즈를 듬뿍 얹고 뚜껑을 덮어 치즈를 녹입니다.", time: "4분" },
      { step: 4, title: "도마 위에 얹어 완성", desc: "우드 도마 위에 바삭하게 플레이팅하여 가위로 피자처럼 잘라 즐깁니다.", time: "4분" }
    ]
  },
  {
    id: "recipe_06",
    craftNo: "HINOKI CRAFT NO. 06",
    title: "초간단 두부 계란 부침",
    subTitle: "단백 단백질 • 10분 맛있는 반찬",
    description: "물기 뺀 두부에 노릇한 계란물을 입혀 구워내어 대파 양념장에 찍어 먹는 영양만점 고소한 단백 한 끼.",
    theme: "diet_clean",
    rating: 4.9,
    reviewCount: 89,
    timeMinutes: 10,
    difficulty: "난이도 극하",
    calorie: 280,
    matchRate: 100,
    badgeText: "완벽 일치 100%",
    youtube: {
      channel: "요리보고조리보고",
      subscribers: "88만명",
      views: "185만회",
      title: "다이어트할 때 밥 대신 이것만 드세요! 초간단 두부계란부침",
      embedId: "f9D_J3L_x1A",
      url: "https://www.youtube.com/watch?v=f9D_J3L_x1A"
    },
    ingredients: [
      { name: "두부", need: 1, unit: "모", match: true, shelf: "dairy" },
      { name: "계란", need: 2, unit: "알", match: true, shelf: "dairy" },
      { name: "대파", need: 1, unit: "대", match: true, shelf: "vege" },
      { name: "진간장", need: 1, unit: "스푼", match: true, shelf: "sauce" }
    ],
    missingIngredients: [],
    steps: [
      { step: 1, title: "두부 썰고 물기 제거", desc: "두부를 1cm 두께로 도톰하게 썰어 키친타월로 가볍게 눌러 물기를 빼고 소금을 살짝 뿌립니다.", time: "3분" },
      { step: 2, title: "계란물 입히기", desc: "볼에 계란 2개를 풀고 송송 썬 대파를 넣은 뒤 두부에 계란옷을 골고루 입힙니다.", time: "2분" },
      { step: 3, title: "앞뒤로 노릇하게 굽기", desc: "기름 두른 팬에 두부를 올리고 약불에서 앞뒤로 황금빛이 돌 때까지 노릇하게 굽습니다.", time: "4분" },
      { step: 4, title: "양념장과 함께 완성", desc: "간장 1스푼, 고춧가루 약간, 참기름을 섞은 양념장과 함께 도마 위에 정갈히 담아냅니다.", time: "1분" }
    ]
  }
];
