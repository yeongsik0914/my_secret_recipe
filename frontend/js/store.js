// frontend/js/store.js
// 개인 냉장고 인벤토리 상태 관리, 실시간 재료 차감, 칭호 시스템, 사용자 레시피 및 커뮤니티 저장소

import { firebaseAdapter } from './firebase-config.js';

const STORAGE_KEYS = {
  CURRENT_USER: 'kitchen_chef_current_user',
  AUTH_SESSION: 'kitchen_chef_session',
  USERS_FRIDGE_PREFIX: 'kitchen_chef_fridge_',
  AUTO_DEDUCT: 'kitchen_chef_auto_deduct',
  ACTIVE_THEME: 'kitchen_chef_active_theme',
  CUSTOM_SEARCH_QUERY: 'kitchen_chef_custom_query',
  COMMUNITY_POSTS: 'kitchen_chef_community_posts',
  COOK_COMPLETED_IDS: 'kitchen_chef_completed_recipe_ids',
  COOK_COUNT: 'kitchen_chef_cook_count',
  USER_CUSTOM_RECIPES: 'kitchen_chef_user_recipes',
  USER_TAILORED_RECIPES_PREFIX: 'kitchen_chef_tailored_recipes_'
};

// 1시간 세션 유지 시간 (3,600,000 ms)
export const SESSION_DURATION_MS = 60 * 60 * 1000;

// 기본 샘플 사용자
export const DEFAULT_USER = {
  id: 'admin',
  name: '총괄 관리자 (Chef Admin)',
  email: 'admin@kitchenchef.com',
  avatar: 'frontend/assets/images/icon.png',
  level: '마스터 셰프 Lv.4',
  isLoggedIn: false
};

// 기본 냉장고 식재료 프리셋
const DEFAULT_INGREDIENTS = [
  // 1. 신선 채소 • 과일
  { id: 'ing_1', name: '대파', count: 2, unit: '대', shelf: 'vege', freshness: 'fresh', daysLeft: 6, selected: true },
  { id: 'ing_2', name: '양파', count: 1, unit: '개', shelf: 'vege', freshness: 'fresh', daysLeft: 8, selected: true },
  { id: 'ing_3', name: '애호박', count: 1, unit: '개', shelf: 'vege', freshness: 'expiring', daysLeft: 2, selected: false },
  { id: 'ing_4', name: '당근', count: 1, unit: '개', shelf: 'vege', freshness: 'fresh', daysLeft: 10, selected: false },

  // 2. 육류 • 해산물 • 햄
  { id: 'ing_5', name: '스팸', count: 1, unit: '캔', shelf: 'meat', freshness: 'fresh', daysLeft: 60, selected: true },
  { id: 'ing_6', name: '삼겹살', count: 250, unit: 'g', shelf: 'meat', freshness: 'expiring', daysLeft: 2, selected: false },

  // 3. 유제품 • 달걀 • 두부
  { id: 'ing_7', name: '계란', count: 6, unit: '알', shelf: 'dairy', freshness: 'fresh', daysLeft: 14, selected: true },
  { id: 'ing_8', name: '두부', count: 1, unit: '모', shelf: 'dairy', freshness: 'expiring', daysLeft: 3, selected: true },
  { id: 'ing_9', name: '체다치즈', count: 3, unit: '장', shelf: 'dairy', freshness: 'fresh', daysLeft: 20, selected: false },

  // 4. 양념 • 소스 & 즉석가공
  { id: 'ing_10', name: '김치', count: 500, unit: 'g', shelf: 'sauce', freshness: 'fresh', daysLeft: 30, selected: true },
  { id: 'ing_11', name: '다진마늘', count: 3, unit: '스푼', shelf: 'sauce', freshness: 'fresh', daysLeft: 15, selected: true },
  { id: 'ing_12', name: '즉석밥', count: 1, unit: '공기', shelf: 'sauce', freshness: 'fresh', daysLeft: 90, selected: true }
];

// 비로그인(게스트) 전용 기본 식재료 (로그인 계정과 확실히 차별화되는 스타터 3종)
const GUEST_DEFAULT_INGREDIENTS = [
  { id: 'gst_1', name: '대파', count: 1, unit: '대', shelf: 'vege', freshness: 'fresh', daysLeft: 5, selected: true },
  { id: 'gst_2', name: '계란', count: 2, unit: '알', shelf: 'dairy', freshness: 'fresh', daysLeft: 7, selected: true },
  { id: 'gst_3', name: '즉석밥', count: 1, unit: '공기', shelf: 'sauce', freshness: 'fresh', daysLeft: 30, selected: true }
];

// 초기 커뮤니티 후기 목업 (추천수, 조회수, 노하우 뱃지 포함)
const DEFAULT_POSTS = [
  {
    id: 'post_1',
    author: '자취생민우',
    authorBadge: '완식14회차',
    tag: '파기름 장인',
    timeAgo: '12분 전',
    rating: 5.0,
    content: '대파를 약불에 오래 볶았더니 파기름 향이 진짜 식당 볶음밥 뺨쳐요! 자투리 양파 조금 추가했습니다. 음성 TTS 가이드 덕분에 센 불 전환 타이밍을 놓치지 않아서 밥알이 한 알 한 알 코팅되듯이 살아있네요.',
    recipeName: '황금 대파 계란 볶음밥',
    recipeId: 'recipe_02',
    chefTip: '양파 1/4개 잘게 썰어 추가 • 진간장 눌려 태우기 1스푼',
    likes: 84,
    views: 620,
    isBestKnowhow: true,
    verified: true
  },
  {
    id: 'post_2',
    author: '건강식매니아',
    authorBadge: '클린식단 러버',
    tag: '현미밥 대체',
    timeAgo: '45분 전',
    rating: 5.0,
    content: '즉석밥 현미밥으로 바꿨는데도 고슬고슬 잘 볶아졌어요. 음성 안내 들으면서 요리하니 휴대폰 안 만져도 돼서 너무 편합니다. 다이어트 중인데 완식했습니다.',
    recipeName: '초간단 두부 계란 부침',
    recipeId: 'recipe_06',
    chefTip: '올리브유 대신 아보카도 오일 사용',
    likes: 42,
    views: 380,
    isBestKnowhow: true,
    verified: true
  },
  {
    id: 'post_3',
    author: '초보요리러',
    authorBadge: '첫 완식달성',
    tag: '핵심 팁 성공',
    timeAgo: '2시간 전',
    rating: 5.0,
    content: '계란 스크램블 80%만 익히고 밥 넣는 팁이 신의 한 수였습니다. 전에는 항상 퍽퍽했는데 진짜 부드러워요. 셰프 가이드대로만 따라 하니까 성공했네요!',
    recipeName: '양파 듬뿍 스팸 마요 덮밥',
    recipeId: 'recipe_03',
    likes: 19,
    views: 150,
    isBestKnowhow: false,
    verified: true
  }
];

// 🌟 식재료 및 가공식품 맞춤형 선반 자동 분류기 (정확한 명칭 & 선반 매핑)
export function detectShelf(name) {
  if (!name) return 'vege';
  const n = name.trim().toLowerCase();

  // 1. 양념 • 소스 & 즉석가공 (도어칸 & 상단 선반)
  const sauceKeywords = [
    '불닭', '불닭볶음면', '라면', '신라면', '진라면', '짜파게티', '너구리', '비빔면', '안성탕면',
    '삼양라면', '열라면', '진짬뽕', '스낵면', '면', '국수', '파스타', '스파게티', '우동', '당면',
    '소면', '칼국수', '라면사리', '즉석밥', '햇반', '오뚜기밥', '밥', '김치', '배추김치', '깍두기',
    '간장', '진간장', '국간장', '양조간장', '고추장', '된장', '쌈장', '초고추장',
    '마늘', '다진마늘', '참기름', '들기름', '식용유', '올리브유', '카놀라유',
    '소금', '설탕', '후추', '고춧가루', '굴소스', '케첩', '케찹', '마요네즈', '마요',
    '물엿', '올리고당', '맛술', '미림', '카레', '짜장', '불닭소스', '칠리소스', '머스타드',
    '식초', '미원', '다시다', '액젓', '참치액', '와사비', '고추냉이', '겨자', '핫소스', '시즈닝',
    '양념', '소스', '드레싱', '참깨', '깨', '후리가케', '부침가루', '튀김가루', '밀가루', '전분',
    '빵가루', '통조림', '골뱅이', '옥수수콘', '스위트콘', '만두', '냉동만두', '떡', '떡국떡', '떡볶이떡', '물'
  ];
  if (sauceKeywords.some(k => n.includes(k))) return 'sauce';

  // 2. 육류 • 해산물 • 햄 (신선실/육류칸)
  const meatKeywords = [
    '스팸', '리챔', '런천미트', '삼겹살', '삼겹', '목살', '항정살', '항정', '가브리살', '돼지', '돼지고기',
    '소고기', '쇠고기', '한우', '차돌박이', '차돌', '우삼겹', '양지', '안심', '등심', '채끝', '살치살', '부채살',
    '닭', '닭고기', '닭가슴살', '닭가슴', '닭안심', '닭다리', '닭봉', '닭날개', '오리', '오리고기', '훈제오리',
    '베이컨', '소시지', '소세지', '비엔나', '프랑크', '핫도그', '햄', '어묵', '오뎅', '맛살', '크래미',
    '새우', '오징어', '낙지', '문어', '쭈꾸미', '고등어', '갈치', '연어', '참치', '꽁치', '바지락', '홍합',
    '게', '꽃게', '대게', '조개', '가리비', '전복', '굴', '꼬막', '골뱅이', '해물', '해산물', '생선',
    '동태', '명태', '황태', '북어', '멸치', '진미채', '쥐포', '미트볼', '패티', '순대'
  ];
  if (meatKeywords.some(k => n.includes(k))) return 'meat';

  // 3. 유제품 • 달걀 • 두부 (다목적 선반)
  const dairyKeywords = [
    '계란', '달걀', '신선란', '유정란', '메추리알', '난황', '반숙란', '구운란',
    '두부', '순두부', '연두부', '부침두부', '찌개두부', '콩물',
    '치즈', '체다치즈', '모짜렐라', '피자치즈', '스트링치즈', '슬라이스치즈', '크림치즈', '파마산',
    '우유', '저지방우유', '두유', '버터', '마가린', '요거트', '요플레', '그릭요거트', '생크림', '연유'
  ];
  if (dairyKeywords.some(k => n.includes(k))) return 'dairy';

  // 4. 신선 채소 • 과일 (야채칸 보관)
  return 'vege';
}

// 🌟 식재료별 표준 조리/보관 단위 지능형 자동 추론기
// 숫자만 입력했을 때 삼겹살 -> g, 계란 -> 알, 대파 -> 대, 마라소스 -> 병 등으로 자동 지정
export function detectUnit(name, count = 1) {
  if (!name) return '개';
  const n = name.trim().toLowerCase();
  const num = Number(count) || 1;

  // 1. 계란 / 달걀류 -> '알'
  if (/계란|달걀|신선란|유정란|메추리알|반숙란|구운란/.test(n)) {
    return '알';
  }

  // 2. 파류 -> '대'
  if (/대파|쪽파|실파/.test(n)) {
    return '대';
  }

  // 3. 두부류 -> '모'
  if (/두부|순두부|연두부|부침두부|찌개두부/.test(n)) {
    return '모';
  }

  // 4. 통조림 / 캔류 -> '캔'
  if (/스팸|리챔|런천미트|참치캔|골뱅이|통조림|옥수수콘|스위트콘/.test(n)) {
    return '캔';
  }

  // 5. 봉지면 / 가공 포장류 -> '봉'
  if (/라면|불닭|너구리|짜파게티|비빔면|스낵면|면사리|떡볶이떡|떡국떡|만두|냉동만두|어묵|오뎅/.test(n)) {
    return '봉';
  }

  // 6. 밥류 -> '공기'
  if (/즉석밥|햇반|오뚜기밥|^밥$/.test(n)) {
    return '공기';
  }

  // 7. 치즈 / 판형 / 김류 -> '장'
  if (/치즈|체다치즈|슬라이스치즈|조미김|^김$|라이스페이퍼|쌈무/.test(n)) {
    return '장';
  }

  // 8. 잎채소류 -> '포기' 또는 '장'
  if (/배추|양배추/.test(n)) {
    return '포기';
  }
  if (/상추|깻잎/.test(n)) {
    return num > 5 ? '장' : '포기';
  }
  if (/시금치|미나리|부추/.test(n)) {
    return '단';
  }

  // 9. 육류 / 정육 / 해산물 / 김치 / 분말류 -> 'g' (10g 단위)
  const gramKeywords = [
    '삼겹살', '삼겹', '목살', '항정살', '항정', '가브리살', '돼지고기', '돼지', '제육',
    '소고기', '쇠고기', '한우', '차돌박이', '차돌', '우삼겹', '양지', '안심', '등심', '채끝', '살치살', '부채살',
    '닭가슴살', '닭가슴', '닭안심', '닭다리살', '닭고기', '오리고기', '훈제오리', '베이컨', '다진고기', '다진육',
    '새우', '오징어', '낙지', '문어', '연어', '고등어', '갈치', '바지락', '조개살', '해물', '해산물',
    '김치', '배추김치', '깍두기', '겉절이', '열무김치',
    '고춧가루', '부침가루', '튀김가루', '밀가루', '전분', '빵가루', '카레가루',
    '다진마늘', '다진생강', '버터'
  ];
  if (gramKeywords.some(k => n.includes(k))) {
    return 'g';
  }

  // 10. 소스 / 장류 / 오일 / 액체 조미료 -> '병' (만약 10 이상 수량 입력 시 'g')
  const sauceBottleKeywords = [
    '간장', '진간장', '국간장', '양조간장', '참기름', '들기름', '식용유', '올리브유', '카놀라유',
    '식초', '맛술', '미림', '마라소스', '불닭소스', '굴소스', '케첩', '케찹', '마요네즈', '마요',
    '칠리소스', '머스타드', '핫소스', '드레싱', '초고추장', '고추장', '된장', '쌈장', '소스'
  ];
  if (sauceBottleKeywords.some(k => n.includes(k))) {
    return num >= 10 ? 'g' : '병';
  }

  // 숫자가 50 이상이고 단위 미지정 시 중량(g)으로 스마트 판정
  if (num >= 50) {
    return 'g';
  }

  // 11. 기본 일반 채소/과일 (양파, 감자, 당근, 사과, 오이, 가지, 파프리카 등) -> '개'
  return '개';
}

class FridgeStore {
  constructor() {
    this.currentUser = this.loadCurrentUser();
    this.ingredients = this.loadIngredients();
    this.autoDeductEnabled = this.loadAutoDeductSetting();
    this.activeTheme = localStorage.getItem(STORAGE_KEYS.ACTIVE_THEME) || 'all';
    this.customQuery = localStorage.getItem(STORAGE_KEYS.CUSTOM_SEARCH_QUERY) || '';
    this.completedRecipeIds = this.loadCompletedRecipeIds();
    this.cookCount = parseInt(localStorage.getItem(STORAGE_KEYS.COOK_COUNT) || '2', 10);
    this.userRecipes = this.loadUserRecipes();
    this.posts = this.loadCommunityPosts();
    this.subscribers = [];
  }

  detectShelf(name) {
    return detectShelf(name);
  }

  detectUnit(name, count = 1) {
    return detectUnit(name, count);
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  notify(event, payload) {
    this.subscribers.forEach(cb => cb(event, payload));
  }

  getCurrentUser() {
    return this.currentUser;
  }

  getCurrentUserId() {
    if (!this.currentUser || !this.currentUser.isLoggedIn || this.currentUser.id === 'guest') {
      return 'guest';
    }
    return this.currentUser.id || this.currentUser.uid || 'guest';
  }

  // 1. 사용자 세션 관리 및 1시간 자동 로그인
  loadCurrentUser() {
    const sessionRaw = localStorage.getItem(STORAGE_KEYS.AUTH_SESSION);
    if (sessionRaw) {
      try {
        const session = JSON.parse(sessionRaw);
        if (session.expiresAt && Date.now() < session.expiresAt) {
          return { ...session.user, isLoggedIn: true };
        } else {
          // 1시간 세션 만료
          this.clearSession();
        }
      } catch (e) {
        this.clearSession();
      }
    }
    // 유효한 세션이 없을 경우: 비로그인(게스트) 상태로 초기화하여 첫 방문 로그인 모달 트리거
    return {
      id: 'guest',
      name: '게스트 셰프',
      email: '',
      avatar: 'frontend/assets/images/icon.png',
      level: '초보 셰프 Lv.1',
      isLoggedIn: false
    };
  }

  // 1시간 세션 정보 저장
  saveSession(user, keepLoggedIn = true) {
    const expiresAt = Date.now() + SESSION_DURATION_MS;
    const sessionData = {
      user: { ...user, isLoggedIn: true },
      loginTime: Date.now(),
      expiresAt,
      keepLoggedIn
    };
    localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(sessionData));
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    return sessionData;
  }

  // 세션 정보 조회
  getSessionInfo() {
    const sessionRaw = localStorage.getItem(STORAGE_KEYS.AUTH_SESSION);
    if (!sessionRaw) return { valid: false, expired: false, remainingMs: 0 };
    try {
      const session = JSON.parse(sessionRaw);
      const now = Date.now();
      if (now < session.expiresAt) {
        const remainingMs = session.expiresAt - now;
        const remainingMinutes = Math.floor(remainingMs / 60000);
        const remainingSeconds = Math.floor((remainingMs % 60000) / 1000);
        return {
          valid: true,
          expired: false,
          session,
          remainingMs,
          remainingText: `${remainingMinutes}분 ${remainingSeconds}초`
        };
      } else {
        this.clearSession();
        return { valid: false, expired: true, remainingMs: 0 };
      }
    } catch {
      return { valid: false, expired: false, remainingMs: 0 };
    }
  }

  // 세션 삭제
  clearSession() {
    localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
  }

  // 🌟 요구사항 9: 조리 완료 횟수에 따른 칭호 및 등급 시스템 (undefined 버그 완벽 수정)
  getUserTitleInfo() {
    const count = this.cookCount;
    if (count >= 6) {
      return {
        level: '마스터 셰프 Lv.4',
        tier: '미슐랭 홈파티 장인',
        title: '미슐랭 홈파티 장인',
        desc: '냉장고를 예술로 바꾸는 최고의 손맛',
        icon: '👑',
        remaining: 0,
        nextRemaining: 0,
        progress: 100,
        completedCount: count
      };
    } else if (count >= 3) {
      return {
        level: '시니어 셰프 Lv.3',
        tier: '냉파 마스터',
        title: '냉파 마스터',
        desc: '식재료 낭비 없이 뚝딱 만드는 실력자',
        icon: '🎖️',
        remaining: 6 - count,
        nextRemaining: 6 - count,
        progress: Math.round((count / 6) * 100),
        completedCount: count
      };
    } else if (count >= 1) {
      return {
        level: '주니어 셰프 Lv.2',
        tier: '신선 재고 구출자',
        title: '신선 재고 구출자',
        desc: '남은 재료에 새 생명을 불어넣는 셰프',
        icon: '🌱',
        remaining: 3 - count,
        nextRemaining: 3 - count,
        progress: Math.round((count / 3) * 100),
        completedCount: count
      };
    } else {
      return {
        level: '초보 셰프 Lv.1',
        tier: '주방의 호기심쟁이',
        title: '주방의 호기심쟁이',
        desc: '요리의 즐거움을 막 알아가는 새내기',
        icon: '🍳',
        remaining: 1,
        nextRemaining: 1,
        progress: 0,
        completedCount: count
      };
    }
  }

  async login(email, password = 'password123', keepLoggedIn = true) {
    // 1. FirebaseAdapter / 백엔드 / 로컬 DB 검증
    const res = await firebaseAdapter.signIn(email, password);
    if (!res || !res.email) {
      throw new Error("등록되지 않은 회원입니다. 회원가입을 먼저 진행해주세요.");
    }
    const role = res.role || ((res.email === 'admin@kitchenchef.com' || res.role === 'admin') ? 'admin' : 'user');
    const providers = res.providers || (res.provider === 'google' ? ['google.com'] : ['password']);
    const isActive = res.is_active !== undefined ? res.is_active : (res.status !== 'suspended');

    this.currentUser = {
      id: res.uid || res.id,
      name: res.name || '요리하는 소라',
      email: res.email || email,
      avatar: res.avatar || 'frontend/assets/images/icon.png',
      level: res.level || (role === 'admin' ? '마스터 셰프 Lv.4' : (role === 'manager' ? '시니어 셰프 Lv.3' : '조리 마스터 Lv.2')),
      tier: res.tier || (role === 'admin' ? '미슐랭 홈파티 장인' : '신선 재고 구출자'),
      role,
      status: isActive ? 'active' : 'suspended',
      is_active: isActive,
      providers,
      cookCount: res.cookCount !== undefined ? res.cookCount : (role === 'admin' ? 12 : 2),
      isLoggedIn: true
    };
    this.saveSession(this.currentUser, keepLoggedIn);

    // 🌟 계정별 DB 냉장고 재고 즉시 바인딩
    if (res.inventory && Array.isArray(res.inventory)) {
      this.ingredients = this.normalizeIngredients(res.inventory);
      localStorage.setItem(this.getStorageKey(), JSON.stringify(this.ingredients));
    } else {
      const dbItems = await this.fetchUserFridgeFromDB(this.currentUser.id);
      if (dbItems) {
        this.ingredients = dbItems;
      } else {
        this.ingredients = this.loadIngredients();
      }
    }

    this.upsertAdminUser(this.currentUser);
    this.notify('USER_LOGIN', this.currentUser);
    this.notify('INGREDIENTS_UPDATED', this.ingredients);
    return this.currentUser;
  }

  // 이메일 실존 인증 메일 발송 요청 (6자리 코드 발급)
  async sendEmailVerification(email) {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) {
      throw new Error('이메일 주소를 입력해 주세요.');
    }
    const emailRegex = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
    if (!emailRegex.test(cleanEmail)) {
      throw new Error('올바른 이메일 형식이 아닙니다.');
    }

    const resp = await fetch('/api/auth/send-verification-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail })
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok || data.status === 'error') {
      throw new Error(data.message || '인증 메일 발송에 실패했습니다.');
    }
    return data;
  }

  // 이메일 6자리 인증번호 검증
  async verifyEmailCode(email, code) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanCode = (code || '').trim();
    if (!cleanEmail || !cleanCode) {
      throw new Error('이메일과 인증번호를 모두 입력해 주세요.');
    }

    const resp = await fetch('/api/auth/verify-email-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, code: cleanCode })
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok || data.status === 'error') {
      throw new Error(data.message || '인증번호가 일치하지 않거나 만료되었습니다.');
    }
    return data;
  }

  async register(email, password, name = '열정 셰프', keepLoggedIn = true) {
    const res = await firebaseAdapter.signUp(email, password, name);
    const role = (email === 'admin@kitchenchef.com') ? 'admin' : 'user';
    this.currentUser = {
      id: res.uid || res.id,
      name: res.name || name,
      email: res.email || email,
      password,
      avatar: 'frontend/assets/images/icon.png',
      level: '초보 셰프 Lv.1',
      tier: '주방의 호기심쟁이',
      role,
      status: 'active',
      is_active: true,
      providers: ['password'],
      cookCount: 0,
      isLoggedIn: true
    };
    this.saveSession(this.currentUser, keepLoggedIn);

    // 🌟 신규 유저 계정별 냉장고 재고 바인딩 및 DB 동기화
    if (res.inventory && Array.isArray(res.inventory)) {
      this.ingredients = this.normalizeIngredients(res.inventory);
      localStorage.setItem(this.getStorageKey(), JSON.stringify(this.ingredients));
    } else {
      const dbItems = await this.fetchUserFridgeFromDB(this.currentUser.id);
      if (dbItems) {
        this.ingredients = dbItems;
      } else {
        this.ingredients = this.loadIngredients();
      }
    }
    this.saveIngredients(this.ingredients);

    this.upsertAdminUser(this.currentUser);
    this.notify('USER_REGISTERED', this.currentUser);
    this.notify('INGREDIENTS_UPDATED', this.ingredients);
    return this.currentUser;
  }

  async registerUser(email, name, password = 'password123', keepLoggedIn = true) {
    return this.register(email, password, name, keepLoggedIn);
  }

  // 구글 SNS 간편 로그인 및 간편 회원가입 (Google API + Firebase 사용자 자동 등록)
  async loginWithGoogle(selectedAccount = null, keepLoggedIn = true, isSignup = false) {
    if (!isSignup) {
      // 1. 로그인 모드: 기등록 계정인지 사전 검증!
      const targetEmail = (selectedAccount?.email || '').trim().toLowerCase();
      const adminUsers = this.loadAdminUsers();
      let regList = [];
      try {
        regList = JSON.parse(localStorage.getItem('firebase_registered_users_registry') || '[]');
      } catch {}
      const allKnown = [...adminUsers, ...regList];
      
      const found = allKnown.find(u => 
        (u.email && u.email.trim().toLowerCase() === targetEmail) ||
        (selectedAccount?.uid && (u.uid === selectedAccount.uid || u.id === selectedAccount.uid))
      );
      if (!found) {
        throw new Error("등록되지 않은 구글 계정입니다. 간편 회원가입 탭에서 먼저 가입을 진행해주세요.");
      }
    }

    const res = await firebaseAdapter.signInWithGoogle(selectedAccount, isSignup);
    const userFridgeKey = `${STORAGE_KEYS.USERS_FRIDGE_PREFIX}${res.uid}`;
    const userHasFridge = localStorage.getItem(userFridgeKey) !== null;
    const isNewUser = isSignup || !userHasFridge;
    const role = res.role || ((res.email === 'admin@kitchenchef.com' || res.role === 'admin') ? 'admin' : 'user');
    const providers = res.providers || ['google.com'];
    const isActive = res.is_active !== undefined ? res.is_active : (res.status !== 'suspended');

    this.currentUser = {
      id: res.uid || res.id,
      name: res.name,
      email: res.email,
      avatar: res.avatar || 'frontend/assets/images/icon.png',
      level: isNewUser ? '초보 셰프 Lv.1' : (res.level || (role === 'admin' ? '마스터 셰프 Lv.4' : (role === 'manager' ? '시니어 셰프 Lv.3' : '조리 마스터 Lv.2'))),
      tier: role === 'admin' ? '미슐랭 홈파티 장인' : (isNewUser ? '주방의 호기심쟁이' : '신선 재고 구출자'),
      role,
      status: isActive ? 'active' : 'suspended',
      is_active: isActive,
      providers,
      cookCount: res.cookCount !== undefined ? res.cookCount : (role === 'admin' ? 12 : 2),
      provider: 'google',
      authSource: res.authSource || 'google_identity_api',
      firebaseRegistered: true,
      firebaseUid: res.uid,
      idToken: res.idToken || null,
      isLoggedIn: true,
      isNewUser
    };
    this.saveSession(this.currentUser, keepLoggedIn);

    // 🌟 구글 계정별 DB 냉장고 재고 즉시 바인딩 및 영속화
    if (res.inventory && Array.isArray(res.inventory)) {
      this.ingredients = this.normalizeIngredients(res.inventory);
      localStorage.setItem(this.getStorageKey(), JSON.stringify(this.ingredients));
    } else {
      const dbItems = await this.fetchUserFridgeFromDB(this.currentUser.id);
      if (dbItems) {
        this.ingredients = dbItems;
      } else {
        this.ingredients = this.loadIngredients();
      }
    }
    this.saveIngredients(this.ingredients);

    this.upsertAdminUser(this.currentUser);
    if (isNewUser) {
      this.notify('USER_REGISTERED', this.currentUser);
    } else {
      this.notify('USER_LOGIN', this.currentUser);
    }
    this.notify('INGREDIENTS_UPDATED', this.ingredients);
    return { ...this.currentUser, isNewUser };
  }

  // 🌟 Firebase에 등록된 구글 계정 이력 목록 조회 ("없으면 띄우지마" 요구사항 충족)
  getFirebaseGoogleUsers() {
    if (firebaseAdapter && firebaseAdapter.getGoogleLoginHistory) {
      return firebaseAdapter.getGoogleLoginHistory();
    }
    return [];
  }

  // 🌟 Google 계정 재인증을 통한 안전 로그인 ("이전에 구글 로그인 했었던 계정이더라도 구글 로그인 재인증을 통해서 로그인 하도록 만들어")
  async reauthenticateWithGoogle(email, password = '', keepLoggedIn = true) {
    const res = await firebaseAdapter.reauthenticateGoogleUser(email, password);
    const role = res.role || ((res.email === 'admin@kitchenchef.com' || res.role === 'admin') ? 'admin' : 'user');
    const providers = res.providers || ['google.com'];
    const isActive = res.is_active !== undefined ? res.is_active : (res.status !== 'suspended');

    this.currentUser = {
      id: res.uid || res.id,
      name: res.name || res.displayName,
      email: res.email,
      avatar: res.avatar || 'frontend/assets/images/icon.png',
      level: res.level || (role === 'admin' ? '마스터 셰프 Lv.4' : (role === 'manager' ? '시니어 셰프 Lv.3' : '조리 마스터 Lv.2')),
      tier: res.tier || (role === 'admin' ? '미슐랭 홈파티 장인' : '신선 재고 구출자'),
      role,
      status: isActive ? 'active' : 'suspended',
      is_active: isActive,
      providers,
      cookCount: res.cookCount !== undefined ? res.cookCount : (role === 'admin' ? 12 : 2),
      provider: 'google',
      authSource: 'google_reauth_verified',
      firebaseRegistered: true,
      firebaseUid: res.uid,
      idToken: `reauth_${Date.now()}`,
      isLoggedIn: true,
      isNewUser: false
    };

    this.saveSession(this.currentUser, keepLoggedIn);

    // 🌟 구글 재인증 계정별 DB 냉장고 재고 즉시 바인딩
    if (res.inventory && Array.isArray(res.inventory)) {
      this.ingredients = this.normalizeIngredients(res.inventory);
      localStorage.setItem(this.getStorageKey(), JSON.stringify(this.ingredients));
    } else {
      const dbItems = await this.fetchUserFridgeFromDB(this.currentUser.id);
      if (dbItems) {
        this.ingredients = dbItems;
      } else {
        this.ingredients = this.loadIngredients();
      }
    }
    this.saveIngredients(this.ingredients);

    this.upsertAdminUser(this.currentUser);
    this.notify('USER_LOGIN', this.currentUser);
    this.notify('INGREDIENTS_UPDATED', this.ingredients);
    return this.currentUser;
  }

  // 🌟 새 Google 계정 추가 및 Firebase 등록
  async addGoogleAccount(email, name = '', password = 'password123', avatar = '') {
    const res = await firebaseAdapter.addGoogleAccount(email, name, password, avatar);
    return res;
  }

  // 🌟 Google 계정 연동 해제 (계정 고립 방지 가드 탑재)
  async unlinkGoogle(userId = null) {
    const uid = userId || this.currentUser?.id || this.currentUser?.uid;
    if (!uid) throw new Error("로그인 상태가 아닙니다.");
    const res = await firebaseAdapter.unlinkGoogleAccount(uid);
    if (!res || !res.success) {
      throw new Error(res?.error || "구글 연동 해제에 실패했습니다.");
    }
    if (this.currentUser && (this.currentUser.id === uid || this.currentUser.uid === uid)) {
      this.currentUser.providers = (this.currentUser.providers || []).filter(p => p !== 'google.com');
      this.saveSession(this.currentUser);
    }
    const adminUsers = this.loadAdminUsers();
    const target = adminUsers.find(u => u.id === uid || u.uid === uid);
    if (target) {
      target.providers = (target.providers || []).filter(p => p !== 'google.com');
      this.saveAdminUsers(adminUsers);
    }
    this.notify('USER_UPDATED', this.currentUser);
    this.notify('ADMIN_USERS_UPDATED', adminUsers);
    return res;
  }

  // 🌟 Google 계정 연동 추가
  async linkGoogle(userId = null, googleAccount = null) {
    const uid = userId || this.currentUser?.id || this.currentUser?.uid;
    if (!uid) throw new Error("로그인 상태가 아닙니다.");
    const res = await firebaseAdapter.linkGoogleAccount(uid, googleAccount);
    if (!res || !res.success) {
      throw new Error(res?.error || "구글 연동에 실패했습니다.");
    }
    if (this.currentUser && (this.currentUser.id === uid || this.currentUser.uid === uid)) {
      const pSet = new Set(this.currentUser.providers || ['password']);
      pSet.add('google.com');
      this.currentUser.providers = Array.from(pSet);
      this.saveSession(this.currentUser);
    }
    const adminUsers = this.loadAdminUsers();
    const target = adminUsers.find(u => u.id === uid || u.uid === uid);
    if (target) {
      const pSet = new Set(target.providers || ['password']);
      pSet.add('google.com');
      target.providers = Array.from(pSet);
      this.saveAdminUsers(adminUsers);
    }
    this.notify('USER_UPDATED', this.currentUser);
    this.notify('ADMIN_USERS_UPDATED', adminUsers);
    return res;
  }

  upsertAdminUser(user) {
    if (!user || (!user.id && !user.uid)) return;
    const uid = user.id || user.uid;
    const email = user.email || '';
    let adminUsers = this.loadAdminUsers();
    const idx = adminUsers.findIndex(u => (u.id === uid || (u.email && email && u.email.toLowerCase() === email.toLowerCase())));
    const existingUser = idx >= 0 ? adminUsers[idx] : null;
    const isActive = user.is_active !== undefined ? user.is_active : (existingUser?.is_active !== undefined ? existingUser.is_active : (user.status !== 'suspended'));
    const fullUser = {
      id: uid,
      uid,
      name: user.name || '신규 셰프',
      email: email,
      password: user.password || existingUser?.password || 'kitchen1234',
      role: user.role || existingUser?.role || (email === 'admin@kitchenchef.com' ? 'admin' : 'user'),
      status: user.status || (isActive ? 'active' : 'suspended'),
      is_active: isActive,
      providers: user.providers || existingUser?.providers || (user.provider === 'google' ? ['google.com'] : ['password']),
      level: user.level || '초보 셰프 Lv.1',
      tier: user.tier || (user.level === '마스터 셰프 Lv.4' ? '미슐랭 홈파티 장인' : '주방의 호기심쟁이'),
      avatar: user.avatar || 'frontend/assets/images/icon.png',
      cookCount: user.cookCount !== undefined ? user.cookCount : 0,
      createdAt: user.createdAt || new Date().toISOString().replace('T', ' ').substring(0, 16),
      lastLogin: new Date().toISOString().replace('T', ' ').substring(0, 16),
      sessionValid: user.sessionValid !== undefined ? user.sessionValid : true
    };

    if (idx >= 0) {
      adminUsers[idx] = { ...adminUsers[idx], ...fullUser };
    } else {
      adminUsers.push(fullUser);
    }
    this.saveAdminUsers(adminUsers);

    // 1. Firebase Firestore 도큐먼트 생성/동기화
    firebaseAdapter.createUserDocument(fullUser).catch(() => {});

    // 2. 백엔드 REST API 영속화 (POST /api/users)
    fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fullUser)
    }).catch(err => console.warn('⚠️ [Store] User sync to backend failed:', err));
  }

  async logout() {
    await firebaseAdapter.signOut();
    this.clearSession();
    this.currentUser = {
      id: 'guest',
      name: '게스트 셰프',
      email: '',
      avatar: 'frontend/assets/images/icon.png',
      level: '초보 셰프 Lv.1',
      isLoggedIn: false
    };
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(this.currentUser));
    this.ingredients = this.loadIngredients();
    this.notify('USER_LOGOUT', this.currentUser);
    this.notify('INGREDIENTS_UPDATED', this.ingredients);
    return this.currentUser;
  }

  // 2. 냉장고 식재료 관리 (DB 연동, Firebase Cloud & LocalStorage)
  getStorageKey() {
    const isGuest = !this.currentUser || !this.currentUser.isLoggedIn || this.currentUser.id === 'guest';
    if (isGuest) {
      return `${STORAGE_KEYS.USERS_FRIDGE_PREFIX}guest`;
    }
    const uid = this.currentUser.id || this.currentUser.uid || 'default';
    return `${STORAGE_KEYS.USERS_FRIDGE_PREFIX}${uid}`;
  }

  // 🌟 DB에서 유저 개인 냉장고 데이터 실시간 조회 및 동기화
  async fetchUserFridgeFromDB(userId) {
    if (!userId || userId === 'guest') return null;

    try {
      // 1. 백엔드 REST API 우선 조회 (GET /api/fridge/<userId>)
      const resp = await fetch(`/api/fridge/${encodeURIComponent(userId)}`);
      if (resp.ok) {
        const data = await resp.json();
        if (data.status === 'success' && Array.isArray(data.inventory)) {
          this.ingredients = this.normalizeIngredients(data.inventory);
          localStorage.setItem(this.getStorageKey(), JSON.stringify(this.ingredients));
          this.notify('INGREDIENTS_UPDATED', this.ingredients);
          return this.ingredients;
        }
      }
    } catch (e) {
      console.warn('⚠️ [Store] Failed to fetch fridge from backend API:', e);
    }

    // 2. Firebase Firestore Fallback
    try {
      if (firebaseAdapter && firebaseAdapter.fetchFridgeFromCloud) {
        const cloudItems = await firebaseAdapter.fetchFridgeFromCloud(userId);
        if (Array.isArray(cloudItems) && cloudItems.length > 0) {
          this.ingredients = this.normalizeIngredients(cloudItems);
          localStorage.setItem(this.getStorageKey(), JSON.stringify(this.ingredients));
          this.notify('INGREDIENTS_UPDATED', this.ingredients);
          return this.ingredients;
        }
      }
    } catch (e) {
      console.warn('⚠️ [Store] Failed to fetch fridge from cloud:', e);
    }

    return null;
  }

  // 🌟 계정별 맞춤 레시피 & 매칭 식재료 DB 영구 저장
  async saveUserRecipesToDB(recipes, customQuery = '', selectedIngredients = []) {
    const isGuest = !this.currentUser || !this.currentUser.isLoggedIn || this.currentUser.id === 'guest';
    const uid = isGuest ? 'guest' : (this.currentUser.id || this.currentUser.uid || 'guest');
    const storageKey = `${STORAGE_KEYS.USER_TAILORED_RECIPES_PREFIX}${uid}`;

    const record = {
      userId: uid,
      query: customQuery || this.customQuery || '',
      savedAt: new Date().toISOString(),
      selectedIngredients: (selectedIngredients && selectedIngredients.length > 0) ? selectedIngredients : this.getSelectedIngredients(),
      recipes: recipes || []
    };

    // 로컬 스토리지 즉시 캐싱
    try {
      localStorage.setItem(storageKey, JSON.stringify(record));
    } catch (e) {}

    // 백엔드 REST API 영구 저장 (/api/user-recipes)
    try {
      const resp = await fetch('/api/user-recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: uid,
          query: record.query,
          selectedIngredients: record.selectedIngredients,
          recipes: record.recipes,
          adminName: this.currentUser?.name || '사용자'
        })
      });
      if (resp.ok) {
        const result = await resp.json();
        this.notify('USER_RECIPES_SAVED', record);
        return result;
      }
    } catch (e) {
      console.warn('⚠️ [Store] Failed to save user recipes to backend API:', e);
    }

    this.notify('USER_RECIPES_SAVED', record);
    return { status: 'local_saved', record };
  }

  // 🌟 계정별 맞춤 레시피 & 매칭 식재료 DB 조회
  async fetchUserRecipesFromDB(userId = null) {
    const isGuest = !this.currentUser || !this.currentUser.isLoggedIn || this.currentUser.id === 'guest';
    const uid = userId || (isGuest ? 'guest' : (this.currentUser.id || this.currentUser.uid || 'guest'));
    const storageKey = `${STORAGE_KEYS.USER_TAILORED_RECIPES_PREFIX}${uid}`;

    try {
      const resp = await fetch(`/api/user-recipes?userId=${encodeURIComponent(uid)}`);
      if (resp.ok) {
        const result = await resp.json();
        if (result.status === 'success' && result.data && Array.isArray(result.data.recipes) && result.data.recipes.length > 0) {
          localStorage.setItem(storageKey, JSON.stringify(result.data));
          return result.data;
        }
      }
    } catch (e) {
      console.warn('⚠️ [Store] Failed to fetch user recipes from backend API:', e);
    }

    // 로컬 스토리지 Fallback
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) return JSON.parse(raw);
    } catch (e) {}

    return null;
  }

  getUserStoredRecipes(userId = null) {
    const isGuest = !this.currentUser || !this.currentUser.isLoggedIn || this.currentUser.id === 'guest';
    const uid = userId || (isGuest ? 'guest' : (this.currentUser.id || this.currentUser.uid || 'guest'));
    const storageKey = `${STORAGE_KEYS.USER_TAILORED_RECIPES_PREFIX}${uid}`;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return null;
  }

  normalizeIngredients(list) {
    if (!Array.isArray(list)) return [];
    let changed = false;
    list.forEach(item => {
      const correctShelf = this.detectShelf(item.name);
      if (item.name.includes('불닭') || item.name.includes('라면') || item.name.includes('면')) {
        if (item.shelf !== 'sauce') {
          item.shelf = 'sauce';
          changed = true;
        }
      } else if (!item.shelf) {
        item.shelf = correctShelf;
        changed = true;
      }

      const currentUnit = (item.unit || '개').trim();
      const detectedUnit = detectUnit(item.name, item.count);
      if (currentUnit === '개' && detectedUnit !== '개') {
        item.unit = detectedUnit;
        changed = true;
      }

      const unit = (item.unit || '').trim().toLowerCase();
      const isGram = unit === 'g' || unit === '그람';
      const origCount = Number(item.count) || 0;
      let normCount;
      if (isGram) {
        normCount = Math.max(0, Math.round(origCount / 10) * 10);
      } else {
        if (origCount > 0 && origCount < 1) {
          normCount = 1;
        } else {
          normCount = Math.max(0, Math.round(origCount));
        }
      }
      if (item.count !== normCount) {
        item.count = normCount;
        changed = true;
      }
    });
    return list;
  }

  loadIngredients() {
    const isGuest = !this.currentUser || !this.currentUser.isLoggedIn || this.currentUser.id === 'guest';
    const storageKey = this.getStorageKey();
    const raw = localStorage.getItem(storageKey);
    let list;

    if (isGuest) {
      if (!raw) {
        list = JSON.parse(JSON.stringify(GUEST_DEFAULT_INGREDIENTS));
      } else {
        try {
          list = JSON.parse(raw);
        } catch {
          list = JSON.parse(JSON.stringify(GUEST_DEFAULT_INGREDIENTS));
        }
      }
    } else {
      if (!raw) {
        list = JSON.parse(JSON.stringify(DEFAULT_INGREDIENTS));
      } else {
        try {
          list = JSON.parse(raw);
        } catch {
          list = JSON.parse(JSON.stringify(DEFAULT_INGREDIENTS));
        }
      }
      // 로그인 사용자라면 백그라운드에서 최신 DB 인벤토리 비동기 갱신
      setTimeout(() => {
        const uid = this.currentUser?.id || this.currentUser?.uid;
        if (uid && uid !== 'guest') {
          this.fetchUserFridgeFromDB(uid);
        }
      }, 50);
    }

    list = this.normalizeIngredients(list);

    if (!raw) {
      this.saveIngredients(list);
    }
    return list;
  }

  saveIngredients(list) {
    localStorage.setItem(this.getStorageKey(), JSON.stringify(list));
    // Firebase 클라우드 DB 비동기 동기화 및 백엔드 REST API 영속화 (로그인 상태일 때만!)
    const uid = this.currentUser?.id || this.currentUser?.uid;
    const isLoggedIn = this.currentUser?.isLoggedIn && uid && uid !== 'guest';

    if (isLoggedIn) {
      if (firebaseAdapter && firebaseAdapter.syncFridgeToCloud) {
        firebaseAdapter.syncFridgeToCloud(uid, list);
      }
      fetch('/api/fridge/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: uid, inventory: list })
      }).catch(err => console.warn('⚠️ [Store] Fridge sync to backend failed:', err));
    }
  }

  getIngredients() {
    return this.ingredients;
  }

  getSelectedIngredients() {
    return this.ingredients.filter(ing => ing.selected && ing.count > 0);
  }

  updateIngredientCount(id, delta) {
    const item = this.ingredients.find(i => i.id === id);
    if (!item) return;

    const unit = (item.unit || '').trim().toLowerCase();
    const isGram = unit === 'g' || unit === '그람';
    const direction = delta > 0 ? 1 : -1;
    const step = isGram ? 10 : 1;

    let current = Number(item.count) || 0;
    let newCount;
    if (isGram) {
      newCount = Math.round(current / 10) * 10 + (direction * step);
      newCount = Math.max(0, Math.round(newCount / 10) * 10);
    } else {
      newCount = Math.round(current) + (direction * step);
      newCount = Math.max(0, Math.round(newCount));
    }

    item.count = newCount;
    if (item.count === 0) item.selected = false;
    this.saveIngredients(this.ingredients);
    this.notify('INGREDIENT_UPDATED', item);
  }

  toggleSelectIngredient(id) {
    const item = this.ingredients.find(i => i.id === id);
    if (!item) return;
    if (item.count <= 0) return;
    item.selected = !item.selected;
    this.saveIngredients(this.ingredients);
    this.notify('INGREDIENT_TOGGLED', item);
  }

  toggleSelectAll(selectAll = true) {
    this.ingredients.forEach(i => {
      if (i.count > 0) i.selected = selectAll;
    });
    this.saveIngredients(this.ingredients);
    this.notify('INGREDIENTS_ALL_TOGGLED', selectAll);
  }

  addIngredient(name, count = 1, unit = null, shelf = null) {
    const cleanName = name.trim();
    if (!cleanName) return null;

    // 선반 결정: 명시적 shelf가 전달되면 100% 최우선 적용, 없으면 스마트 자동 분류
    const targetShelf = shelf || this.detectShelf(cleanName);

    // 단위 결정: unit이 명시되지 않았거나 '개'인 경우, 식재료 고유 단위가 있는지 지능형 자동 탐지
    let resolvedUnit = (unit || '').trim();
    if (!resolvedUnit || resolvedUnit === '개') {
      const autoUnit = this.detectUnit(cleanName, count);
      if (autoUnit !== '개' || !resolvedUnit) {
        resolvedUnit = autoUnit;
      }
    }

    const unitClean = resolvedUnit || '개';
    const isGram = unitClean.toLowerCase() === 'g' || unitClean === '그람';
    let numericCount = Number(count) || (isGram ? 100 : 1);
    if (isGram) {
      numericCount = Math.max(10, Math.round(numericCount / 10) * 10);
    } else {
      numericCount = Math.max(1, Math.round(numericCount));
    }

    const existing = this.ingredients.find(i => i.name.toLowerCase() === cleanName.toLowerCase());
    if (existing) {
      // 기존 단위가 '개'였는데 신규 감지 단위가 'g' 또는 '병' 등 전용 단위인 경우 승격
      if (existing.unit === '개' && unitClean !== '개') {
        existing.unit = unitClean;
      }
      if (isGram) {
        existing.count = Math.max(0, Math.round((existing.count + numericCount) / 10) * 10);
      } else {
        existing.count = Math.max(0, Math.round(existing.count) + numericCount);
      }
      existing.selected = true;
      if (shelf) {
        existing.shelf = shelf;
      }
      this.saveIngredients(this.ingredients);
      this.notify('INGREDIENT_ADDED', existing);
      return existing;
    }

    const newItem = {
      id: 'ing_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      name: cleanName,
      count: numericCount,
      unit: unitClean,
      shelf: targetShelf,
      freshness: 'fresh',
      daysLeft: targetShelf === 'meat' ? 3 : (targetShelf === 'dairy' ? 7 : (targetShelf === 'sauce' ? 60 : 7)),
      selected: true
    };
    this.ingredients.unshift(newItem);
    this.saveIngredients(this.ingredients);
    this.notify('INGREDIENT_ADDED', newItem);
    return newItem;
  }

  removeIngredient(id) {
    const idx = this.ingredients.findIndex(i => i.id === id);
    if (idx !== -1) {
      const removed = this.ingredients.splice(idx, 1)[0];
      this.saveIngredients(this.ingredients);
      this.notify('INGREDIENT_REMOVED', removed);
      return removed;
    }
    return null;
  }

  resetToEmptyFridge() {
    this.ingredients = [];
    this.saveIngredients(this.ingredients);
    this.notify('FRIDGE_RESET', []);
  }

  restoreDefaultFridge() {
    this.ingredients = JSON.parse(JSON.stringify(DEFAULT_INGREDIENTS));
    this.saveIngredients(this.ingredients);
    this.notify('FRIDGE_RESTORED', this.ingredients);
  }

  loadAutoDeductSetting() {
    const raw = localStorage.getItem(STORAGE_KEYS.AUTO_DEDUCT);
    return raw === null ? true : raw === 'true';
  }

  setAutoDeduct(enabled) {
    this.autoDeductEnabled = !!enabled;
    localStorage.setItem(STORAGE_KEYS.AUTO_DEDUCT, String(this.autoDeductEnabled));
    this.notify('AUTO_DEDUCT_CHANGED', this.autoDeductEnabled);
  }

  // 3. 테마 및 사용자 직접 입력 검색어 (요구사항 3)
  setActiveTheme(theme) {
    this.activeTheme = theme;
    localStorage.setItem(STORAGE_KEYS.ACTIVE_THEME, theme);
    this.notify('THEME_CHANGED', theme);
  }

  getActiveTheme() {
    return this.activeTheme;
  }

  setCustomSearchQuery(query) {
    this.customQuery = (query || '').trim();
    localStorage.setItem(STORAGE_KEYS.CUSTOM_SEARCH_QUERY, this.customQuery);
    this.notify('CUSTOM_QUERY_CHANGED', this.customQuery);
  }

  setCustomQuery(query) {
    this.setCustomSearchQuery(query);
  }

  getCustomSearchQuery() {
    return this.customQuery;
  }

  getCustomQuery() {
    return this.customQuery;
  }

  // 4. ⭐ 실시간 재료 차감 (Real-time Deduction) & 완식 카운트 증가
  deductRecipeIngredients(recipe) {
    if (!recipe || !recipe.ingredients) return { deducted: [], depleted: [] };

    const deducted = [];
    const depleted = [];

    recipe.ingredients.forEach(req => {
      const target = this.ingredients.find(i => 
        i.name.includes(req.name) || req.name.includes(i.name)
      );

      if (target) {
        const prevCount = target.count;
        const deductAmount = req.need || 1;
        target.count = Math.max(0, Math.round((target.count - deductAmount) * 10) / 10);
        
        deducted.push({
          name: target.name,
          unit: target.unit,
          prev: prevCount,
          curr: target.count,
          deducted: deductAmount
        });

        if (target.count === 0) {
          target.selected = false;
          depleted.push(target.name);
        }
      }
    });

    this.saveIngredients(this.ingredients);

    // 완식 이력 저장 및 횟수 증가 (칭호 자동 반영)
    if (recipe.id) {
      this.completedRecipeIds.add(recipe.id);
      localStorage.setItem(STORAGE_KEYS.COOK_COMPLETED_IDS, JSON.stringify([...this.completedRecipeIds]));
    }
    this.cookCount += 1;
    localStorage.setItem(STORAGE_KEYS.COOK_COUNT, String(this.cookCount));

    const result = { recipeTitle: recipe.title, deducted, depleted, newCount: this.cookCount, titleInfo: this.getUserTitleInfo() };
    this.notify('INGREDIENTS_DEDUCTED', result);
    return result;
  }

  loadCompletedRecipeIds() {
    const raw = localStorage.getItem(STORAGE_KEYS.COOK_COMPLETED_IDS);
    if (!raw) return new Set(['recipe_02']); // 기본 황금볶음밥은 완식 이력 있음
    try {
      return new Set(JSON.parse(raw));
    } catch {
      return new Set(['recipe_02']);
    }
  }

  // 🌟 요구사항 7: 해당 레시피를 완료한 사용자만 커뮤니티 댓글 작성 가능
  hasCompletedRecipe(recipeId) {
    return this.completedRecipeIds.has(recipeId);
  }

  // 5. 🌟 요구사항 10: 사용자 레시피 직접 등록 & 공유 저장소
  loadUserRecipes() {
    const raw = localStorage.getItem(STORAGE_KEYS.USER_CUSTOM_RECIPES);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  addUserRecipe(recipeData) {
    const newRecipe = {
      id: 'custom_' + Date.now(),
      craftNo: `CHEF CRAFT NO. ${String(this.userRecipes.length + 7).padStart(2, '0')}`,
      title: recipeData.title,
      subTitle: recipeData.subTitle || '셰프 공유 레시피',
      description: recipeData.description,
      theme: recipeData.theme || 'all',
      rating: 5.0,
      reviewCount: 1,
      timeMinutes: parseInt(recipeData.timeMinutes || '15', 10),
      difficulty: recipeData.difficulty || '난이도 보통',
      calorie: parseInt(recipeData.calorie || '450', 10),
      matchRate: 100,
      badgeText: '셰프 직접 등록',
      isUserCreated: true,
      author: this.currentUser.name,
      youtube: {
        channel: `${this.currentUser.name}의 키친`,
        subscribers: '신규 등록',
        views: '10회',
        title: recipeData.title,
        embedId: recipeData.embedId || 'Qp0bA3b400w',
        url: recipeData.youtubeUrl || 'https://www.youtube.com'
      },
      ingredients: recipeData.ingredients || [
        { name: '대파', need: 1, unit: '대', match: true, shelf: 'vege' }
      ],
      steps: recipeData.steps || [
        { step: 1, title: '조리 준비', desc: '재료를 깨끗이 손질합니다.', time: '3분' },
        { step: 2, title: '정성껏 조리', desc: recipeData.description, time: '10분' }
      ]
    };

    this.userRecipes.unshift(newRecipe);
    localStorage.setItem(STORAGE_KEYS.USER_CUSTOM_RECIPES, JSON.stringify(this.userRecipes));
    this.notify('USER_RECIPE_ADDED', newRecipe);
    return newRecipe;
  }

  getUserRecipes() {
    return this.userRecipes;
  }

  // 6. 🌟 요구사항 8: 커뮤니티 후기, 추천(좋아요), 조회수 & 베스트 노하우 댓글 선정
  loadCommunityPosts() {
    const raw = localStorage.getItem(STORAGE_KEYS.COMMUNITY_POSTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.COMMUNITY_POSTS, JSON.stringify(DEFAULT_POSTS));
      return [...DEFAULT_POSTS];
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [...DEFAULT_POSTS];
    }
  }

  addCommunityPost(postData) {
    const titleInfo = this.getUserTitleInfo();
    const newPost = {
      id: 'post_' + Date.now(),
      author: this.currentUser.name || '요리하는 소라',
      authorBadge: titleInfo.title,
      tag: postData.tag || '나만의 비법',
      timeAgo: '방금 전',
      rating: postData.rating || 5.0,
      content: postData.content,
      recipeName: postData.recipeName,
      recipeId: postData.recipeId,
      chefTip: postData.chefTip || '',
      likes: 1,
      views: 1,
      isBestKnowhow: false,
      verified: true
    };
    this.posts.unshift(newPost);
    this.evaluateBestKnowhow();
    localStorage.setItem(STORAGE_KEYS.COMMUNITY_POSTS, JSON.stringify(this.posts));
    this.notify('POST_ADDED', newPost);
    return newPost;
  }

  // 추천(좋아요) 토글 & 노하우 댓글 재평가
  likePost(postId) {
    const post = this.posts.find(p => p.id === postId);
    if (!post) return;
    post.likes += 1;
    this.evaluateBestKnowhow();
    localStorage.setItem(STORAGE_KEYS.COMMUNITY_POSTS, JSON.stringify(this.posts));
    this.notify('POST_LIKED', post);
  }

  viewPost(postId) {
    const post = this.posts.find(p => p.id === postId);
    if (!post) return;
    post.views = (post.views || 0) + 1;
    this.evaluateBestKnowhow();
    localStorage.setItem(STORAGE_KEYS.COMMUNITY_POSTS, JSON.stringify(this.posts));
  }

  // 10-1. 커뮤니티 베스트 노하우 댓글 자동 평가 및 선정 (추천수 / 노하우 팁 기반)
  evaluateBestKnowhow() {
    if (!this.posts || !Array.isArray(this.posts)) return;
    this.posts.forEach(p => {
      if (p.likes >= 5 || (p.chefTip && p.chefTip.length >= 10 && p.likes >= 2)) {
        p.isBestKnowhow = true;
      }
    });
  }

  // ============================================================
  // 👑 관리자(Admin) 통합 제어 및 6대 권한 시스템
  // ============================================================

  isAdmin() {
    return !!(this.currentUser && (this.currentUser.role === 'admin' || this.currentUser.email === 'admin@kitchenchef.com'));
  }

  isManager() {
    return !!(this.currentUser && (this.currentUser.role === 'admin' || this.currentUser.role === 'manager' || this.currentUser.email === 'admin@kitchenchef.com'));
  }

  // 1. 회원 목록 및 세션/보안 관리 (초기 Seed 보장)
  loadAdminUsers() {
    const raw = localStorage.getItem('kitchen_chef_admin_users');
    let users = [];
    if (raw) {
      try { users = JSON.parse(raw); } catch { users = []; }
    }

    const defaultUsers = [
      {
        id: 'admin',
        uid: 'admin',
        name: '총괄 관리자 (Chef Admin)',
        email: 'admin@kitchenchef.com',
        password: 'admin1234!',
        role: 'admin',
        status: 'active',
        is_active: true,
        providers: ['password', 'google.com'],
        level: '마스터 셰프 Lv.4',
        tier: '미슐랭 홈파티 장인',
        avatar: 'frontend/assets/images/icon.png',
        cookCount: 12,
        createdAt: '2026-09-01 10:00',
        lastLogin: '2026-09-17 12:50',
        sessionValid: true
      }
    ];

    if (!Array.isArray(users) || users.length === 0) {
      users = defaultUsers;
      this.saveAdminUsers(users);
      return users;
    }

    // 기본 시드 계정의 필수 필드(비밀번호, 역할, providers, is_active) 보장
    let modified = false;
    defaultUsers.forEach(seed => {
      const idx = users.findIndex(u => (u.email && u.email.toLowerCase() === seed.email.toLowerCase()) || u.id === seed.id);
      if (idx === -1) {
        users.push(seed);
        modified = true;
      } else {
        if (!users[idx].password) {
          users[idx].password = seed.password;
          modified = true;
        }
        if (seed.role === 'admin' && users[idx].role !== 'admin') {
          users[idx].role = 'admin';
          modified = true;
        }
        if (!users[idx].providers || users[idx].providers.length === 0) {
          users[idx].providers = seed.providers;
          modified = true;
        }
        if (users[idx].is_active === undefined) {
          users[idx].is_active = seed.is_active;
          modified = true;
        }
      }
    });

    // 기존 유저 객체에 providers, is_active 기본값 보정
    users.forEach(u => {
      if (!u.providers || !Array.isArray(u.providers) || u.providers.length === 0) {
        u.providers = u.password === 'google_oauth' ? ['google.com'] : ['password'];
        modified = true;
      }
      if (u.is_active === undefined) {
        u.is_active = u.status !== 'suspended';
        modified = true;
      }
    });

    if (modified) {
      this.saveAdminUsers(users);
    }
    return users;
  }

  saveAdminUsers(users) {
    localStorage.setItem('kitchen_chef_admin_users', JSON.stringify(users));
  }

  async syncAdminUsersWithRemote() {
    let currentUsers = this.loadAdminUsers();
    const userMap = new Map();
    // 1. 기존 로컬 캐시 사용자 등록
    currentUsers.forEach(u => {
      const key = (u.id || u.uid || u.email || '').toLowerCase();
      if (key) userMap.set(key, u);
    });

    // 2. 백엔드 REST API GET /api/admin/users 에서 최신 유저 수집
    try {
      const resp = await fetch('/api/admin/users');
      if (resp.ok) {
        const data = await resp.json();
        if (data.users && Array.isArray(data.users)) {
          data.users.forEach(u => {
            const key = (u.id || u.uid || u.email || '').toLowerCase();
            if (key) {
              const existing = userMap.get(key) || {};
              userMap.set(key, { ...existing, ...u });
            }
          });
        }
      }
    } catch (e) {
      console.warn("⚠️ [Store] Fetch remote admin users failed:", e);
    }

    // 3. Firestore / 하이브리드 클라우드 DB에서 신규 유저 수집
    try {
      const cloudUsers = await firebaseAdapter.fetchAllUsersFromCloud();
      if (cloudUsers && Array.isArray(cloudUsers)) {
        cloudUsers.forEach(u => {
          const key = (u.id || u.uid || u.email || '').toLowerCase();
          if (key) {
            const existing = userMap.get(key) || {};
            userMap.set(key, { ...existing, ...u });
          }
        });
      }
    } catch (e) {
      console.warn("⚠️ [Store] Cloud users fetch error:", e);
    }

    const merged = Array.from(userMap.values());
    this.saveAdminUsers(merged);

    // 4. 백엔드와 양방향 동기화 (로컬 신규 유저를 백엔드에 즉시 백업)
    fetch('/api/admin/users/batch-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ users: merged })
    }).catch(() => {});

    this.notify('ADMIN_USERS_UPDATED', merged);
    return merged;
  }

  getAdminUsers(query = '', filterRole = 'all', filterStatus = 'all') {
    let users = this.loadAdminUsers();
    if (query) {
      const q = query.toLowerCase();
      users = users.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }
    if (filterRole !== 'all') {
      users = users.filter(u => u.role === filterRole);
    }
    if (filterStatus !== 'all') {
      users = users.filter(u => u.status === filterStatus);
    }
    return users;
  }

  updateUserStatus(userId, newStatus, reason = '') {
    const users = this.loadAdminUsers();
    const user = users.find(u => u.id === userId);
    if (!user) return null;
    const oldStatus = user.status;
    user.status = newStatus;
    if (newStatus === 'suspended') {
      user.sessionValid = false;
    }
    this.saveAdminUsers(users);
    this.addAuditLog('ACCOUNT', `회원 상태 변경 (${oldStatus} -> ${newStatus})`, `${user.name} (${user.email})`, reason || `상태를 ${newStatus}(으)로 변경`);
    fetch('/api/admin/user/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, status: newStatus, adminName: this.currentUser?.name || '총괄 관리자' })
    }).catch(() => {});
    this.notify('ADMIN_USERS_UPDATED', users);
    return user;
  }

  forceLogoutUser(userId) {
    const users = this.loadAdminUsers();
    const user = users.find(u => u.id === userId || u.uid === userId);
    if (!user) return null;
    user.sessionValid = false;
    this.saveAdminUsers(users);
    this.addAuditLog('SECURITY', '강제 세션 만료 (원클릭 로그아웃)', `${user.name} (${user.email})`, '관리자에 의한 강제 세션 무효화');
    fetch('/api/admin/user/session-expire', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, adminName: this.currentUser?.name || '총괄 관리자' })
    }).catch(() => {});
    this.notify('ADMIN_USERS_UPDATED', users);
    return user;
  }

  // 🌟 관리자: 회원 역할(Role: admin, manager, user) 변경
  async updateUserRole(userId, newRole, reason = '') {
    const users = this.loadAdminUsers();
    const user = users.find(u => u.id === userId || u.uid === userId || u.email === userId);
    if (!user) throw new Error("사용자를 찾을 수 없습니다.");
    const oldRole = user.role || 'user';
    user.role = newRole;
    if (newRole === 'admin') {
      user.level = user.level || '마스터 셰프 Lv.4';
      user.tier = user.tier || '미슐랭 홈파티 장인';
    }
    this.saveAdminUsers(users);

    // 현재 세션 사용자와 동일할 경우 세션 즉시 갱신
    if (this.currentUser && (this.currentUser.id === user.id || this.currentUser.uid === user.id || this.currentUser.email === user.email)) {
      this.currentUser.role = newRole;
      this.saveSession(this.currentUser);
    }

    this.addAuditLog('ROLE', `회원 권한 변경 (${oldRole} -> ${newRole})`, `${user.name} (${user.email})`, reason || `역할을 ${newRole}(으)로 변경`);
    try {
      const resp = await fetch('/api/admin/user/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id || user.uid, role: newRole, adminName: this.currentUser?.name || '총괄 관리자' })
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.detail || data.error || '역할 변경 실패');
    } catch (e) {
      console.warn("⚠️ [Store] Server role update failed:", e);
    }
    this.notify('ADMIN_USERS_UPDATED', users);
    return user;
  }

  // 🌟 관리자: 세션 강제 만료
  async expireUserSession(userId, reason = '') {
    return this.forceLogoutUser(userId);
  }

  // 🌟 관리자: 임시 비밀번호 재발급 / 초기화
  async resetUserPassword(userId, newPassword = null, reason = '') {
    const users = this.loadAdminUsers();
    const user = users.find(u => u.id === userId || u.uid === userId);
    if (!user) throw new Error("사용자를 찾을 수 없습니다.");
    let genPassword = newPassword || `temp_${Math.random().toString(36).substring(2, 8)}!`;
    try {
      const resp = await fetch('/api/admin/user/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, newPassword: genPassword, adminName: this.currentUser?.name || '총괄 관리자' })
      });
      const data = await resp.json();
      if (resp.ok && data.tempPassword) {
        genPassword = data.tempPassword;
      }
    } catch (e) {}
    user.password = genPassword;
    this.saveAdminUsers(users);
    this.addAuditLog('SECURITY', '임시 비밀번호 재발급', `${user.name} (${user.email})`, reason || `새 비밀번호: ${genPassword}`);
    this.notify('ADMIN_USERS_UPDATED', users);
    return { user, tempPassword: genPassword };
  }

  // 🌟 관리자: 특정 로그인 제공자 연동 해제
  async unlinkUserProvider(userId, provider = 'google.com', reason = '') {
    const users = this.loadAdminUsers();
    const user = users.find(u => u.id === userId || u.uid === userId);
    if (!user) throw new Error("사용자를 찾을 수 없습니다.");
    const resp = await fetch('/api/admin/user/unlink-provider', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, provider, adminName: this.currentUser?.name || '총괄 관리자' })
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.detail || data.error || '연동 해제 실패');
    user.providers = data.providers || (user.providers || []).filter(p => p !== provider);
    this.saveAdminUsers(users);
    this.addAuditLog('SECURITY', `제공자 연동 해제 (${provider})`, `${user.name} (${user.email})`, reason || '관리자 조치');
    this.notify('ADMIN_USERS_UPDATED', users);
    return user;
  }

  // 🌟 관리자: 종합 조치 일괄 적용
  async applyAdminActions(userId, payload = {}) {
    const users = this.loadAdminUsers();
    const user = users.find(u => u.id === userId || u.uid === userId);
    if (!user) throw new Error("사용자를 찾을 수 없습니다.");
    const resp = await fetch('/api/admin/user/actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ...payload, adminName: this.currentUser?.name || '총괄 관리자' })
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.detail || data.error || '일괄 조치 적용 실패');
    if (data.user) {
      Object.assign(user, data.user);
    }
    this.saveAdminUsers(users);
    this.addAuditLog('ADMIN_ACTION', '회원 종합 관리 조치 적용', `${user.name} (${user.email})`, JSON.stringify(payload));
    this.notify('ADMIN_USERS_UPDATED', users);
    return { user, actionsApplied: data.actions_applied, tempPassword: data.temp_password };
  }

  // 🌟 관리자: 회원 단일/다중 일괄 영구 삭제 (역할 기반 인가 가드)
  async deleteUsers(userIds, operatorInfo = {}) {
    const list = Array.isArray(userIds) ? userIds : [userIds];
    if (!list || list.length === 0) throw new Error("삭제할 대상 회원을 선택해주세요.");

    const opRole = operatorInfo.role || this.currentUser?.role || 'admin';
    const opId = operatorInfo.id || this.currentUser?.id || this.currentUser?.uid;
    const opName = operatorInfo.name || this.currentUser?.name || '총괄 관리자';

    const resp = await fetch('/api/admin/users/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userIds: list,
        operatorId: opId,
        operatorRole: opRole,
        adminName: opName
      })
    });

    const data = await resp.json();
    if (!resp.ok) {
      const err = new Error(data.message || data.code || '회원 삭제 요청이 실패했습니다.');
      err.code = data.code;
      err.data = data;
      throw err;
    }

    // 성공적으로 삭제된 ID 및 이메일 목록 추출
    const deletedUsers = data.deleted || [];
    const deletedIds = new Set(deletedUsers.map(u => u.id || u.uid));
    const deletedEmails = new Set(deletedUsers.map(u => (u.email || '').toLowerCase()).filter(Boolean));
    const deletedNames = new Set(deletedUsers.map(u => u.name || u.displayName || u.display_name).filter(Boolean));

    list.forEach(id => {
      if (data.deletedCount > 0 && deletedIds.size === 0) {
        deletedIds.add(id);
      }
    });

    // 1) 로컬 adminUsers 목록에서 제거 및 저장
    let users = this.loadAdminUsers();
    users = users.filter(u => !deletedIds.has(u.id) && !deletedIds.has(u.uid) && (!u.email || !deletedEmails.has(u.email.toLowerCase())));
    this.saveAdminUsers(users);

    // 2) Firebase 클라우드/로컬 DB 및 레지스트리 영구 제거
    deletedUsers.forEach(u => {
      const uId = u.id || u.uid;
      const uEmail = u.email;
      if (typeof firebaseAdapter !== 'undefined' && firebaseAdapter.deleteUserAllData) {
        firebaseAdapter.deleteUserAllData(uId, uEmail).catch(() => {});
      }
    });

    // 3) 개인 냉장고 인벤토리 및 맞춤 레시피 로컬 스토리지 정리
    deletedIds.forEach(id => {
      try {
        localStorage.removeItem(`${STORAGE_KEYS.USERS_FRIDGE_PREFIX}${id}`);
        localStorage.removeItem(`kitchen_chef_fridge_${id}`);
        localStorage.removeItem(`${STORAGE_KEYS.USER_TAILORED_RECIPES_PREFIX}${id}`);
        localStorage.removeItem(`kitchen_chef_tailored_recipes_${id}`);
        localStorage.removeItem(`firebase_user_${id}`);
        localStorage.removeItem(`firebase_cloud_user_${id}`);
        localStorage.removeItem(`firebase_cloud_fridge_${id}`);
      } catch (e) {}
    });
    deletedEmails.forEach(email => {
      try {
        localStorage.removeItem(`firebase_mock_user_${email}`);
      } catch (e) {}
    });

    // 4) 커뮤니티 게시글 목록에서 해당 삭제 회원이 작성한 모든 글 연쇄 제거
    try {
      let posts = JSON.parse(localStorage.getItem(STORAGE_KEYS.COMMUNITY_POSTS) || '[]');
      const beforeCount = posts.length;
      posts = posts.filter(p => {
        const author = String(p.author || '').trim();
        const authorId = String(p.authorId || p.userId || p.uid || '').trim();
        const email = String(p.email || '').trim().toLowerCase();
        if (deletedNames.has(author)) return false;
        if (deletedIds.has(authorId) || deletedIds.has(author)) return false;
        if (deletedEmails.has(email) || deletedEmails.has(author)) return false;
        return true;
      });
      if (posts.length !== beforeCount) {
        localStorage.setItem(STORAGE_KEYS.COMMUNITY_POSTS, JSON.stringify(posts));
        if (Array.isArray(this.communityPosts)) {
          this.communityPosts = posts;
        }
        this.notify('COMMUNITY_POSTS_UPDATED', posts);
      }
    } catch (e) {}

    // 5) 현재 로그인한 세션 유저가 삭제 대상일 경우 즉시 세션 파기
    if (this.currentUser && (deletedIds.has(this.currentUser.id) || deletedIds.has(this.currentUser.uid) || (this.currentUser.email && deletedEmails.has(this.currentUser.email.toLowerCase())))) {
      console.warn("🔒 현재 로그인 중인 계정이 삭제되어 자동 로그아웃 처리합니다.");
      this.logout();
    }

    this.notify('ADMIN_USERS_UPDATED', users);
    this.notify('FRIDGE_UPDATED');
    return data;
  }

  // 2. 회원별 등급 조회 및 수정
  updateUserTier(userId, newLevel, cookCount = null) {
    const users = this.loadAdminUsers();
    const user = users.find(u => u.id === userId);
    if (!user) return null;
    const tierMap = {
      '초보 셰프 Lv.1': '주방의 호기심쟁이',
      '주니어 셰프 Lv.2': '신선 재고 구출자',
      '시니어 셰프 Lv.3': '냉파 마스터',
      '마스터 셰프 Lv.4': '미슐랭 홈파티 장인'
    };
    user.level = newLevel;
    user.tier = tierMap[newLevel] || '신선 재고 구출자';
    if (cookCount !== null) {
      user.cookCount = parseInt(cookCount, 10);
    }
    this.saveAdminUsers(users);
    this.addAuditLog('TIER', '회원 등급 및 조리 횟수 수정', `${user.name}`, `등급: ${newLevel} (${user.tier}), 누적 완식: ${user.cookCount}회`);
    fetch('/api/admin/user/tier', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, level: newLevel, cookCount: user.cookCount, adminName: this.currentUser?.name || '총괄 관리자' })
    }).catch(() => {});
    this.notify('ADMIN_USERS_UPDATED', users);
    return user;
  }

  // 3. 개인 냉장고 및 재고 데이터 관리 & Vision AI
  getUserFridge(userId) {
    const storageKey = `${STORAGE_KEYS.USERS_FRIDGE_PREFIX}${userId}`;
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      try {
        const items = JSON.parse(raw);
        if (Array.isArray(items) && items.length > 0) return items;
      } catch {}
    }

    // Cloud fallback
    const cloudRaw = localStorage.getItem('firebase_cloud_fridge_' + userId);
    if (cloudRaw) {
      try {
        const items = JSON.parse(cloudRaw);
        if (Array.isArray(items) && items.length > 0) return items;
      } catch {}
    }

    return [
      { id: 'def_1', name: '대파', count: 2, unit: '대', shelf: 'vege', freshness: 'fresh', daysLeft: 6, selected: true },
      { id: 'def_2', name: '계란', count: 6, unit: '알', shelf: 'dairy', freshness: 'fresh', daysLeft: 14, selected: true },
      { id: 'def_3', name: '스팸', count: 1, unit: '캔', shelf: 'meat', freshness: 'fresh', daysLeft: 60, selected: true },
      { id: 'def_4', name: '진간장', count: 1, unit: '병', shelf: 'sauce', freshness: 'fresh', daysLeft: 90, selected: true }
    ];
  }

  async fetchUserFridgeRemote(userId) {
    try {
      const resp = await fetch(`/api/admin/fridge/${encodeURIComponent(userId)}`);
      if (resp.ok) {
        const data = await resp.json();
        const items = data.inventory || data.fridge;
        if (items && Array.isArray(items) && items.length > 0) {
          localStorage.setItem(`${STORAGE_KEYS.USERS_FRIDGE_PREFIX}${userId}`, JSON.stringify(items));
          return items;
        }
      }
    } catch {}
    return this.getUserFridge(userId);
  }

  restoreUserFridge(userId) {
    const storageKey = `${STORAGE_KEYS.USERS_FRIDGE_PREFIX}${userId}`;
    const restored = [
      { id: 'res_1', name: '대파', count: 2, unit: '대', shelf: 'vege', freshness: 'fresh', daysLeft: 7, selected: true },
      { id: 'res_2', name: '양파', count: 2, unit: '개', shelf: 'vege', freshness: 'fresh', daysLeft: 10, selected: true },
      { id: 'res_3', name: '스팸', count: 1, unit: '캔', shelf: 'meat', freshness: 'fresh', daysLeft: 60, selected: true },
      { id: 'res_4', name: '계란', count: 6, unit: '알', shelf: 'dairy', freshness: 'fresh', daysLeft: 14, selected: true },
      { id: 'res_5', name: '두부', count: 1, unit: '모', shelf: 'dairy', freshness: 'expiring', daysLeft: 3, selected: true },
      { id: 'res_6', name: '진간장', count: 1, unit: '병', shelf: 'sauce', freshness: 'fresh', daysLeft: 90, selected: true }
    ];
    localStorage.setItem(storageKey, JSON.stringify(restored));
    this.addAuditLog('FRIDGE', '개인 냉장고 재고 스냅샷 데이터 복구', `유저 ID: ${userId}`, '6대 핵심 기본 재료 프리셋으로 재고 복구 완료');
    fetch('/api/admin/fridge/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, adminName: this.currentUser?.name || '총괄 관리자' })
    }).catch(() => {});
    return restored;
  }

  loadVisionLogs() {
    const raw = localStorage.getItem('kitchen_chef_admin_vision_logs');
    if (raw) {
      try { return JSON.parse(raw); } catch {}
    }
    const defaultLogs = [
      {
        id: 'vis_1',
        timestamp: '2026-09-17 12:35:14',
        user: '22 songpa',
        filename: 'emart_receipt_2026.jpg',
        detected: '불닭볶음면 (1봉)',
        classifiedShelf: 'sauce',
        correctShelf: 'sauce',
        status: 'success',
        aiConfidence: '98.4%'
      },
      {
        id: 'vis_2',
        timestamp: '2026-09-17 12:20:05',
        user: 'YUJIN H',
        filename: 'refrigerator_door.png',
        detected: '토마토 스파게티 소스 (1병)',
        classifiedShelf: 'sauce',
        correctShelf: 'sauce',
        status: 'success',
        aiConfidence: '96.2%'
      },
      {
        id: 'vis_3',
        timestamp: '2026-09-17 11:50:42',
        user: '요리하는 소라',
        filename: 'shelf_scan_test.jpg',
        detected: '생와사비 튜브 (1개)',
        classifiedShelf: 'vege',
        correctShelf: 'sauce',
        status: 'misclassified',
        aiConfidence: '81.0%'
      }
    ];
    localStorage.setItem('kitchen_chef_admin_vision_logs', JSON.stringify(defaultLogs));
    return defaultLogs;
  }

  correctVisionShelf(logId, targetShelf) {
    const logs = this.loadVisionLogs();
    const item = logs.find(l => l.id === logId);
    if (!item) return null;
    const oldShelf = item.classifiedShelf;
    item.classifiedShelf = targetShelf;
    item.correctShelf = targetShelf;
    item.status = 'corrected';
    localStorage.setItem('kitchen_chef_admin_vision_logs', JSON.stringify(logs));
    this.addAuditLog('VISION', 'Vision AI 오분류 보관칸 수동 교정', `${item.detected} (${item.filename})`, `보관 선반 변경: ${oldShelf} -> ${targetShelf}`);
    fetch('/api/admin/vision/correct', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logId, shelf: targetShelf, adminName: this.currentUser?.name || '총괄 관리자' })
    }).catch(() => {});
    this.notify('VISION_LOGS_UPDATED', logs);
    return item;
  }

  // 4. 커뮤니티 및 콘텐츠 관리
  moderatePost(postId, action) {
    const post = this.posts.find(p => p.id === postId);
    if (!post) return null;
    if (action === 'hide') {
      post.status = 'hidden';
    } else if (action === 'restore') {
      post.status = 'published';
    } else if (action === 'toggle_best') {
      post.isBestKnowhow = !post.isBestKnowhow;
    } else if (action === 'delete') {
      post.status = 'deleted';
    }
    localStorage.setItem(STORAGE_KEYS.COMMUNITY_POSTS, JSON.stringify(this.posts));
    this.addAuditLog('COMMUNITY', `커뮤니티 콘텐츠 모더레이션 (${action})`, `작성자: ${post.author}, 레시피: ${post.recipeName}`, `게시글 상태 변경: ${action} 처리`);
    fetch('/api/admin/community/moderate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId, action, adminName: this.currentUser?.name || '총괄 관리자' })
    }).catch(() => {});
    this.notify('POST_UPDATED', post);
    return post;
  }

  // 5. AI 에이전트 자원 사용량 및 활동 통계
  getAgentStats() {
    return {
      totalUsers: this.loadAdminUsers().length,
      activeSessions: this.loadAdminUsers().filter(u => u.sessionValid).length,
      suspendedUsers: this.loadAdminUsers().filter(u => u.status === 'suspended').length,
      agentPipeline: {
        totalRuns: 48,
        successRate: '99.8%',
        avgResponseMs: 312,
        orchestratorState: 'ACTIVE_IDLE'
      },
      visionAi: {
        totalScans: 34,
        accuracy: '96.8%',
        model: 'gemini-3.6-flash / 멀티모달 OCR',
        avgLatency: '520ms'
      },
      agents: [
        { name: '1. Orchestrator', role: '파이프라인 총괄 조정', calls: 48, success: '100%', latency: '45ms', status: 'Optimal' },
        { name: '2. Vision Agent', role: '냉장고/영수증 멀티모달 OCR', calls: 34, success: '97.1%', latency: '520ms', status: 'Optimal' },
        { name: '3. Search Agent', role: '유튜브/웹 큐레이션 탐색', calls: 48, success: '100%', latency: '120ms', status: 'Optimal' },
        { name: '4. Quality Agent', role: 'agents.md 4대 기준 검증', calls: 48, success: '100%', latency: '60ms', status: 'Optimal' },
        { name: '5. Deduction Agent', role: '실시간 냉장고 재고 소진', calls: 29, success: '100%', latency: '18ms', status: 'Optimal' }
      ]
    };
  }

  // 6. 관리자 권한 및 감사 로그
  loadAuditLogs() {
    const raw = localStorage.getItem('kitchen_chef_admin_audit_logs');
    if (raw) {
      try { return JSON.parse(raw); } catch {}
    }
    const defaultLogs = [
      {
        id: 'audit_1',
        timestamp: '2026-09-17 12:45:10',
        admin: '총괄 관리자 (admin@kitchenchef.com)',
        category: 'SECURITY',
        action: '관리자 콘솔 초기화 및 보안 감사 규칙 로드',
        target: '시스템 전체',
        details: '6대 권한 관리 게이트웨이 및 세션 모니터링 엔진 가동'
      },
      {
        id: 'audit_2',
        timestamp: '2026-09-17 12:48:22',
        admin: '총괄 관리자 (admin@kitchenchef.com)',
        category: 'ACCOUNT',
        action: '불량 계정 일시 정지(Suspension)',
        target: 'user_spammer (spammer@baduser.com)',
        details: '커뮤니티 비방 댓글 및 도배 행위로 인한 7일 활동 정지 처분'
      }
    ];
    localStorage.setItem('kitchen_chef_admin_audit_logs', JSON.stringify(defaultLogs));
    return defaultLogs;
  }

  addAuditLog(category, action, target, details) {
    const logs = this.loadAuditLogs();
    const newLog = {
      id: 'audit_' + Date.now(),
      timestamp: new Date().toLocaleString('ko-KR', { hour12: false }),
      admin: `${this.currentUser?.name || '총괄 관리자'} (${this.currentUser?.email || 'admin@kitchenchef.com'})`,
      category,
      action,
      target,
      details
    };
    logs.unshift(newLog);
    localStorage.setItem('kitchen_chef_admin_audit_logs', JSON.stringify(logs));
    this.notify('AUDIT_LOG_ADDED', newLog);
    return newLog;
  }
}

export const store = new FridgeStore();

if (typeof window !== 'undefined') {
  window.store = store;
  window.FridgeStore = FridgeStore;
}

