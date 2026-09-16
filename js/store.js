// frontend/js/store.js
// 개인 냉장고 인벤토리 상태 관리, 실시간 재료 차감, 칭호 시스템, 사용자 레시피 및 커뮤니티 저장소

import { firebaseAdapter } from './firebase-config.js';

const STORAGE_KEYS = {
  CURRENT_USER: 'kitchen_chef_current_user',
  USERS_FRIDGE_PREFIX: 'kitchen_chef_fridge_',
  AUTO_DEDUCT: 'kitchen_chef_auto_deduct',
  ACTIVE_THEME: 'kitchen_chef_active_theme',
  CUSTOM_SEARCH_QUERY: 'kitchen_chef_custom_query',
  COMMUNITY_POSTS: 'kitchen_chef_community_posts',
  COOK_COMPLETED_IDS: 'kitchen_chef_completed_recipe_ids',
  COOK_COUNT: 'kitchen_chef_cook_count',
  USER_CUSTOM_RECIPES: 'kitchen_chef_user_recipes'
};

// 기본 샘플 사용자
export const DEFAULT_USER = {
  id: 'user_sora',
  name: '요리하는 소라',
  email: 'sora.kitchen@chef.kr',
  avatar: 'frontend/assets/images/icon.png',
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

  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  notify(event, payload) {
    this.subscribers.forEach(cb => cb(event, payload));
  }

  // 1. 사용자 관리 및 칭호(Title) 계산
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

  // 🌟 요구사항 9: 조리 완료 횟수에 따른 칭호 및 등급 시스템
  getUserTitleInfo() {
    const count = this.cookCount;
    if (count >= 6) {
      return { level: '마스터 셰프 Lv.4', title: '미슐랭 홈파티 장인', icon: '👑', nextRemaining: 0, progress: 100 };
    } else if (count >= 3) {
      return { level: '시니어 셰프 Lv.3', title: '냉파 마스터', icon: '🎖️', nextRemaining: 6 - count, progress: Math.round((count / 6) * 100) };
    } else if (count >= 1) {
      return { level: '주니어 셰프 Lv.2', title: '신선 재고 구출자', icon: '🌱', nextRemaining: 3 - count, progress: Math.round((count / 3) * 100) };
    } else {
      return { level: '초보 셰프 Lv.1', title: '주방의 호기심쟁이', icon: '🍳', nextRemaining: 1, progress: 0 };
    }
  }

  async login(email, name = '요리하는 소라', password = 'password123') {
    const res = await firebaseAdapter.signIn(email, password);
    this.currentUser = {
      id: res.uid,
      name: res.name || name,
      email: res.email || email,
      avatar: 'frontend/assets/images/icon.png',
      isLoggedIn: true
    };
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(this.currentUser));
    this.ingredients = this.loadIngredients();
    this.notify('USER_LOGIN', this.currentUser);
    return this.currentUser;
  }

  async register(email, password, name = '열정 셰프') {
    const res = await firebaseAdapter.signUp(email, password, name);
    this.currentUser = {
      id: res.uid,
      name: res.name,
      email: res.email,
      avatar: 'frontend/assets/images/icon.png',
      isLoggedIn: true
    };
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(this.currentUser));
    this.ingredients = this.loadIngredients();
    this.notify('USER_REGISTERED', this.currentUser);
    return this.currentUser;
  }

  logout() {
    this.currentUser = { ...DEFAULT_USER, isLoggedIn: false, name: '게스트 (체험 모드)' };
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(this.currentUser));
    this.notify('USER_LOGOUT', this.currentUser);
  }

  // 2. 냉장고 식재료 관리 (Firebase Cloud & LocalStorage)
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
    // Firebase 클라우드 DB 비동기 동기화
    if (this.currentUser && this.currentUser.id) {
      firebaseAdapter.syncFridgeToCloud(this.currentUser.id, list);
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

    let newCount = (Math.round((item.count + delta) * 10) / 10);
    if (newCount < 0) newCount = 0;
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

  addIngredient(name, count = 1, unit = '개', shelf = 'vege') {
    const cleanName = name.trim();
    if (!cleanName) return null;

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

  getCustomSearchQuery() {
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

  // 조회수와 추천수가 높은 댓글을 '베스트 노하우 댓글'로 선정
  evaluateBestKnowhow() {
    this.posts.forEach(p => {
      // 추천 30개 이상 또는 조회수 200 이상이면 베스트 노하우 댓글 선정
      p.isBestKnowhow = (p.likes >= 30 || (p.views || 0) >= 200);
    });
    // 정렬: 베스트 노하우 우선, 그 다음 추천수 내림차순
    this.posts.sort((a, b) => (b.isBestKnowhow ? 1 : 0) - (a.isBestKnowhow ? 1 : 0) || b.likes - a.likes);
  }
}

export const store = new FridgeStore();
