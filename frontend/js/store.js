// js/store.js
// 개인 냉장고 인벤토리 상태 관리 및 실시간 재료 차감(Deduction) 저장소

const STORAGE_KEYS = {
  CURRENT_USER: 'kitchen_chef_current_user',
  USERS_FRIDGE_PREFIX: 'kitchen_chef_fridge_',
  AUTO_DEDUCT: 'kitchen_chef_auto_deduct',
  ACTIVE_THEME: 'kitchen_chef_active_theme',
  COMMUNITY_POSTS: 'kitchen_chef_community_posts',
  COOK_HISTORY: 'kitchen_chef_cook_history'
};

// 기본 샘플 사용자
export const DEFAULT_USER = {
  id: 'user_sora',
  name: '요리하는 소라',
  level: '조리 마스터 Lv.2',
  email: 'sora.kitchen@chef.kr',
  avatar: 'images/icon.png',
  isLoggedIn: true
};

// 기본 냉장고 식재료 프리셋
const DEFAULT_INGREDIENTS = [
  // 1. 신선 채소 • 과일
  { id: 'ing_1', name: '대파', count: 2, unit: '대', shelf: 'vege', freshness: 'fresh', daysLeft: 6, selected: true },
  { id: 'ing_2', name: '양파', count: 1, unit: '개', shelf: 'vege', freshness: 'fresh', daysLeft: 8, selected: true },
  { id: 'ing_3', name: '애호박', count: 0.5, unit: '개', shelf: 'vege', freshness: 'expiring', daysLeft: 2, selected: false },
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

// 초기 커뮤니티 후기 목업
const DEFAULT_POSTS = [
  {
    id: 'post_1',
    author: '자취생민우',
    authorBadge: '완식14회차',
    tag: '파기름 장인',
    timeAgo: '12분 전',
    rating: 5.0,
    content: '대파를 약불에 오래 볶았더니 파기름 향이 진짜 식당 볶음밥 뺨쳐요! 자투리 양파 조금 추가했습니다. 레시피 타이머 가이드 덕분에 센 불 전환 타이밍을 놓치지 않아서 밥알이 한 알 한 알 코팅되듯이 살아있네요.',
    recipeName: '황금 대파 계란 볶음밥',
    chefTip: '양파 1/4개 잘게 썰어 추가 • 진간장 눌려 태우기 1스푼',
    likes: 34,
    comments: 5,
    image: 'images/ani.png',
    verified: true
  },
  {
    id: 'post_2',
    author: '건강식매니아',
    authorBadge: '클린식단 러버',
    tag: '현미밥 대체',
    timeAgo: '45분 전',
    rating: 5.0,
    content: '즉석밥 현미밥으로 바꿨는데도 고슬고슬 잘 볶아졌어요. 타이머 기능 덕분에 태우지 않고 12분 딱 맞춤! 올리브유 대신 아보카도 오일 1큰술 썼는데 향미가 아주 깔끔합니다. 다이어트 중인데 완식했습니다.',
    recipeName: '초간단 두부 계란 부침',
    chefTip: '올리브유 대신 아보카도 오일 사용',
    likes: 28,
    comments: 3,
    savedItem: '냉장고 구출: 대파 1줄기',
    verified: true
  },
  {
    id: 'post_3',
    author: '초보요리러',
    authorBadge: '첫 완식달성',
    tag: '핵심 팁 성공',
    timeAgo: '2시간 전',
    rating: 5.0,
    content: '계란 스크램블 80%만 익히고 밥 넣는 팁이 신의 한 수였습니다. 전에는 항상 퍽퍽했는데 진짜 부드러워요. 요리 초보인데 도마 스텝 가이드대로만 따라 하니까 성공했네요!',
    recipeName: '양파 듬뿍 스팸 마요 덮밥',
    likes: 19,
    cookingTime: '조리 소요: 11분',
    verified: true
  }
];

class FridgeStore {
  constructor() {
    this.currentUser = this.loadCurrentUser();
    this.ingredients = this.loadIngredients();
    this.autoDeductEnabled = this.loadAutoDeductSetting();
    this.activeTheme = localStorage.getItem(STORAGE_KEYS.ACTIVE_THEME) || 'korean_stew';
    this.posts = this.loadCommunityPosts();
    this.subscribers = [];
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

  // 사용자 관리
  loadCurrentUser() {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(DEFAULT_USER));
      return { ...DEFAULT_USER };
    }
    try {
      return JSON.parse(raw);
    } catch {
      return { ...DEFAULT_USER };
    }
  }

  setCurrentUser(user) {
    this.currentUser = user;
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    this.ingredients = this.loadIngredients();
    this.notify('USER_CHANGED', this.currentUser);
  }

  logout() {
    this.currentUser = { ...DEFAULT_USER, isLoggedIn: false, name: '게스트 (체험 모드)' };
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(this.currentUser));
    this.notify('USER_LOGOUT', this.currentUser);
  }

  login(email, name = '요리하는 소라') {
    this.currentUser = {
      id: 'user_' + Date.now(),
      name: name,
      level: '조리 마스터 Lv.2',
      email: email,
      avatar: 'images/icon.png',
      isLoggedIn: true
    };
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(this.currentUser));
    this.ingredients = this.loadIngredients();
    this.notify('USER_LOGIN', this.currentUser);
  }

  // 냉장고 식재료 관리
  getStorageKey() {
    return `${STORAGE_KEYS.USERS_FRIDGE_PREFIX}${this.currentUser.id || 'default'}`;
  }

  loadIngredients() {
    const raw = localStorage.getItem(this.getStorageKey());
    if (!raw) {
      this.saveIngredients(DEFAULT_INGREDIENTS);
      return JSON.parse(JSON.stringify(DEFAULT_INGREDIENTS));
    }
    try {
      return JSON.parse(raw);
    } catch {
      return JSON.parse(JSON.stringify(DEFAULT_INGREDIENTS));
    }
  }

  saveIngredients(list) {
    localStorage.setItem(this.getStorageKey(), JSON.stringify(list));
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

    let newCount = (Math.round((item.count + delta) * 10) / 10);
    if (newCount < 0) newCount = 0;
    item.count = newCount;
    if (item.count === 0) {
      item.selected = false;
    }
    this.saveIngredients(this.ingredients);
    this.notify('INGREDIENT_UPDATED', item);
  }

  toggleSelectIngredient(id) {
    const item = this.ingredients.find(i => i.id === id);
    if (!item) return;
    if (item.count <= 0) return; // 0개는 선택 불가
    item.selected = !item.selected;
    this.saveIngredients(this.ingredients);
    this.notify('INGREDIENT_TOGGLED', item);
  }

  toggleSelectAll(selectAll = true) {
    this.ingredients.forEach(i => {
      if (i.count > 0) {
        i.selected = selectAll;
      }
    });
    this.saveIngredients(this.ingredients);
    this.notify('INGREDIENTS_ALL_TOGGLED', selectAll);
  }

  addIngredient(name, count = 1, unit = '개', shelf = 'vege') {
    const cleanName = name.trim();
    if (!cleanName) return null;

    // 이미 존재하는지 확인
    const existing = this.ingredients.find(i => i.name.toLowerCase() === cleanName.toLowerCase());
    if (existing) {
      existing.count += Number(count);
      existing.selected = true;
      this.saveIngredients(this.ingredients);
      this.notify('INGREDIENT_ADDED', existing);
      return existing;
    }

    const newItem = {
      id: 'ing_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      name: cleanName,
      count: Number(count),
      unit: unit || '개',
      shelf: shelf || 'vege',
      freshness: 'fresh',
      daysLeft: 7,
      selected: true
    };
    this.ingredients.unshift(newItem);
    this.saveIngredients(this.ingredients);
    this.notify('INGREDIENT_ADDED', newItem);
    return newItem;
  }

  // 빈 냉장고 모드 전환
  resetToEmptyFridge() {
    this.ingredients = [];
    this.saveIngredients(this.ingredients);
    this.notify('FRIDGE_RESET', []);
  }

  // 기본 프리셋으로 복원
  restoreDefaultFridge() {
    this.ingredients = JSON.parse(JSON.stringify(DEFAULT_INGREDIENTS));
    this.saveIngredients(this.ingredients);
    this.notify('FRIDGE_RESTORED', this.ingredients);
  }

  // 자동 소진 설정
  loadAutoDeductSetting() {
    const raw = localStorage.getItem(STORAGE_KEYS.AUTO_DEDUCT);
    return raw === null ? true : raw === 'true';
  }

  setAutoDeduct(enabled) {
    this.autoDeductEnabled = !!enabled;
    localStorage.setItem(STORAGE_KEYS.AUTO_DEDUCT, String(this.autoDeductEnabled));
    this.notify('AUTO_DEDUCT_CHANGED', this.autoDeductEnabled);
  }

  // 테마 설정
  setActiveTheme(theme) {
    this.activeTheme = theme;
    localStorage.setItem(STORAGE_KEYS.ACTIVE_THEME, theme);
    this.notify('THEME_CHANGED', theme);
  }

  getActiveTheme() {
    return this.activeTheme;
  }

  // ⭐ 실시간 재료 차감 (Real-time Deduction)
  deductRecipeIngredients(recipe) {
    if (!recipe || !recipe.ingredients) return { deducted: [], depleted: [] };

    const deducted = [];
    const depleted = [];

    recipe.ingredients.forEach(req => {
      // 냉장고에서 일치하는 재료 탐색
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

    const result = { recipeTitle: recipe.title, deducted, depleted };
    this.notify('INGREDIENTS_DEDUCTED', result);
    return result;
  }

  // 커뮤니티 글 목록 및 등록
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
    const newPost = {
      id: 'post_' + Date.now(),
      author: this.currentUser.name || '요리하는 소라',
      authorBadge: '조리 마스터 Lv.2',
      tag: postData.tag || '나만의 비법',
      timeAgo: '방금 전',
      rating: postData.rating || 5.0,
      content: postData.content,
      recipeName: postData.recipeName,
      chefTip: postData.chefTip || '',
      likes: 1,
      comments: 0,
      verified: true
    };
    this.posts.unshift(newPost);
    localStorage.setItem(STORAGE_KEYS.COMMUNITY_POSTS, JSON.stringify(this.posts));
    this.notify('POST_ADDED', newPost);
    return newPost;
  }
}

export const store = new FridgeStore();
