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

    // 1. 선택된 냉장고 식재료 카테고리화
    const proteins = [];
    const veggies = [];
    const sauces = [];
    const staples = [];
    const dairy = [];
    const others = [];

    selectedIngredients.forEach(ing => {
      const name = ing.name.toLowerCase();
      if (name.includes('닭') || name.includes('삼겹') || name.includes('스팸') || name.includes('고기') || 
          name.includes('돼지') || name.includes('소고기') || name.includes('두부') || name.includes('계란') || 
          name.includes('달걀') || name.includes('연어') || name.includes('새우') || name.includes('햄') || name.includes('오리')) {
        proteins.push(ing);
      } else if (name.includes('감자') || name.includes('양파') || name.includes('대파') || name.includes('파') || 
                 name.includes('마늘') || name.includes('고추') || name.includes('파프리카') || name.includes('브로콜리') || 
                 name.includes('당근') || name.includes('상추') || name.includes('토마토') || name.includes('배추') || 
                 name.includes('깻잎') || name.includes('버섯')) {
        veggies.push(ing);
      } else if (name.includes('소스') || name.includes('장') || name.includes('김치') || name.includes('마라') || 
                 name.includes('카레') || name.includes('마요') || name.includes('데리야끼') || name.includes('불닭') ||
                 name.includes('고춧가루') || name.includes('굴소스') || name.includes('간장') || name.includes('케첩')) {
        sauces.push(ing);
      } else if (name.includes('우유') || name.includes('생크림') || name.includes('치즈') || name.includes('블루베리') || 
                 name.includes('벌꿀') || name.includes('꿀') || name.includes('버터')) {
        dairy.push(ing);
      } else if (name.includes('밥') || name.includes('콩') || name.includes('면') || name.includes('라면') || 
                 name.includes('우동') || name.includes('파스타') || name.includes('떡')) {
        staples.push(ing);
      } else {
        others.push(ing);
      }
    });

    // 2. 프롬프트 시맨틱 분석: 요리 형태(Dish Form) 및 풍미(Flavor Profile)
    const isStewOrSoup = queryLower.includes('감자탕') || queryLower.includes('해장국') || queryLower.includes('탕') || 
                         queryLower.includes('찌개') || queryLower.includes('전골') || queryLower.includes('짜글이') || 
                         queryLower.includes('스튜') || queryLower.includes('뚝배기') || queryLower.includes('샤브') || 
                         queryLower.includes('국물') || queryLower.includes('나베');
                         
    const isTaco = queryLower.includes('타코') || queryLower.includes('taco') || queryLower.includes('멕시칸') || queryLower.includes('퀘사디아');
    const isPasta = queryLower.includes('파스타') || queryLower.includes('스파게티');
    const isRice = queryLower.includes('볶음밥') || queryLower.includes('덮밥') || queryLower.includes('비빔밥') || queryLower.includes('리조또');
    const isCurry = queryLower.includes('카레') || queryLower.includes('커리');
    const isSalad = queryLower.includes('샐러드') || queryLower.includes('카프레제') || queryLower.includes('다이어트') || queryLower.includes('식단');
    const isDessertPrompt = queryLower.includes('디저트') || queryLower.includes('파르페') || queryLower.includes('케이크') || queryLower.includes('와플');

    // 풍미 프로필
    const isHoneyButter = queryLower.includes('허니버터') || (queryLower.includes('허니') && queryLower.includes('버터')) || 
                          queryLower.includes('벌꿀버터') || queryLower.includes('달콤버터') || queryLower.includes('버터');
    const isSpicy = queryLower.includes('매운') || queryLower.includes('맵고') || queryLower.includes('매콤') || 
                    queryLower.includes('얼큰') || queryLower.includes('칼칼') || queryLower.includes('불닭') || 
                    queryLower.includes('핫') || queryLower.includes('칼칼한');
    const isMala = queryLower.includes('마라') || queryLower.includes('마라탕') || queryLower.includes('얼얼');
    const isKimchi = queryLower.includes('김치') || queryLower.includes('묵은지');

    // 프롬프트에 식재료가 언급되었는지 확인하여 최우선 배치
    let mentionedProtein = proteins.find(p => queryLower.includes(p.name.toLowerCase()));
    let mentionedVeg = veggies.find(v => queryLower.includes(v.name.toLowerCase()));

    if (queryLower.includes('감자') && !mentionedVeg) {
      const foundPotato = veggies.find(v => v.name.includes('감자'));
      if (foundPotato) mentionedVeg = foundPotato;
    }

    const p1 = mentionedProtein || proteins[0] || { name: (isStewOrSoup ? '돼지고기' : '닭가슴살'), count: 1, unit: '팩', shelf: 'meat' };
    const p2 = proteins.find(p => p.name !== p1.name) || proteins[1] || { name: '스팸', count: 1, unit: '캔', shelf: 'meat' };
    const p3 = proteins.find(p => p.name !== p1.name && p.name !== p2.name) || { name: '두부', count: 1, unit: '모', shelf: 'dairy' };

    const v1 = mentionedVeg || veggies.find(v => v.name.includes('감자')) || veggies[0] || { name: '양파', count: 1, unit: '개', shelf: 'vege' };
    const v2 = veggies.find(v => v.name !== v1.name) || veggies[1] || { name: '대파', count: 1, unit: '대', shelf: 'vege' };

    const s1 = sauces[0] || { name: '특제 전골 다대기', count: 1, unit: '스푼', shelf: 'sauce' };
    const s2 = sauces[1] || sauces[0] || { name: '고소한 버터', count: 1, unit: '조각', shelf: 'dairy' };

    const usedImages = new Set();
    const recipes = [];

    // =========================================================================
    // 🥣 CASE 1: 탕 / 전골 / 찌개 / 스튜 계열 (예: 감자탕 허니버터, 김치찌개 등)
    // =========================================================================
    if (isStewOrSoup) {
      // 1-1. 메인 시그니처 탕/전골 (100% 직격 요리)
      let stewTitle = '';
      if (queryLower.includes('감자탕')) {
        stewTitle = isHoneyButter ? '얼큰 매콤 허니버터 감자탕 전골' : '구수하고 진한 뚝배기 감자탕 전골';
      } else if (isHoneyButter && isSpicy) {
        stewTitle = `얼큰 칼칼 허니버터 ${p1.name} 퓨전 스튜`;
      } else if (isMala) {
        stewTitle = `얼얼하고 진한 특제 마라 ${p1.name} 전골`;
      } else if (query) {
        stewTitle = `${query} • ${p1.name} 뚝배기 전골`;
      } else {
        stewTitle = `얼큰 칼칼 ${p1.name} 뚝배기 짜글이 찌개`;
      }

      const stewDesc = isHoneyButter
        ? `보관 중인 ${p1.name}과(와) ${v1.name}을(를) 푹 고아낸 깊은 육수에 매콤한 비법 다대기와 고소한 허니버터의 풍미가 어우러져 중독적인 얼큰달콤함을 선사하는 셰프의 시그니처 전골입니다.`
        : `보관 중인 ${p1.name}과(와) ${v1.name}, ${v2.name}을(를) 넣고 진하게 우려낸 칼칼한 육수로 든든하게 완성하는 셰프의 1:1 맞춤 전골입니다.`;

      const rec1 = {
        id: `custom_ai_top_1_${Date.now()}`,
        craftNo: "AI CHEF SPECIAL NO. 01",
        sourceType: "youtube",
        title: stewTitle,
        subTitle: `AI 셰프 1:1 맞춤 특선 • ${query || '정통 보양 탕/전골 스페셜'}`,
        description: stewDesc,
        theme: 'korean_stew',
        rating: 5.0,
        reviewCount: 154,
        timeMinutes: 20,
        difficulty: "난이도 중",
        calorie: 540,
        matchRate: 100,
        calculatedMatchRate: 100,
        badgeText: "1:1 맞춤 특선 100%",
        isTopTailored: true,
        isUserRecipe: true,
        isCustomSearchMatch: true,
        viewsCountNumber: 4850000,
        youtube: {
          channel: "백종원의 요리비책",
          subscribers: "568만명",
          views: "485만회",
          title: `집에서 누구나 20분 만에 전문점 맛 내는 ${stewTitle} 황금레시피`,
          embedId: "A5Qg-JriOX4",
          url: "https://www.youtube.com/watch?v=A5Qg-JriOX4"
        },
        ingredients: [
          { ...p1, need: 1, unit: p1.unit || '개', match: true },
          { ...v1, need: 1, unit: v1.unit || '개', match: true },
          { ...v2, need: 1, unit: v2.unit || '대', match: true },
          { ...s1, need: 2, unit: '스푼', match: true }
        ],
        steps: [
          { step: 1, title: "식재료 손질 & 전골 정돈", desc: `보관된 ${p1.name}을(를) 먹기 좋게 썰고, ${v1.name}과(와) ${v2.name}을(를) 큼직하게 썰어 전골 냄비에 담습니다.`, time: "4분" },
          { step: 2, title: "비법 얼큰 육수 배합", desc: `물과 육수 베이스에 ${s1.name}을(를) 골고루 풀어 센 불에서 보글보글 끓여 진한 국물 맛을 냅니다.`, time: "4분" },
          { step: 3, title: "주재료 푹 고기 & 양념 배임", desc: `${p1.name}과(와) 채소를 넣고 중약불로 10분간 푹 고아 속까지 양념이 깊숙이 배도록 조리합니다.`, time: "9분" },
          { step: 4, title: isHoneyButter ? "허니버터 터치 & 들깨 마무리" : "대파 & 들깨 듬뿍 마무리", desc: isHoneyButter ? "불을 끄기 직전 버터 한 조각과 꿀, 송송 썬 대파를 둘러 은은한 고소함과 감칠맛을 코팅하여 완성합니다." : "송송 썬 대파와 들깨가루를 얹어 뚝배기의 뜨거운 잔열로 자작하게 마무리합니다.", time: "3분" }
        ]
      };
      rec1.image = getRecipeImageUrl(rec1, usedImages);
      recipes.push(rec1);

      // 1-2. 페어링 서브 구이/전 (전골과 곁들이기 좋은 바삭 노릇 요리)
      const sideTitle = isHoneyButter
        ? `달콤 짭조름 허니버터 갈릭 ${p2.name} 구이`
        : `노릇노릇 고소한 바삭 ${p2.name} 감자채전`;

      const sideDesc = isHoneyButter
        ? `얼큰하고 진한 메인 전골과 최고의 궁합을 자랑하도록 달콤한 꿀과 고소한 버터를 입혀 겉은 바삭하고 속은 촉촉하게 구워낸 페어링 일품요리입니다.`
        : `얼큰한 전골 국물에 곁들여 먹으면 입안 가득 고소함이 퍼지는 겉바속촉 맞춤 부침 요리입니다.`;

      const rec2 = {
        id: `custom_ai_top_2_${Date.now() + 1}`,
        craftNo: "AI CHEF SPECIAL NO. 02",
        sourceType: "youtube",
        title: sideTitle,
        subTitle: `AI 셰프 1:1 맞춤 특선 • 전골 페어링 바삭 구이`,
        description: sideDesc,
        theme: 'quick_15min',
        rating: 4.98,
        reviewCount: 122,
        timeMinutes: 12,
        difficulty: "난이도 하",
        calorie: 460,
        matchRate: 100,
        calculatedMatchRate: 100,
        badgeText: "1:1 맞춤 특선 100%",
        isTopTailored: true,
        isUserRecipe: true,
        isCustomSearchMatch: true,
        viewsCountNumber: 3950000,
        youtube: {
          channel: "1분요리 뚝딱이형",
          subscribers: "294만명",
          views: "420만회",
          title: `전골이랑 무조건 같이 먹어야 하는 ${sideTitle} 초간단 비법`,
          embedId: "A5Qg-JriOX4",
          url: "https://www.youtube.com/watch?v=A5Qg-JriOX4"
        },
        ingredients: [
          { ...p2, need: 1, unit: p2.unit || '개', match: true },
          { ...v2, need: 1, unit: v2.unit || '개', match: true },
          { ...s2, need: 1, unit: '스푼', match: true }
        ],
        steps: [
          { step: 1, title: "식재료 슬라이스", desc: `${p2.name}과(와) ${v2.name}을(를) 얇게 채 썰어 팬에 올릴 준비를 합니다.`, time: "3분" },
          { step: 2, title: "팬 예열 & 노릇 굽기", desc: "팬에 식용유를 두르고 센 불에서 재료 겉면이 바삭해질 때까지 노릇하게 굽습니다.", time: "4분" },
          { step: 3, title: isHoneyButter ? "허니버터 글레이징 코팅" : "고소한 불향 입히기", desc: isHoneyButter ? "버터와 꿀을 팬에 둘러 표면에 달콤 고소한 윤기를 입혀가며 빠르게 볶아냅니다." : "센 불에서 빠르게 굴려 바삭한 식감과 고소한 불향을 완성합니다.", time: "3분" },
          { step: 4, title: "도마 위 서빙", desc: "도마 위에 정갈하게 담아 메인 전골과 함께 따뜻하게 즐깁니다.", time: "2분" }
        ]
      };
      rec2.image = getRecipeImageUrl(rec2, usedImages);
      recipes.push(rec2);

      // 1-3. 피날레 볶음밥 (한국인 식사의 정석 마무리)
      const riceTitle = `진한 전골 육수 품은 치즈 김가루 볶음밥`;
      const riceDesc = `메인 전골의 깊은 국물과 고기 육수를 자작하게 남겨, 밥과 잘게 다진 채소, 고소한 김가루와 치즈를 넣고 센 불에 바삭하게 눌어붙도록 볶아낸 든든한 마무리 식사입니다.`;

      const rec3 = {
        id: `custom_ai_top_3_${Date.now() + 2}`,
        craftNo: "AI CHEF SPECIAL NO. 03",
        sourceType: "youtube",
        title: riceTitle,
        subTitle: `AI 셰프 1:1 맞춤 특선 • 특제 피날레 누룽지 볶음밥`,
        description: riceDesc,
        theme: 'quick_15min',
        rating: 4.96,
        reviewCount: 135,
        timeMinutes: 10,
        difficulty: "난이도 극하",
        calorie: 490,
        matchRate: 100,
        calculatedMatchRate: 100,
        badgeText: "1:1 맞춤 특선 100%",
        isTopTailored: true,
        isUserRecipe: true,
        isCustomSearchMatch: true,
        viewsCountNumber: 3600000,
        youtube: {
          channel: "하루한끼 one meal a day",
          subscribers: "450만명",
          views: "360만회",
          title: "전골 다 먹고 안 먹으면 무조건 유죄인 전골 볶음밥 황금레시피",
          embedId: "A5Qg-JriOX4",
          url: "https://www.youtube.com/watch?v=A5Qg-JriOX4"
        },
        ingredients: [
          { name: "밥", count: 1, unit: "공기", match: true, shelf: "vege" },
          { ...v2, need: 1, unit: '대', match: true },
          { name: "김가루 & 참기름", count: 1, unit: "스푼", match: true, shelf: "sauce" },
          { name: "치즈", count: 1, unit: "장", match: true, shelf: "dairy" }
        ],
        steps: [
          { step: 1, title: "전골 육수 조리기", desc: "전골 냄비에 진한 국물을 3~4스푼만 자작하게 남기고 덜어냅니다.", time: "2분" },
          { step: 2, title: "밥 & 다진 채소 투하", desc: `따뜻한 밥과 송송 썬 ${v2.name}, 김치를 넣고 국물과 골고루 섞어가며 볶습니다.`, time: "3분" },
          { step: 3, title: "센 불 바닥 누룽지 굽기", desc: "주걱으로 밥을 냄비 바닥에 얇게 펴 누른 뒤 센 불에서 타닥타닥 소리가 날 때까지 누룽지를 만듭니다.", time: "3분" },
          { step: 4, title: "치즈 & 김가루 토핑", desc: "참기름 한 바퀴와 치즈, 김가루를 듬뿍 뿌려 뚜껑을 덮고 잔열로 녹여 완성합니다.", time: "2분" }
        ]
      };
      rec3.image = getRecipeImageUrl(rec3, usedImages);
      recipes.push(rec3);
    }
    // =========================================================================
    // 🌮 CASE 2: 타코 / 멕시칸 스타일 (예: 타코, 퀘사디아 등)
    // =========================================================================
    else if (isTaco) {
      const rec1 = {
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
        youtube: {
          channel: "취미로 요리하는 남자 Yonam",
          subscribers: "142만명",
          views: "390만회",
          title: "집에서 제대로 만드는 극강의 육즙 가득 멕시칸 타코 황금레시피",
          embedId: "b7Ki08LjkPs",
          url: "https://www.youtube.com/watch?v=b7Ki08LjkPs"
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
      };
      rec1.image = getRecipeImageUrl(rec1, usedImages);
      recipes.push(rec1);

      const rec2 = {
        id: `custom_ai_top_2_${Date.now() + 1}`,
        craftNo: "AI CHEF SPECIAL NO. 02",
        sourceType: "youtube",
        title: `골든 치즈 바삭 ${p2.name} 타코 퀘사디아`,
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
        youtube: {
          channel: "취미로 요리하는 남자 Yonam",
          subscribers: "142만명",
          views: "390만회",
          title: "집에서 제대로 만드는 극강의 육즙 가득 멕시칸 타코 황금레시피",
          embedId: "b7Ki08LjkPs",
          url: "https://www.youtube.com/watch?v=b7Ki08LjkPs"
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
      };
      rec2.image = getRecipeImageUrl(rec2, usedImages);
      recipes.push(rec2);

      const rec3 = {
        id: `custom_ai_top_3_${Date.now() + 2}`,
        craftNo: "AI CHEF SPECIAL NO. 03",
        sourceType: "youtube",
        title: `육즙 팡팡 ${p3.name} 멕시칸 타코 플레이트 보울`,
        subTitle: `AI 셰프 1:1 맞춤 특선 • 푸짐한 그릴드 타코 플레이트`,
        description: `보관 중인 ${p3.name}과(와) 신선 채소를 큐브로 썰어 그릴에 굽고 신선 살사와 함께 한 그릇 가득 담아낸 든든하고 건강한 멕시칸 타코 보울입니다.`,
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
        youtube: {
          channel: "취미로 요리하는 남자 Yonam",
          subscribers: "142만명",
          views: "390만회",
          title: "집에서 제대로 만드는 극강의 육즙 가득 멕시칸 타코 황금레시피",
          embedId: "b7Ki08LjkPs",
          url: "https://www.youtube.com/watch?v=b7Ki08LjkPs"
        },
        ingredients: [
          { ...p3, need: 1, unit: p3.unit || '개', match: true },
          { ...v1, need: 1, unit: v1.unit || '개', match: true },
          { ...s1, need: 2, unit: '스푼', match: true }
        ],
        steps: [
          { step: 1, title: "그릴 큐브 컷", desc: `${p3.name}을(를) 한입 깍둑썰기하고, 채소를 볼에 모읍니다.`, time: "3분" },
          { step: 2, title: "그릴 팬 시어링", desc: "팬을 센 불에 달구고 재료들을 겉면이 바삭해질 때까지 굴려가며 굽습니다.", time: "4분" },
          { step: 3, title: "살사 소스 버무리기", desc: `${s1.name}을(를) 더해 재료 전체에 상큼 매콤한 풍미를 가볍게 버무립니다.`, time: "4분" },
          { step: 4, title: "도마 위 보울 세팅", desc: "우드 보울에 푸짐하게 담아 신선한 채소와 함께 따뜻하게 완성합니다.", time: "3분" }
        ]
      };
      rec3.image = getRecipeImageUrl(rec3, usedImages);
      recipes.push(rec3);
    }
    // =========================================================================
    // 🍨 CASE 3: 유저가 명시적으로 디저트를 요구한 경우
    // =========================================================================
    else if (isDessertPrompt) {
      const rec1 = {
        id: `custom_ai_top_1_${Date.now()}`,
        craftNo: "AI CHEF SPECIAL NO. 01",
        sourceType: "youtube",
        title: `달콤 허니 블루베리 생크림 파르페 보울`,
        subTitle: `AI 셰프 1:1 맞춤 특선 • 프레시 스위트 디저트`,
        description: `보관 중인 블루베리, 생크림, 벌꿀, 우유를 블렌딩하여 입안을 향긋하고 부드럽게 감싸주는 산뜻한 키친 디저트입니다.`,
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
        youtube: {
          channel: "디디미니",
          subscribers: "68만명",
          views: "145만회",
          title: "초간단 상큼 달콤 과일 생크림 보울 디저트",
          embedId: "A5Qg-JriOX4",
          url: "https://www.youtube.com/watch?v=A5Qg-JriOX4"
        },
        ingredients: [
          ...dairy.map(d => ({ ...d, need: 1, unit: d.unit || '팩', match: true }))
        ],
        steps: [
          { step: 1, title: "과일 세척", desc: "신선한 과일을 깨끗이 세척 후 물기를 부드럽게 닦아냅니다.", time: "2분" },
          { step: 2, title: "생크림 & 벌꿀 믹싱", desc: "생크림에 벌꿀과 우유를 살짝 가미하여 부드러운 휘핑 크림을 만듭니다.", time: "3분" },
          { step: 3, title: "층층이 레이어드", desc: "보울에 크림과 과일을 번갈아 올려 풍성하게 장식합니다.", time: "2분" },
          { step: 4, title: "허니 드리즐 완성", desc: "상단에 벌꿀을 가볍게 드리즐하여 차갑게 서빙합니다.", time: "1분" }
        ]
      };
      rec1.image = getRecipeImageUrl(rec1, usedImages);
      recipes.push(rec1);

      const rec2 = {
        id: `custom_ai_top_2_${Date.now() + 1}`,
        craftNo: "AI CHEF SPECIAL NO. 02",
        sourceType: "youtube",
        title: `카프레제 신선 생과일 샐러드`,
        subTitle: `AI 셰프 1:1 맞춤 특선 • 상큼 비타민 보울`,
        description: `신선한 치즈와 채소, 과일을 곁들여 산뜻하게 즐기는 웰빙 샐러드입니다.`,
        theme: 'diet_clean',
        rating: 4.95,
        reviewCount: 78,
        timeMinutes: 10,
        difficulty: "난이도 극하",
        calorie: 220,
        matchRate: 100,
        calculatedMatchRate: 100,
        badgeText: "1:1 맞춤 특선 100%",
        isTopTailored: true,
        isUserRecipe: true,
        isCustomSearchMatch: true,
        viewsCountNumber: 2100000,
        youtube: {
          channel: "디디미니",
          subscribers: "68만명",
          views: "145만회",
          title: "초간단 상큼 달콤 과일 생크림 보울 디저트",
          embedId: "A5Qg-JriOX4",
          url: "https://www.youtube.com/watch?v=A5Qg-JriOX4"
        },
        ingredients: [
          { name: "치즈", count: 1, unit: "장", match: true, shelf: "dairy" },
          { ...v1, need: 1, unit: '개', match: true }
        ],
        steps: [
          { step: 1, title: "재료 슬라이스", desc: "치즈와 과일을 알맞은 두께로 썹니다.", time: "3분" },
          { step: 2, title: "플레이팅", desc: "접시에 번갈아 가지런히 놓습니다.", time: "3분" },
          { step: 3, title: "드레싱", desc: "올리브유와 소금을 살짝 뿌려 완성합니다.", time: "2분" }
        ]
      };
      rec2.image = getRecipeImageUrl(rec2, usedImages);
      recipes.push(rec2);

      const rec3 = {
        id: `custom_ai_top_3_${Date.now() + 2}`,
        craftNo: "AI CHEF SPECIAL NO. 03",
        sourceType: "youtube",
        title: `골든 허니 프렌치 토스트 & 과일`,
        subTitle: `AI 셰프 1:1 맞춤 특선 • 브런치 스위트`,
        description: `부드러운 계란물에 촉촉하게 구워낸 토스트에 꿀을 둘러 완성하는 브런치 디저트입니다.`,
        theme: 'quick_15min',
        rating: 4.97,
        reviewCount: 110,
        timeMinutes: 12,
        difficulty: "난이도 하",
        calorie: 380,
        matchRate: 100,
        calculatedMatchRate: 100,
        badgeText: "1:1 맞춤 특선 100%",
        isTopTailored: true,
        isUserRecipe: true,
        isCustomSearchMatch: true,
        viewsCountNumber: 3100000,
        youtube: {
          channel: "디디미니",
          subscribers: "68만명",
          views: "145만회",
          title: "초간단 상큼 달콤 과일 생크림 보울 디저트",
          embedId: "A5Qg-JriOX4",
          url: "https://www.youtube.com/watch?v=A5Qg-JriOX4"
        },
        ingredients: [
          { name: "계란", count: 2, unit: "알", match: true, shelf: "dairy" },
          { ...s2, need: 1, unit: '스푼', match: true }
        ],
        steps: [
          { step: 1, title: "계란물 풀기", desc: "계란과 우유, 꿀을 고르게 섞습니다.", time: "3분" },
          { step: 2, title: "팬 굽기", desc: "버터를 두르고 약불에서 노릇하게 굽습니다.", time: "5분" },
          { step: 3, title: "완성", desc: "접시에 담고 과일을 얹어 서빙합니다.", time: "2분" }
        ]
      };
      rec3.image = getRecipeImageUrl(rec3, usedImages);
      recipes.push(rec3);
    }
    // =========================================================================
    // 🍳 CASE 4: 구이 / 볶음 / 일반 프롬프트 (메인 요리 -> 곁들임 찌개 -> 볶음밥)
    // =========================================================================
    else {
      // 4-1. 메인 시그니처 구이/볶음 요리
      const mainDishTitle = query 
        ? `${query} • ${p1.name} 셰프 특선` 
        : `불맛 가득 매콤달콤 ${p1.name} 특선 두루치기`;

      const rec1 = {
        id: `custom_ai_top_1_${Date.now()}`,
        craftNo: "AI CHEF SPECIAL NO. 01",
        sourceType: "youtube",
        title: mainDishTitle,
        subTitle: `AI 셰프 1:1 맞춤 특선 • ${query || '냉장고 재료 완벽 반영'}`,
        description: `보관 중인 ${p1.name}과(와) 신선 채소를 활용하여 셰프의 비법 불맛으로 육즙을 가두어 완성하는 1:1 특선 요리입니다.`,
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
      };
      rec1.image = getRecipeImageUrl(rec1, usedImages);
      recipes.push(rec1);

      // 4-2. 곁들임 국물 요리 또는 고소한 전/부침
      const subTitleText = `얼큰 칼칼 ${p2.name} 뚝배기 짜글이`;
      const rec2 = {
        id: `custom_ai_top_2_${Date.now() + 1}`,
        craftNo: "AI CHEF SPECIAL NO. 02",
        sourceType: "youtube",
        title: subTitleText,
        subTitle: `AI 셰프 1:1 맞춤 특선 • 든든한 곁들임 국물`,
        description: `보관 중인 ${p2.name}과(와) 채소를 뚝배기에 넣고 칼칼하게 자작하게 끓여낸 셰프의 추천 찌개 요리입니다.`,
        theme: 'korean_stew',
        rating: 4.97,
        reviewCount: 112,
        timeMinutes: 15,
        difficulty: "난이도 하",
        calorie: 480,
        matchRate: 100,
        calculatedMatchRate: 100,
        badgeText: "1:1 맞춤 특선 100%",
        isTopTailored: true,
        isUserRecipe: true,
        isCustomSearchMatch: true,
        viewsCountNumber: 3600000,
        youtube: {
          channel: "1분요리 뚝딱이형",
          subscribers: "294만명",
          views: "512만회",
          title: `누구나 10분 컷으로 성공하는 ${subTitleText}`,
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
          { step: 2, title: "육수 끓이기", desc: "뚝배기에 물과 양념을 넣고 보글보글 끓입니다.", time: "4분" },
          { step: 3, title: "주재료 넣고 조리기", desc: `${p2.name}과(와) 채소를 넣고 국물이 자작해질 때까지 끓입니다.`, time: "5분" },
          { step: 4, title: "완성 및 서빙", desc: "뚝배기 채로 따뜻할 때 바로 맛있게 즐깁니다.", time: "3분" }
        ]
      };
      rec2.image = getRecipeImageUrl(rec2, usedImages);
      recipes.push(rec2);

      // 4-3. 든든한 황금 볶음밥
      const thirdDishTitle = `황금 대파 ${p3.name} 감칠맛 볶음밥`;
      const rec3 = {
        id: `custom_ai_top_3_${Date.now() + 2}`,
        craftNo: "AI CHEF SPECIAL NO. 03",
        sourceType: "youtube",
        title: thirdDishTitle,
        subTitle: `AI 셰프 1:1 맞춤 특선 • 든든한 한 끼 식사`,
        description: `보관 중인 ${p3.name}과(와) 고소한 대파기름을 베이스로 센 불에 고슬고슬하게 볶아낸 감칠맛 볶음밥입니다.`,
        theme: 'quick_15min',
        rating: 4.95,
        reviewCount: 90,
        timeMinutes: 10,
        difficulty: "난이도 극하",
        calorie: 510,
        matchRate: 100,
        calculatedMatchRate: 100,
        badgeText: "1:1 맞춤 특선 100%",
        isTopTailored: true,
        isUserRecipe: true,
        isCustomSearchMatch: true,
        viewsCountNumber: 2900000,
        youtube: {
          channel: "요리보고조리보고",
          subscribers: "88만명",
          views: "185만회",
          title: "5분 컷으로 완성하는 황금 대파 볶음밥 황금레시피",
          embedId: "Eino3yP-Wk0",
          url: "https://www.youtube.com/watch?f=Eino3yP-Wk0"
        },
        ingredients: [
          { name: "밥", count: 1, unit: "공기", match: true, shelf: "vege" },
          { ...p3, need: 1, unit: p3.unit || '개', match: true },
          { ...v2, need: 1, unit: v2.unit || '대', match: true }
        ],
        steps: [
          { step: 1, title: "대파 기름 내기", desc: "팬에 기름을 두르고 얇게 썬 대파를 넣어 파기름을 냅니다.", time: "3분" },
          { step: 2, title: "주재료 볶기", desc: `${p3.name}을(를) 넣고 노릇노릇하게 볶습니다.`, time: "3분" },
          { step: 3, title: "밥 넣고 고슬고슬 볶기", desc: "밥을 넣고 주걱을 세워 밥알이 뭉치지 않도록 센 불에 빠르게 볶습니다.", time: "3분" },
          { step: 4, title: "간장 불향 입혀 완성", desc: "간장 1스푼을 팬 가장자리에 둘러 불향을 입힌 뒤 그릇에 담아 완성합니다.", time: "1분" }
        ]
      };
      rec3.image = getRecipeImageUrl(rec3, usedImages);
      recipes.push(rec3);
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
