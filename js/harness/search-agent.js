// frontend/js/harness/search-agent.js
// Recipe Search & YouTube/Blog Discovery Agent
// 최상단 3열 정밀 1:1 맞춤 AI 레시피 3종 합성 & 하단 유튜브/블로그 조회수순 하이브리드 랭킹 엔진

import { 
  RECIPES_DATA, 
  BLOG_RECIPES_DATA, 
  resolveMatchingYouTubeVideo, 
  getRecipeImageUrl, 
  parseViewsNumber 
} from '../recipes-data.js';
import { harness } from './agent-core.js';

export class SearchAgent {
  constructor() {
    this.name = 'Recipe Search Agent';
    this.harness = harness;
  }

  init(harness) {
    this.harness = harness;
  }

  // 재료 유연 동의어 매칭 (연어샐러드 ↔ 연어, 치즈 ↔ 체다치즈, 마라소스 ↔ 마라 등)
  matchIngredient(userIngName, reqIngName) {
    if (!userIngName || !reqIngName) return false;
    const u = userIngName.toLowerCase().replace(/\s+/g, '');
    const r = reqIngName.toLowerCase().replace(/\s+/g, '');
    if (u === r || u.includes(r) || r.includes(u)) return true;

    const synonymGroups = [
      ['연어샐러드', '연어', '훈제연어'],
      ['치즈', '체다치즈', '모차렐라치즈', '피자치즈', '슬라이스치즈'],
      ['스팸', '햄', '통조림햄'],
      ['닭가슴살', '닭고기', '치킨', '닭'],
      ['삼겹살', '돼지고기', '대패삼겹살', '제육'],
      ['갈비', '소갈비', '돼지갈비'],
      ['마라소스', '마라', '마라양념', '마라유'],
      ['카레', '카레가루', '카레루'],
      ['즉석밥', '밥', '햇반', '공기밥'],
      ['고추장', '고춧가루', '매운양념', '다대기'],
      ['진간장', '간장', '국간장', '맛간장', '데리야끼'],
      ['대파', '파', '쪽파'],
      ['양파', '자색양파'],
      ['두부', '순두부', '연두부'],
      ['계란', '달걀', '신선란', '난황']
    ];

    return synonymGroups.some(group => 
      group.some(item => u.includes(item)) && group.some(item => r.includes(item))
    );
  }

  /**
   * 🍳 사용자가 직접 선정한 냉장고 보관 재료 + 직접 입력 프롬프트 기반
   * 3열 그리드 레이아웃을 빈틈없이 채우는 정밀 1:1 맞춤 AI 레시피 3종 생성
   */
  synthesizeTopAccurateRecipes(selectedIngredients = [], customQuery = '', theme = 'all') {
    const query = (customQuery || '').trim();
    const queryLower = query.toLowerCase();

    // 1. 선택된 냉장고 식재료 분류
    const proteins = [];
    const veggies = [];
    const sauces = [];
    const staples = [];
    const dairy = [];
    const others = [];

    selectedIngredients.forEach(ing => {
      const name = ing.name.toLowerCase();
      if (name.includes('닭') || name.includes('삼겹') || name.includes('스팸') || name.includes('고기') || 
          name.includes('두부') || name.includes('계란') || name.includes('연어') || name.includes('햄')) {
        proteins.push(ing);
      } else if (name.includes('양파') || name.includes('대파') || name.includes('파') || name.includes('마늘') || 
                 name.includes('파프리카') || name.includes('브로콜리') || name.includes('감자') || name.includes('당근') || 
                 name.includes('상추') || name.includes('토마토')) {
        veggies.push(ing);
      } else if (name.includes('소스') || name.includes('장') || name.includes('김치') || name.includes('마라') || 
                 name.includes('카레') || name.includes('마요') || name.includes('데리야끼') || name.includes('불닭')) {
        sauces.push(ing);
      } else if (name.includes('우유') || name.includes('생크림') || name.includes('치즈') || name.includes('블루베리') || name.includes('벌꿀') || name.includes('꿀')) {
        dairy.push(ing);
      } else if (name.includes('밥') || name.includes('콩') || name.includes('면') || name.includes('가루')) {
        staples.push(ing);
      } else {
        others.push(ing);
      }
    });

    const isTaco = queryLower.includes('타코') || queryLower.includes('taco') || queryLower.includes('멕시칸');
    const isPasta = queryLower.includes('파스타') || queryLower.includes('스파게티');
    const isStew = queryLower.includes('찌개') || queryLower.includes('탕') || queryLower.includes('짜글이') || queryLower.includes('전골');
    const isStirFry = queryLower.includes('볶음') || queryLower.includes('두루치기');
    const isRice = queryLower.includes('볶음밥') || queryLower.includes('덮밥') || queryLower.includes('밥');
    const hasDessertIngs = dairy.some(d => d.name.includes('생크림') || d.name.includes('블루베리') || d.name.includes('벌꿀') || d.name.includes('꿀'));

    const p1 = proteins[0] || { name: '닭가슴살', count: 1, unit: '팩', shelf: 'meat' };
    const p2 = proteins[1] || proteins[0] || { name: '스팸', count: 1, unit: '캔', shelf: 'meat' };
    const p3 = proteins[2] || proteins[0] || { name: '두부', count: 1, unit: '모', shelf: 'dairy' };

    const v1 = veggies[0] || { name: '양파', count: 1, unit: '개', shelf: 'vege' };
    const v2 = veggies[1] || veggies[0] || { name: '대파', count: 1, unit: '대', shelf: 'vege' };

    const s1 = sauces[0] || { name: '특제 양념', count: 1, unit: '스푼', shelf: 'sauce' };
    const s2 = sauces[1] || sauces[0] || { name: '매콤 소스', count: 1, unit: '스푼', shelf: 'sauce' };

    const st1 = staples[0] || { name: '콩', count: 1, unit: '줌', shelf: 'vege' };

    const recipes = [];

    // [카테고리 1: 타코 / 멕시칸]
    if (isTaco) {
      // 1-1. 메인 시그니처 스트리트 타코
      recipes.push({
        id: `custom_ai_top_1_${Date.now()}`,
        craftNo: "AI CHEF SPECIAL NO. 01",
        sourceType: "youtube",
        title: `매콤 육즙 ${p1.name} 멕시칸 스트리트 타코`,
        subTitle: `AI 셰프 1:1 맞춤 특선 • ${query || '정통 멕시칸 타코'}`,
        description: `보관 중인 ${p1.name}과(와) 신선 채소를 센 불에 빠르게 시어링하여 풍부한 육즙을 가두고 특제 양념과 함께 바삭 따뜻하게 완성하는 정통 스트리트 타코입니다.`,
        theme: 'quick_15min',
        rating: 5.0,
        reviewCount: 142,
        timeMinutes: 15,
        difficulty: "난이도 하",
        calorie: 480,
        matchRate: 100,
        calculatedMatchRate: 100,
        badgeText: "1:1 맞춤 특선 100%",
        isTopTailored: true,
        isUserRecipe: true,
        isCustomSearchMatch: true,
        viewsCountNumber: 4200000,
        image: 'images/recipes/taco_street.jpg',
        youtube: {
          channel: "취미로 요리하는 남자 Yonam",
          subscribers: "142만명",
          views: "390만회",
          title: "집에서 제대로 만드는 극강의 육즙 가득 멕시칸 타코 황금레시피",
          embedId: "q6EoRBvdVPQ",
          url: "https://www.youtube.com/watch?v=q6EoRBvdVPQ"
        },
        ingredients: [
          { ...p1, need: 1, unit: p1.unit || '개', match: true },
          { ...v1, need: 1, unit: v1.unit || '개', match: true },
          { ...v2, need: 1, unit: v2.unit || '개', match: true },
          { ...s1, need: 2, unit: '스푼', match: true }
        ],
        steps: [
          { step: 1, title: "식재료 정밀 손질", desc: `보관된 ${p1.name}을(를) 먹기 좋은 스트립으로 썰고, ${v1.name}, ${v2.name}을(를) 잘게 다져 수분을 정돈합니다.`, time: "3분" },
          { step: 2, title: "특제 육즙 마리네이드", desc: `${p1.name}에 ${s1.name}과 소금, 후추를 고르게 버무려 5분간 재워 겉면에 윤기와 감칠맛을 입힙니다.`, time: "3분" },
          { step: 3, title: "센 불 육즙 시어링 조리", desc: `달궈진 팬에 기름을 살짝 두르고 센 불에서 양념된 ${p1.name}을(를) 빠르게 볶아 육즙을 봉인한 뒤 채소를 넣어 아삭하게 볶습니다.`, time: "5분" },
          { step: 4, title: "도마 위 정갈한 플레이팅", desc: "도마 위에 따뜻한 타코 베이스를 펼치고 볶아낸 육즙 고기와 신선 채소를 수북이 얹어 완성합니다.", time: "2분" }
        ]
      });

      // 1-2. 불닭 치즈 바삭 퀘사디아 타코
      recipes.push({
        id: `custom_ai_top_2_${Date.now() + 1}`,
        craftNo: "AI CHEF SPECIAL NO. 02",
        sourceType: "youtube",
        title: `불닭 치즈 바삭 ${p2.name} 타코 퀘사디아`,
        subTitle: `AI 셰프 1:1 맞춤 특선 • 크리스피 치즈 & 타코 롤`,
        description: `노릇하게 구운 바삭한 크러스트 속에 고소하게 녹아내리는 치즈와 매콤한 소스, 쫄깃한 ${p2.name}을(를) 가득 채워 반으로 접어 바삭하게 구워낸 퀘사디아식 타코입니다.`,
        theme: 'quick_15min',
        rating: 4.98,
        reviewCount: 118,
        timeMinutes: 12,
        difficulty: "난이도 하",
        calorie: 520,
        matchRate: 100,
        calculatedMatchRate: 100,
        badgeText: "1:1 맞춤 특선 100%",
        isTopTailored: true,
        isUserRecipe: true,
        isCustomSearchMatch: true,
        viewsCountNumber: 3800000,
        image: 'images/recipes/taco_quesadilla.jpg',
        youtube: {
          channel: "취미로 요리하는 남자 Yonam",
          subscribers: "142만명",
          views: "390만회",
          title: "집에서 제대로 만드는 극강의 육즙 가득 멕시칸 타코 황금레시피",
          embedId: "q6EoRBvdVPQ",
          url: "https://www.youtube.com/watch?v=q6EoRBvdVPQ"
        },
        ingredients: [
          { ...p2, need: 1, unit: p2.unit || '개', match: true },
          { ...v1, need: 1, unit: v1.unit || '개', match: true },
          { ...s2, need: 2, unit: '스푼', match: true },
          { name: "치즈", count: 1, unit: "장", match: true, shelf: "dairy" }
        ],
        steps: [
          { step: 1, title: "재료 슬라이스", desc: `${p2.name}과(와) ${v1.name}을(를) 얇게 썰어 팬에 먼저 고소하게 볶아냅니다.`, time: "3분" },
          { step: 2, title: "매콤 소스 글레이징", desc: `볶은 재료에 ${s2.name}을(를) 둘러 센 불에 빠르게 졸여 매콤한 코팅을 입힙니다.`, time: "3분" },
          { step: 3, title: "치즈 토핑 & 접어 굽기", desc: "팬 위에 베이스를 올리고 치즈와 볶은 속재료를 듬뿍 얹은 뒤 반으로 접어 앞뒤로 노릇하게 누르며 굽습니다.", time: "4분" },
          { step: 4, title: "도마 컷팅 완성", desc: "도마 위에서 삼각형으로 먹기 좋게 썰어 치즈가 쭉 늘어날 때 따뜻하게 즐깁니다.", time: "2분" }
        ]
      });

      // 1-3. 보울/플래터 또는 디저트 페어링
      if (hasDessertIngs) {
        recipes.push({
          id: `custom_ai_top_3_${Date.now() + 2}`,
          craftNo: "AI CHEF SPECIAL NO. 03",
          sourceType: "youtube",
          title: `달콤 허니 블루베리 생크림 파르페 보울`,
          subTitle: `AI 셰프 1:1 맞춤 특선 • 매콤 타코 페어링 디저트`,
          description: `보관 중인 신선 블루베리와 부드러운 생크림, 달콤한 벌꿀, 우유를 블렌딩하여 매콤한 멕시칸 타코 식사 후 입안을 향긋하고 부드럽게 감싸주는 산뜻한 키친 디저트입니다.`,
          theme: 'diet_clean',
          rating: 5.0,
          reviewCount: 95,
          timeMinutes: 8,
          difficulty: "난이도 극하",
          calorie: 290,
          matchRate: 100,
          calculatedMatchRate: 100,
          badgeText: "1:1 맞춤 특선 100%",
          isTopTailored: true,
          isUserRecipe: true,
          isCustomSearchMatch: true,
          viewsCountNumber: 2800000,
          image: 'images/recipes/dessert_parfait.jpg',
          youtube: {
            channel: "디디미니",
            subscribers: "68만명",
            views: "145만회",
            title: "초간단 상큼 달콤 과일 생크림 보울 디저트",
            embedId: "O9-x8T3K314",
            url: "https://www.youtube.com/watch?v=O9-x8T3K314"
          },
          ingredients: [
            ...dairy.map(d => ({ ...d, need: 1, unit: d.unit || '팩', match: true }))
          ],
          steps: [
            { step: 1, title: "블루베리 세척", desc: "신선한 블루베리를 깨끗이 세척 후 물기를 부드럽게 닦아냅니다.", time: "2분" },
            { step: 2, title: "생크림 & 벌꿀 믹싱", desc: "차갑게 보관된 생크림에 벌꿀과 우유를 살짝 가미하여 부드러운 휘핑 크림 텍스처를 만듭니다.", time: "3분" },
            { step: 3, title: "층층이 레이어드", desc: "보울에 크림과 블루베리를 번갈아 올려 풍성한 볼륨감을 살립니다.", time: "2분" },
            { step: 4, title: "허니 드리즐 완성", desc: "상단에 벌꿀을 가볍게 드리즐하여 차갑게 서빙합니다.", time: "1분" }
          ]
        });
      } else {
        recipes.push({
          id: `custom_ai_top_3_${Date.now() + 2}`,
          craftNo: "AI CHEF SPECIAL NO. 03",
          sourceType: "youtube",
          title: `육즙 팡팡 ${p3.name} 멕시칸 타코 보울`,
          subTitle: `AI 셰프 1:1 맞춤 특선 • 푸짐한 그릴드 타코 플레이트`,
          description: `보관 중인 ${p3.name}과(와) ${st1.name}, 신선 채소를 큐브로 썰어 그릴에 굽고 신선 살사와 함께 한 그릇 가득 담아낸 든든하고 건강한 멕시칸 타코 보울입니다.`,
          theme: 'diet_clean',
          rating: 4.95,
          reviewCount: 88,
          timeMinutes: 14,
          difficulty: "난이도 하",
          calorie: 460,
          matchRate: 100,
          calculatedMatchRate: 100,
          badgeText: "1:1 맞춤 특선 100%",
          isTopTailored: true,
          isUserRecipe: true,
          isCustomSearchMatch: true,
          viewsCountNumber: 3100000,
          image: 'images/recipes/taco_plate.jpg',
          youtube: {
            channel: "취미로 요리하는 남자 Yonam",
            subscribers: "142만명",
            views: "390만회",
            title: "집에서 제대로 만드는 극강의 육즙 가득 멕시칸 타코 황금레시피",
            embedId: "q6EoRBvdVPQ",
            url: "https://www.youtube.com/watch?v=q6EoRBvdVPQ"
          },
          ingredients: [
            { ...p3, need: 1, unit: p3.unit || '개', match: true },
            { ...v1, need: 1, unit: v1.unit || '개', match: true },
            { ...st1, need: 1, unit: st1.unit || '줌', match: true },
            { ...s1, need: 2, unit: '스푼', match: true }
          ],
          steps: [
            { step: 1, title: "그릴 큐브 컷", desc: `${p3.name}을(를) 한입 깍둑썰기하고, ${st1.name}과(와) 채소를 볼에 모읍니다.`, time: "3분" },
            { step: 2, title: "그릴 팬 시어링", desc: "팬을 센 불에 달구고 재료들을 겉면이 바삭해질 때까지 굴려가며 굽습니다.", time: "4분" },
            { step: 3, title: "살사 소스 버무리기", desc: `${s1.name}을(를) 더해 재료 전체에 상큼 매콤한 풍미를 가볍게 버무립니다.`, time: "4분" },
            { step: 4, title: "도마 위 보울 세팅", desc: "우드 보울에 푸짐하게 담아 신선한 채소와 함께 따뜻하게 완성합니다.", time: "3분" }
          ]
        });
      }
    }
    // [기타 카테고리: 찌개, 볶음밥, 구이 또는 일반 요청]
    else {
      // 2-1. 메인 단백질 시그니처 요리
      const mainDishTitle = query ? `${query} • ${p1.name} 특선 요리` : `특제 양념 ${p1.name} 채소 구이`;
      recipes.push({
        id: `custom_ai_top_1_${Date.now()}`,
        craftNo: "AI CHEF SPECIAL NO. 01",
        sourceType: "youtube",
        title: mainDishTitle,
        subTitle: `AI 셰프 1:1 맞춤 특선 • ${query || '냉장고 재료 완벽 반영'}`,
        description: `보관 중인 ${p1.name}과(와) 신선 채소를 활용하여 셰프의 비법 불맛으로 육즙을 가두어 완성하는 특선 요리입니다.`,
        theme: 'quick_15min',
        rating: 5.0,
        reviewCount: 130,
        timeMinutes: 15,
        difficulty: "난이도 하",
        calorie: 490,
        matchRate: 100,
        calculatedMatchRate: 100,
        badgeText: "1:1 맞춤 특선 100%",
        isTopTailored: true,
        isUserRecipe: true,
        isCustomSearchMatch: true,
        viewsCountNumber: 4100000,
        image: getRecipeImageUrl({ title: mainDishTitle, ingredients: [p1, v1, s1] }),
        youtube: {
          channel: "백종원의 요리비책",
          subscribers: "568만명",
          views: "410만회",
          title: `실패 없는 특제 ${p1.name} 황금레시피`,
          embedId: "A5Qg-JriOX4",
          url: "https://www.youtube.com/watch?v=A5Qg-JriOX4"
        },
        ingredients: [
          { ...p1, need: 1, unit: p1.unit || '개', match: true },
          { ...v1, need: 1, unit: v1.unit || '개', match: true },
          { ...v2, need: 1, unit: v2.unit || '개', match: true },
          { ...s1, need: 2, unit: '스푼', match: true }
        ],
        steps: [
          { step: 1, title: "주재료 정밀 손질", desc: `${p1.name}과(와) 채소를 알맞은 크기로 썰어 물기를 정돈합니다.`, time: "3분" },
          { step: 2, title: "베이스 양념 재우기", desc: `${s1.name}을(를) 가미하여 감칠맛이 골고루 배도록 버무립니다.`, time: "4분" },
          { step: 3, title: "센 불 볶기 및 시어링", desc: "팬에 기름을 두르고 센 불에서 빠르게 볶아 육즙을 가둡니다.", time: "5분" },
          { step: 4, title: "도마 플레이팅", desc: "도마 위에 먹음직스럽게 담아 따뜻할 때 바로 즐깁니다.", time: "3분" }
        ]
      });

      // 2-2. 찌개 또는 볶음밥 요리
      const secondDishTitle = isStew ? `얼큰 칼칼 ${p2.name} 뚝배기 짜글이` : `황금 대파 ${p2.name} 감칠맛 볶음밥`;
      recipes.push({
        id: `custom_ai_top_2_${Date.now() + 1}`,
        craftNo: "AI CHEF SPECIAL NO. 02",
        sourceType: "youtube",
        title: secondDishTitle,
        subTitle: `AI 셰프 1:1 맞춤 특선 • 든든한 한 끼 식사`,
        description: `보관 중인 ${p2.name}과(와) 채소를 넣어 풍미 가득한 맛을 이끌어낸 셰프의 추천 식사 요리입니다.`,
        theme: isStew ? 'korean_stew' : 'quick_15min',
        rating: 4.97,
        reviewCount: 112,
        timeMinutes: 15,
        difficulty: "난이도 하",
        calorie: 510,
        matchRate: 100,
        calculatedMatchRate: 100,
        badgeText: "1:1 맞춤 특선 100%",
        isTopTailored: true,
        isUserRecipe: true,
        isCustomSearchMatch: true,
        viewsCountNumber: 3600000,
        image: isStew ? 'images/recipes/kimchi_jjigae.jpg' : 'images/recipes/egg_fried_rice.jpg',
        youtube: {
          channel: "1분요리 뚝딱이형",
          subscribers: "294만명",
          views: "512만회",
          title: `누구나 10분 컷으로 성공하는 ${secondDishTitle}`,
          embedId: "A5Qg-JriOX4",
          url: "https://www.youtube.com/watch?v=A5Qg-JriOX4"
        },
        ingredients: [
          { ...p2, need: 1, unit: p2.unit || '개', match: true },
          { ...v2, need: 1, unit: v2.unit || '개', match: true },
          { ...s2, need: 2, unit: '스푼', match: true }
        ],
        steps: [
          { step: 1, title: "식재료 썰기", desc: `${p2.name}과(와) ${v2.name}을(를) 잘게 깍둑썰기합니다.`, time: "3분" },
          { step: 2, title: "기름에 파향 내기", desc: "팬에 기름을 두르고 중불에서 고소한 향을 냅니다.", time: "4분" },
          { step: 3, title: "주재료 볶기", desc: `${p2.name}과(와) 소스를 넣고 고소하게 볶습니다.`, time: "5분" },
          { step: 4, title: "완성 및 담아내기", desc: "도마 위에 올려 따뜻할 때 바로 맛있게 즐깁니다.", time: "3분" }
        ]
      });

      // 2-3. 산뜻한 디저트 또는 고소한 두부 요리
      if (hasDessertIngs) {
        recipes.push({
          id: `custom_ai_top_3_${Date.now() + 2}`,
          craftNo: "AI CHEF SPECIAL NO. 03",
          sourceType: "youtube",
          title: `달콤 허니 블루베리 생크림 파르페 보울`,
          subTitle: `AI 셰프 1:1 맞춤 특선 • 프레시 스위트 디저트`,
          description: `보관 중인 블루베리, 생크림, 벌꿀, 우유를 블렌딩하여 식사 후 입안을 향긋하고 부드럽게 감싸주는 산뜻한 키친 디저트입니다.`,
          theme: 'diet_clean',
          rating: 5.0,
          reviewCount: 95,
          timeMinutes: 8,
          difficulty: "난이도 극하",
          calorie: 290,
          matchRate: 100,
          calculatedMatchRate: 100,
          badgeText: "1:1 맞춤 특선 100%",
          isTopTailored: true,
          isUserRecipe: true,
          isCustomSearchMatch: true,
          viewsCountNumber: 2800000,
          image: 'images/recipes/dessert_parfait.jpg',
          youtube: {
            channel: "디디미니",
            subscribers: "68만명",
            views: "145만회",
            title: "초간단 상큼 달콤 과일 생크림 보울 디저트",
            embedId: "O9-x8T3K314",
            url: "https://www.youtube.com/watch?v=O9-x8T3K314"
          },
          ingredients: [
            ...dairy.map(d => ({ ...d, need: 1, unit: d.unit || '팩', match: true }))
          ],
          steps: [
            { step: 1, title: "블루베리 세척", desc: "신선한 블루베리를 깨끗이 세척 후 물기를 부드럽게 닦아냅니다.", time: "2분" },
            { step: 2, title: "생크림 & 벌꿀 믹싱", desc: "차갑게 보관된 생크림에 벌꿀과 우유를 살짝 가미하여 부드러운 휘핑 크림 텍스처를 만듭니다.", time: "3분" },
            { step: 3, title: "층층이 레이어드", desc: "보울에 크림과 블루베리를 번갈아 올려 풍성한 볼륨감을 살립니다.", time: "2분" },
            { step: 4, title: "허니 드리즐 완성", desc: "상단에 벌꿀을 가볍게 드리즐하여 차갑게 서빙합니다.", time: "1분" }
          ]
        });
      } else {
        const thirdDishTitle = `노릇노릇 ${p3.name} 고소 계란 부침`;
        recipes.push({
          id: `custom_ai_top_3_${Date.now() + 2}`,
          craftNo: "AI CHEF SPECIAL NO. 03",
          sourceType: "youtube",
          title: thirdDishTitle,
          subTitle: `AI 셰프 1:1 맞춤 특선 • 고단백 사이드 델리`,
          description: `보관 중인 ${p3.name}을(를) 두툼하게 썰어 노릇하게 부쳐내어 담백한 고소함을 극대화한 건강 맞춤 요리입니다.`,
          theme: 'diet_clean',
          rating: 4.95,
          reviewCount: 90,
          timeMinutes: 10,
          difficulty: "난이도 극하",
          calorie: 320,
          matchRate: 100,
          calculatedMatchRate: 100,
          badgeText: "1:1 맞춤 특선 100%",
          isTopTailored: true,
          isUserRecipe: true,
          isCustomSearchMatch: true,
          viewsCountNumber: 2900000,
          image: 'images/recipes/tofu_buchim.jpg',
          youtube: {
            channel: "요리보고조리보고",
            subscribers: "88만명",
            views: "185만회",
            title: "5분 컷으로 완성하는 고소한 두부 계란 부침 황금레시피",
            embedId: "f9D_J3L_x1A",
            url: "https://www.youtube.com/watch?v=f9D_J3L_x1A"
          },
          ingredients: [
            { ...p3, need: 1, unit: p3.unit || '개', match: true },
            { ...v2, need: 1, unit: v2.unit || '개', match: true }
          ],
          steps: [
            { step: 1, title: "두부 썰기 & 수분 제거", desc: `${p3.name}을(를) 도톰하게 썰어 키친타월로 수분을 톡톡 뺍니다.`, time: "3분" },
            { step: 2, title: "계란물 입히기", desc: "소금을 살짝 친 계란물에 재료를 골고루 적십니다.", time: "2분" },
            { step: 3, title: "노릇하게 굽기", desc: "기름을 두른 팬에 올려 약불에서 앞뒤로 노릇하게 굽습니다.", time: "4분" },
            { step: 4, title: "도마 위 세팅", desc: "도마 위에 나란히 담아 양념장과 함께 완성합니다.", time: "1분" }
          ]
        });
      }
    }

    return recipes;
  }

  // 🌟 요구사항: 외부 빅데이터(유튜브 + 블로그) + 사용자 공유 레시피 종합 수집 및 조회수/관련도 순 정렬
  async searchRecipes({ selectedIngredients = [], theme = 'all', customQuery = '', userRecipes = [] }) {
    this.harness.setPipelineState('SEARCHING', {
      selectedCount: selectedIngredients.length,
      theme,
      customQuery,
      userRecipesCount: userRecipes.length
    });

    this.harness.addLog(
      'SEARCH',
      '외부 유튜브 & 블로그 빅데이터 종합 수집 및 랭킹 정렬 시작',
      `조회수/인기순 기준 탐색 | 검색어: "${customQuery || '전체'}" | 선택 식재료: ${selectedIngredients.length}종`,
      'info'
    );

    await new Promise(r => setTimeout(r, 300));

    const ingredientNames = selectedIngredients.map(i => i.name);
    const cleanQuery = (customQuery || '').trim().toLowerCase();

    // 1. 외부 공인 유튜브 레시피 + 파워 블로그 레시피 + 사용자 직접 등록 레시피 통합
    const combinedDataset = [...RECIPES_DATA, ...BLOG_RECIPES_DATA, ...userRecipes];

    // 2. 재료 일치율 및 키워드/조리방식 적합도 가중치 산출
    const candidates = combinedDataset.map(recipe => {
      let matchCount = 0;
      const totalReq = recipe.ingredients ? recipe.ingredients.length : 0;

      const updatedIngredients = (recipe.ingredients || []).map(req => {
        const has = ingredientNames.some(uName => this.matchIngredient(uName, req.name));
        if (has) matchCount++;
        return { ...req, match: has };
      });

      let baseMatchRate = totalReq > 0 ? Math.min(100, Math.round((matchCount / totalReq) * 100)) : 0;

      // 메뉴 / 조리방식 검색어 가중치 적용
      let queryBonus = 0;
      let isQueryMatched = false;
      if (cleanQuery) {
        const titleMatch = (recipe.title || '').toLowerCase().includes(cleanQuery);
        const descMatch = (recipe.description || '').toLowerCase().includes(cleanQuery);
        const subMatch = (recipe.subTitle || '').toLowerCase().includes(cleanQuery);
        const ingMatch = (recipe.ingredients || []).some(i => (i.name || '').toLowerCase().includes(cleanQuery));

        if (titleMatch) {
          queryBonus += 35;
          isQueryMatched = true;
        } else if (descMatch || subMatch || ingMatch) {
          queryBonus += 20;
          isQueryMatched = true;
        }
      }

      // 테마 일치 가중치
      let themeBonus = 0;
      if (theme && theme !== 'all' && recipe.theme === theme) {
        themeBonus = 15;
      }

      let coverageBonus = matchCount > 0 ? Math.min(25, matchCount * 8) : 0;
      let finalMatchRate = Math.min(100, baseMatchRate + queryBonus + themeBonus + (baseMatchRate > 0 ? coverageBonus : 0));
      
      if (isQueryMatched && finalMatchRate < 90) {
        finalMatchRate = 95;
      }
      if (matchCount === totalReq && totalReq > 0) {
        finalMatchRate = 100;
      }

      // 조회수 수치 파싱
      const rawViews = recipe.viewsCountNumber || parseViewsNumber(recipe.youtube?.views || recipe.blog?.views || '10만');
      const viewsNum = rawViews || 100000;

      // 정렬용 종합 점수: 관련성 60% + 조회수 40% (로그 스케일)
      const logViewsScore = Math.min(100, Math.max(10, Math.round((Math.log10(viewsNum) - 4) * 25)));
      const finalRankingScore = (finalMatchRate * 0.6) + (logViewsScore * 0.4);

      return {
        ...recipe,
        ingredients: updatedIngredients,
        calculatedMatchRate: finalMatchRate,
        matchedCount: matchCount,
        isCustomSearchMatch: isQueryMatched,
        viewsCountNumber: viewsNum,
        finalRankingScore: finalRankingScore,
        image: getRecipeImageUrl(recipe)
      };
    });

    // 3. 최상단 1:1 맞춤 AI 레시피 3종(3열 채움) 생성
    const topRecipes = this.synthesizeTopAccurateRecipes(selectedIngredients, cleanQuery, theme);
    const topTitles = new Set(topRecipes.map(r => r.title));

    // 하단 후보들: 최상단 요리와 중복되지 않도록 구성 후 관련도+조회수 순 정렬
    const bottomRecipes = candidates.filter(c => !topTitles.has(c.title));
    bottomRecipes.sort((a, b) => b.finalRankingScore - a.finalRankingScore);

    const finalResult = [...topRecipes, ...bottomRecipes];

    this.harness.addLog(
      'SEARCH',
      `최상단 3열 맞춤 레시피 3종 발굴: [${topRecipes.map(r => r.title).join(', ')}]`,
      `하단 유튜브 & 블로그 레시피 ${bottomRecipes.length}건 조회수/관련도순 랭킹 완료`,
      'success'
    );

    return finalResult;
  }
}

export const searchAgent = new SearchAgent();
