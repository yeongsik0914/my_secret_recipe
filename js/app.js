// frontend/js/app.js
// 키친 셰프 (Kitchen Chef) 메인 애플리케이션 컨트롤러
// 12대 핵심 요구사항 (TTS, Firebase 어댑터, 칭호 티어, 조리 완료 잠금, 베스트 노하우 댓글 등) 완벽 통합

import { store } from './store.js';
import { harness } from './harness/agent-core.js';
import { visionAgent } from './harness/vision-agent.js';
import { searchAgent } from './harness/search-agent.js';
import { qualityGateAgent } from './harness/quality-agent.js';
import { RECIPES_DATA } from './recipes-data.js';

class KitchenChefApp {
  constructor() {
    this.currentView = 'view-main';
    this.activeRecipe = RECIPES_DATA[1]; // 기본 선택: 황금 대파계란 볶음밥
    this.currentRecipesList = [...RECIPES_DATA];
    this.matchFilter = 'all';
    this.isAnimationPlaying = false;
    this.soundEnabled = true;
    this.speechUtterance = null;
    this.ttsVoices = [];
    this.ttsQueue = [];
    this.isSpeaking = false;

    this.initAgents();
    this.initDOM();
    this.initTTS();
    this.bindEvents();
    this.renderAll();
  }

  // 1. 하네스 멀티 에이전트 초기화
  initAgents() {
    harness.registerAgent('VisionAgent', visionAgent);
    harness.registerAgent('SearchAgent', searchAgent);
    harness.registerAgent('QualityGateAgent', qualityGateAgent);

    // 하네스 로그 스트림 구독 -> 플로팅 콘솔에 실시간 출력
    harness.onLog((entry) => {
      this.appendHarnessLog(entry);
    });
  }

  // 1-1. Web Speech API 음성 합성 엔진 초기화
  initTTS() {
    if (!('speechSynthesis' in window)) return;

    const updateVoices = () => {
      this.ttsVoices = window.speechSynthesis.getVoices() || [];
    };

    updateVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }

  getKoreanVoice() {
    if (!('speechSynthesis' in window)) return null;
    if (!this.ttsVoices || this.ttsVoices.length === 0) {
      this.ttsVoices = window.speechSynthesis.getVoices() || [];
    }

    // 1. 한국어 전용 보이스 우선 검색
    const koVoice = this.ttsVoices.find(v => 
      v.lang === 'ko-KR' || v.lang === 'ko_KR' || v.lang === 'ko' ||
      v.name.includes('Korean') || v.name.includes('한국') ||
      v.name.includes('Yuna') || v.name.includes('Sora')
    );

    return koVoice || null;
  }

  // 2. DOM 요소 캐싱
  initDOM() {
    this.dom = {
      // 탭 네비게이션
      navTabs: document.querySelectorAll('.nav-tab-btn'),
      viewSections: document.querySelectorAll('.view-section'),
      brandHomeBtn: document.getElementById('brand-home-btn'),

      // 유저 프로필 & 칭호
      userProfileBtn: document.getElementById('user-profile-btn'),
      userNameDisplay: document.getElementById('user-name-display'),
      userLvlDisplay: document.getElementById('user-lvl-display'),

      // 메인 뷰 요소들
      totalInventoryCount: document.getElementById('total-inventory-count'),
      selectedIngredientsCount: document.getElementById('selected-ingredients-count'),
      shelfVege: document.getElementById('shelf-grid-vege'),
      shelfMeat: document.getElementById('shelf-grid-meat'),
      shelfDairy: document.getElementById('shelf-grid-dairy'),
      shelfSauce: document.getElementById('shelf-grid-sauce'),
      btnModeMyFridge: document.getElementById('btn-mode-my-fridge'),
      btnModeEmptyFridge: document.getElementById('btn-mode-empty-fridge'),
      btnRestoreDefaultFridge: document.getElementById('btn-restore-default-fridge'),
      btnToggleSelectAll: document.getElementById('btn-toggle-select-all'),

      // 원하는 메뉴/조리방식 직접 입력 (요구사항 3)
      inputCustomDish: document.getElementById('input-custom-dish'),
      btnApplyCustomDish: document.getElementById('btn-apply-custom-dish'),

      // 비전 및 수동 입력
      visionFileInput: document.getElementById('vision-file-input'),
      visionUploadArea: document.getElementById('vision-upload-area'),
      btnUploadCamera: document.getElementById('btn-upload-camera'),
      manualForm: document.getElementById('manual-ingredient-form'),
      manualName: document.getElementById('manual-name'),
      manualCount: document.getElementById('manual-count'),
      manualShelf: document.getElementById('manual-shelf'),

      // 테마 및 차감
      themeOptions: document.querySelectorAll('.theme-option'),
      toggleAutoDeduct: document.getElementById('toggle-auto-deduct'),
      btnTriggerSearch: document.getElementById('btn-trigger-recipe-search'),
      ctaRecipeCount: document.getElementById('cta-recipe-count'),

      // 오픈 애니메이션 뷰
      fridgeStage: document.getElementById('fridge-stage'),
      floatingLayer: document.getElementById('floating-ingredients-layer'),
      aniTimerText: document.getElementById('ani-timer-text'),
      timerProgressCircle: document.getElementById('timer-progress-circle'),
      procTitleText: document.getElementById('proc-title-text'),
      btnReplayAni: document.getElementById('btn-replay-animation'),
      btnGoRecipesNow: document.getElementById('btn-go-recipes-now'),
      btnSoundToggle: document.getElementById('btn-sound-toggle'),
      soundStatusText: document.getElementById('sound-status-text'),
      aniIngredientCountText: document.getElementById('ani-ingredient-count-text'),
      aniMetricDetected: document.getElementById('ani-metric-detected'),

      // 도마 레시피 목록 뷰
      recipesGrid: document.getElementById('recipes-grid-container'),
      recipesCountVal: document.getElementById('recipes-count-val'),
      recipesAvgMatch: document.getElementById('recipes-avg-match'),
      filterTotalCount: document.getElementById('filter-total-count'),
      recipeSelectedChips: document.getElementById('recipe-selected-chips-container'),
      btnEditIngredients: document.getElementById('btn-edit-ingredients'),
      btnSubFilters: document.querySelectorAll('.btn-filter-group .btn-sub-filter'),
      btnBannerMore: document.getElementById('btn-banner-more-ingredients'),
      btnOpenAddRecipeModal: document.getElementById('btn-open-add-recipe-modal'),

      // 도마 위 상세 조리 뷰
      detailCraftNo: document.getElementById('detail-craft-no'),
      detailRecipeTitle: document.getElementById('detail-recipe-title'),
      youtubeIframe: document.getElementById('youtube-iframe'),
      btnYoutubeLink: document.getElementById('btn-youtube-link'),
      detailChannelName: document.getElementById('detail-channel-name'),
      detailChannelStats: document.getElementById('detail-channel-stats'),
      detailMatchRatio: document.getElementById('detail-ingredient-match-ratio'),
      detailIngredientsList: document.getElementById('detail-ingredients-list'),
      detailStepsList: document.getElementById('detail-steps-list'),
      btnConfirmCooking: document.getElementById('btn-confirm-cooking-deduct'),
      btnBackToRecipes: document.getElementById('btn-back-to-recipes'),

      // TTS 음성 컨트롤 바 (요구사항 6)
      btnTtsAll: document.getElementById('btn-tts-all'),
      btnTtsStop: document.getElementById('btn-tts-stop'),
      ttsStatusBadge: document.getElementById('tts-status-badge'),

      // 완료 커뮤니티 뷰
      certRecipeTitle: document.getElementById('cert-recipe-title'),
      certRecipeThumb: document.getElementById('cert-recipe-thumb'),
      certTime: document.getElementById('cert-time'),
      certCalorie: document.getElementById('cert-calorie'),
      certUserTitle: document.getElementById('cert-user-title'),
      titleProgressFill: document.getElementById('title-progress-fill'),
      titleProgressText: document.getElementById('title-progress-text'),
      cookingLockBox: document.getElementById('cooking-lock-box'),
      btnGoCookCurrent: document.getElementById('btn-go-cook-current'),
      communityReviewForm: document.getElementById('community-review-form'),
      reviewContent: document.getElementById('review-content'),
      reviewChefTip: document.getElementById('review-chef-tip'),
      communityPostsList: document.getElementById('community-posts-list'),
      communityPostCount: document.getElementById('community-post-count'),

      // 나만의 레시피 등록 모달 (요구사항 10)
      modalAddRecipe: document.getElementById('modal-add-recipe'),
      btnCloseAddRecipeModal: document.getElementById('btn-close-add-recipe-modal'),
      btnCancelAddRecipe: document.getElementById('btn-cancel-add-recipe'),
      formUserRecipe: document.getElementById('form-user-recipe'),

      // 회원가입/로그인 모달 & 하네스 독
      signModal: document.getElementById('sign-modal-backdrop'),
      btnCloseSignModal: document.getElementById('btn-close-sign-modal'),
      tabModalLogin: document.getElementById('tab-modal-login'),
      tabModalSignup: document.getElementById('tab-modal-signup'),
      btnSubmitSign: document.getElementById('btn-submit-sign'),
      signEmail: document.getElementById('sign-email'),
      signPassword: document.getElementById('sign-password'),
      signName: document.getElementById('sign-name'),
      harnessDock: document.getElementById('harness-dock'),
      harnessDockHeader: document.getElementById('harness-dock-header'),
      harnessDockBody: document.getElementById('harness-dock-body'),
      harnessDockToggleIcon: document.getElementById('harness-dock-toggle-icon'),
      toastContainer: document.getElementById('toast-container')
    };
  }

  // 3. 이벤트 바인딩
  bindEvents() {
    // 탭 전환
    this.dom.navTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetView = tab.dataset.target;
        this.stopSpeech(); // 탭 이동 시 음성 안내 중지
        if (targetView === 'view-animation') {
          this.switchTab('view-animation');
          this.runForced2SecondAnimation();
        } else {
          this.switchTab(targetView);
        }
      });
    });

    if (this.dom.brandHomeBtn) {
      this.dom.brandHomeBtn.addEventListener('click', () => {
        this.stopSpeech();
        this.switchTab('view-main');
      });
    }

    // 개인 냉장고 모드 토글
    if (this.dom.btnModeMyFridge) {
      this.dom.btnModeMyFridge.addEventListener('click', () => {
        this.dom.btnModeMyFridge.classList.add('active');
        this.dom.btnModeEmptyFridge.classList.remove('active');
        store.restoreDefaultFridge();
        this.showToast('내 냉장고 재고 모드가 활성화되었습니다.');
      });
    }

    if (this.dom.btnModeEmptyFridge) {
      this.dom.btnModeEmptyFridge.addEventListener('click', () => {
        this.dom.btnModeEmptyFridge.classList.add('active');
        this.dom.btnModeMyFridge.classList.remove('active');
        store.resetToEmptyFridge();
        this.showToast('빈 냉장고 모드로 전환되었습니다. 사진이나 텍스트로 채워보세요!');
      });
    }

    if (this.dom.btnRestoreDefaultFridge) {
      this.dom.btnRestoreDefaultFridge.addEventListener('click', () => {
        store.restoreDefaultFridge();
        this.showToast('기본 식재료 프리셋이 복원되었습니다.');
      });
    }

    if (this.dom.btnToggleSelectAll) {
      this.dom.btnToggleSelectAll.addEventListener('click', () => {
        const selected = store.getSelectedIngredients();
        const allSelected = selected.length === store.getIngredients().filter(i => i.count > 0).length;
        store.toggleSelectAll(!allSelected);
      });
    }

    // 원하는 메뉴/조리방식 직접 입력 (요구사항 3)
    if (this.dom.btnApplyCustomDish && this.dom.inputCustomDish) {
      const applyCustomDish = () => {
        const query = this.dom.inputCustomDish.value.trim();
        store.setCustomQuery(query);
        if (query) {
          this.showToast(`🎯 메뉴/조리방식 필터 [${query}] 적용 완료!`);
        } else {
          this.showToast('전체 메뉴 모드로 초기화되었습니다.');
        }
        if (this.currentView === 'view-recipes') {
          this.renderRecipeCards();
        }
      };

      this.dom.btnApplyCustomDish.addEventListener('click', applyCustomDish);
      this.dom.inputCustomDish.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          applyCustomDish();
        }
      });
    }

    // 비전 이미지 업로드
    if (this.dom.btnUploadCamera) {
      this.dom.btnUploadCamera.addEventListener('click', () => {
        this.dom.visionFileInput.click();
      });
    }

    if (this.dom.visionFileInput) {
      this.dom.visionFileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
          this.showToast('📷 Vision Agent가 냉장고/영수증 이미지를 분석 중입니다...');
          await visionAgent.analyzeImage(file, store);
          this.showToast('✨ 식재료가 인식되어 개인 냉장고에 자동 등록되었습니다!');
        }
      });
    }

    // 드래그앤드롭 지원
    if (this.dom.visionUploadArea) {
      this.dom.visionUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        this.dom.visionUploadArea.style.borderColor = 'var(--green-deep)';
      });

      this.dom.visionUploadArea.addEventListener('dragleave', () => {
        this.dom.visionUploadArea.style.borderColor = '#e2d7c7';
      });

      this.dom.visionUploadArea.addEventListener('drop', async (e) => {
        e.preventDefault();
        this.dom.visionUploadArea.style.borderColor = '#e2d7c7';
        this.showToast('📷 Vision Agent가 영수증 이미지를 분석 중입니다...');
        await visionAgent.analyzeImage('sample_receipt', store);
        this.showToast('✨ 식재료가 인식되어 개인 냉장고에 자동 등록되었습니다!');
      });
    }

    // 직접 텍스트 입력
    if (this.dom.manualForm) {
      this.dom.manualForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = this.dom.manualName.value.trim();
        const count = this.dom.manualCount.value.trim() || '1';

        if (!name) return;

        visionAgent.parseNaturalText(`${name} ${count}`, store);
        this.dom.manualName.value = '';
        this.dom.manualCount.value = '';
        this.showToast(`✨ '${name}'이(가) 냉장고에 저장되었습니다.`);
      });
    }

    // 요리 테마 선택
    this.dom.themeOptions.forEach(opt => {
      opt.addEventListener('click', () => {
        this.dom.themeOptions.forEach(o => o.classList.remove('active'));
        opt.classList.add('active');
        const theme = opt.dataset.theme;
        store.setActiveTheme(theme);
        this.showToast(`요리 테마가 설정되었습니다.`);
      });
    });

    // 자동 소진 토글 스위치
    if (this.dom.toggleAutoDeduct) {
      this.dom.toggleAutoDeduct.addEventListener('change', (e) => {
        store.setAutoDeduct(e.target.checked);
        this.showToast(e.target.checked ? '식재료 실시간 자동 차감이 켜졌습니다.' : '식재료 자동 차감이 꺼졌습니다.');
      });
    }

    // 🚪 메인 CTA: [냉장고 문 열고 요리 찾기 ➔]
    if (this.dom.btnTriggerSearch) {
      this.dom.btnTriggerSearch.addEventListener('click', () => {
        const selected = store.getSelectedIngredients();
        if (selected.length === 0) {
          this.showToast('⚠️ 냉장고에서 최소 1개 이상의 식재료를 선택해주세요!');
          return;
        }
        this.switchTab('view-animation');
        this.runForced2SecondAnimation();
      });
    }

    // 애니메이션 뷰 컨트롤
    if (this.dom.btnReplayAni) {
      this.dom.btnReplayAni.addEventListener('click', () => {
        this.runForced2SecondAnimation();
      });
    }

    if (this.dom.btnGoRecipesNow) {
      this.dom.btnGoRecipesNow.addEventListener('click', () => {
        this.switchTab('view-recipes');
      });
    }

    if (this.dom.btnSoundToggle) {
      this.dom.btnSoundToggle.addEventListener('click', () => {
        this.soundEnabled = !this.soundEnabled;
        this.dom.soundStatusText.textContent = this.soundEnabled ? '사운드 효과 ON' : '사운드 효과 OFF';
        this.showToast(this.soundEnabled ? '사운드 효과가 켜졌습니다.' : '사운드 효과가 음소거되었습니다.');
      });
    }

    // 도마 레시피 뷰 필터 및 수정
    if (this.dom.btnEditIngredients) {
      this.dom.btnEditIngredients.addEventListener('click', () => {
        this.switchTab('view-main');
      });
    }

    if (this.dom.btnBannerMore) {
      this.dom.btnBannerMore.addEventListener('click', () => {
        this.switchTab('view-main');
      });
    }

    this.dom.btnSubFilters.forEach(btn => {
      btn.addEventListener('click', () => {
        this.dom.btnSubFilters.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.matchFilter = btn.dataset.match;
        this.renderRecipeCards();
      });
    });

    // 나만의 도마 레시피 등록 모달 오픈 (요구사항 10)
    if (this.dom.btnOpenAddRecipeModal) {
      this.dom.btnOpenAddRecipeModal.addEventListener('click', () => {
        this.openAddRecipeModal();
      });
    }

    if (this.dom.btnCloseAddRecipeModal) {
      this.dom.btnCloseAddRecipeModal.addEventListener('click', () => {
        this.closeAddRecipeModal();
      });
    }

    if (this.dom.btnCancelAddRecipe) {
      this.dom.btnCancelAddRecipe.addEventListener('click', () => {
        this.closeAddRecipeModal();
      });
    }

    if (this.dom.modalAddRecipe) {
      this.dom.modalAddRecipe.addEventListener('click', (e) => {
        if (e.target === this.dom.modalAddRecipe) {
          this.closeAddRecipeModal();
        }
      });
    }

    // 나만의 레시피 등록 폼 제출
    if (this.dom.formUserRecipe) {
      this.dom.formUserRecipe.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('user-recipe-title')?.value.trim();
        const category = document.getElementById('user-recipe-category')?.value.trim() || '홈메이드 한식';
        const timeMinutes = parseInt(document.getElementById('user-recipe-time')?.value.trim() || '15', 10);
        const calorie = parseInt(document.getElementById('user-recipe-calorie')?.value.trim() || '400', 10);
        const ingredientsRaw = document.getElementById('user-recipe-ingredients')?.value.trim();
        const stepsRaw = document.getElementById('user-recipe-steps')?.value.trim();
        const youtube = document.getElementById('user-recipe-youtube')?.value.trim() || '';
        const tip = document.getElementById('user-recipe-tip')?.value.trim() || '';

        if (!title || !ingredientsRaw || !stepsRaw) {
          this.showToast('⚠️ 레시피 제목, 재료, 조리 순서를 모두 입력해주세요.');
          return;
        }

        // 재료 파싱 (예: "스팸 1캔, 달걀 2알, 대파 1대")
        const ingredients = ingredientsRaw.split(/[,;\n]+/).map(item => {
          const parts = item.trim().split(/\s+/);
          const name = parts[0] || '재료';
          const matchNum = parts[1]?.match(/(\d+)/);
          const count = matchNum ? parseInt(matchNum[1], 10) : 1;
          const unit = parts[1]?.replace(/\d+/, '') || '개';
          return { name, need: count, unit, match: true };
        }).filter(i => i.name);

        // 순서 파싱 (줄바꿈 기준)
        const steps = stepsRaw.split('\n').filter(s => s.trim()).map((desc, idx) => ({
          step: idx + 1,
          title: `Step ${idx + 1}.`,
          desc: desc.trim(),
          time: '3분'
        }));

        const newRecipe = store.addUserRecipe({
          title,
          subTitle: category,
          timeMinutes,
          calorie,
          difficulty: '쉬움',
          description: tip ? `셰프 꿀팁: ${tip}` : '사용자가 직접 공유한 정성 가득 집밥 레시피',
          youtube: {
            channel: `${store.currentUser.name}의 홈키친`,
            subscribers: '12만명',
            views: '35만회',
            embedId: youtube || '06Z_h2a0r_Q'
          },
          ingredients,
          steps
        });

        this.closeAddRecipeModal();
        this.dom.formUserRecipe.reset();
        this.showToast(`✨ 나만의 레시피 [${newRecipe.title}] 등록 및 공유 완료!`);

        // 레시피 목록 갱신
        this.renderRecipeCards();
      });
    }

    // 상세 조리 뷰 컨트롤
    if (this.dom.btnBackToRecipes) {
      this.dom.btnBackToRecipes.addEventListener('click', () => {
        this.stopSpeech();
        this.switchTab('view-recipes');
      });
    }

    // 음성 조리 가이드 (Web Speech API TTS) (요구사항 6)
    if (this.dom.btnTtsAll) {
      this.dom.btnTtsAll.addEventListener('click', () => {
        this.speakEntireRecipe();
      });
    }

    if (this.dom.btnTtsStop) {
      this.dom.btnTtsStop.addEventListener('click', () => {
        this.stopSpeech();
        this.showToast('음성 조리 안내를 정지했습니다.');
      });
    }

    // 🍽️ 핵심: [조리 완료 및 냉장고 재료 소진하기]
    if (this.dom.btnConfirmCooking) {
      this.dom.btnConfirmCooking.addEventListener('click', () => {
        this.stopSpeech();
        this.completeCookingAndDeduct();
      });
    }

    // 잠금 박스 내 [이 레시피 조리하러 가기] 버튼
    if (this.dom.btnGoCookCurrent) {
      this.dom.btnGoCookCurrent.addEventListener('click', () => {
        this.openRecipeDetail(this.activeRecipe);
      });
    }

    // 커뮤니티 후기 등록
    if (this.dom.communityReviewForm) {
      this.dom.communityReviewForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // 락 검증: 조리 완료한 사용자만 후기 등록 가능 (요구사항 7)
        if (!store.hasCompletedRecipe(this.activeRecipe.id)) {
          this.showToast('⚠️ 레시피를 완식(조리 완료)하신 셰프님만 후기를 등록할 수 있습니다!');
          return;
        }

        const content = this.dom.reviewContent.value.trim();
        const chefTip = this.dom.reviewChefTip.value.trim();
        if (!content) return;

        store.addCommunityPost({
          content,
          chefTip,
          recipeName: this.activeRecipe.title,
          rating: 5.0,
          tag: '나만의 완식 비법'
        });

        this.dom.reviewContent.value = '';
        this.dom.reviewChefTip.value = '';
        this.showToast('🎉 나만의 도마 완식 후기가 성공적으로 등록되었습니다!');
      });
    }

    // 회원가입/로그인 모달
    if (this.dom.userProfileBtn) {
      this.dom.userProfileBtn.addEventListener('click', () => {
        this.openSignModal();
      });
    }

    if (this.dom.btnCloseSignModal) {
      this.dom.btnCloseSignModal.addEventListener('click', () => {
        this.closeSignModal();
      });
    }

    if (this.dom.signModal) {
      this.dom.signModal.addEventListener('click', (e) => {
        if (e.target === this.dom.signModal) {
          this.closeSignModal();
        }
      });
    }

    if (this.dom.tabModalLogin && this.dom.tabModalSignup) {
      this.dom.tabModalLogin.addEventListener('click', () => {
        this.dom.tabModalLogin.classList.add('active');
        this.dom.tabModalSignup.classList.remove('active');
        this.dom.btnSubmitSign.textContent = '키친 셰프 로그인 🥢';
      });

      this.dom.tabModalSignup.addEventListener('click', () => {
        this.dom.tabModalSignup.classList.add('active');
        this.dom.tabModalLogin.classList.remove('active');
        this.dom.btnSubmitSign.textContent = '회원가입 완료 및 냉장고 생성 🎁';
      });
    }

    if (this.dom.btnSubmitSign) {
      this.dom.btnSubmitSign.addEventListener('click', async () => {
        const email = this.dom.signEmail?.value.trim() || 'chef@sora.kitchen';
        const isSignup = this.dom.tabModalSignup?.classList.contains('active');

        if (isSignup) {
          const name = this.dom.signName?.value.trim() || '요리하는 소라';
          await store.registerUser(email, name);
          this.showToast(`🎉 Firebase 회원가입 완료! [${name}] 셰프의 전용 냉장고가 생성되었습니다.`);
        } else {
          await store.login(email, '요리하는 소라');
          this.showToast('셰프 계정으로 로그인되어 개인 냉장고가 연결되었습니다!');
        }

        this.closeSignModal();
      });
    }

    // 하네스 독 토글
    if (this.dom.harnessDockHeader) {
      this.dom.harnessDockHeader.addEventListener('click', () => {
        this.dom.harnessDock.classList.toggle('collapsed');
        const isCollapsed = this.dom.harnessDock.classList.contains('collapsed');
        this.dom.harnessDockToggleIcon.textContent = isCollapsed ? '▲ 확장' : '▼ 축소';
      });
    }

    // 스토어 이벤트 구독
    store.subscribe((event, payload) => {
      this.renderFridge();
      this.renderUser();
      if (event === 'POST_ADDED' || event === 'POST_LIKED') {
        this.renderCommunityPosts();
      }
      if (event === 'RECIPE_ADDED' || event === 'CUSTOM_QUERY_CHANGED') {
        this.renderRecipeCards();
      }
    });
  }

  // 4. 화면 탭 전환
  switchTab(viewId) {
    this.currentView = viewId;

    this.dom.navTabs.forEach(tab => {
      if (tab.dataset.target === viewId) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    this.dom.viewSections.forEach(section => {
      if (section.id === viewId) {
        section.classList.add('active');
      } else {
        section.classList.remove('active');
      }
    });

    // 뷰 진입 시 특화 렌더링
    if (viewId === 'view-community') {
      this.updateCommunityLockState();
      this.renderCommunityPosts();
    } else if (viewId === 'view-recipes') {
      this.renderRecipeCards();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // 5. ⭐ 2초 강제 냉장고 문 열림 & 재료 추출 3D 애니메이션 오케스트레이션
  async runForced2SecondAnimation() {
    if (this.isAnimationPlaying) return;
    this.isAnimationPlaying = true;

    const selected = store.getSelectedIngredients();
    this.dom.aniIngredientCountText.textContent = selected.length || 6;
    this.dom.aniMetricDetected.textContent = `${selected.length || 6}개 재료 준비됨`;

    // 3D 냉장고 닫힘 상태로 초기화 후 오픈
    this.dom.fridgeStage.classList.remove('open');
    void this.dom.fridgeStage.offsetWidth; // Force Reflow

    // 부유할 식재료 뱃지들 렌더링
    const displayIngredients = selected.length > 0 ? selected : [
      { name: '달걀' }, { name: '스팸' }, { name: '김치' },
      { name: '양파' }, { name: '대파' }, { name: '두부' }
    ];

    this.dom.floatingLayer.innerHTML = displayIngredients.slice(0, 6).map((item, idx) => {
      const emoji = this.getFoodEmoji(item.name);
      return `<div class="floating-food-item">${emoji} ${item.name}</div>`;
    }).join('');

    // 냉장고 문 활짝 열림!
    setTimeout(() => {
      this.dom.fridgeStage.classList.add('open');
    }, 50);

    // 하네스 멀티 에이전트 파이프라인 가동 로그
    harness.addLog('ANIMATION', '2초 냉장고 개방 & 재료 추출 모션 시작', '양문형 도어 오픈 및 신선도 조명 활성화', 'info');
    harness.setPipelineState('ANIMATING', { duration: 2000 });

    // 비동기 레시피 검색 및 품질 검증 에이전트 병렬 가동 (사용자 검색어 및 공유 레시피 결합)
    const theme = store.getActiveTheme();
    const customQuery = store.customQuery;
    const searchPromise = searchAgent.searchRecipes({ selectedIngredients: selected, theme, customQuery });
    const verifyPromise = searchPromise.then(candidates => qualityGateAgent.verifyRecipes(candidates));

    // 2.0초 강제 타이머 카운트업 (0.0s -> 2.0s)
    const startTime = performance.now();
    const duration = 2000;
    const maxOffset = 163; // 2 * PI * 26

    const updateTimer = (now) => {
      const elapsed = Math.min(duration, now - startTime);
      const progress = elapsed / duration;
      const currentSeconds = (elapsed / 1000).toFixed(1);

      this.dom.aniTimerText.textContent = `${currentSeconds}s`;
      this.dom.timerProgressCircle.style.strokeDashoffset = maxOffset - (maxOffset * progress);

      if (elapsed < duration) {
        requestAnimationFrame(updateTimer);
      } else {
        // 2.0초 강제 완료!
        this.dom.aniTimerText.textContent = '2.0s';
        this.dom.timerProgressCircle.style.strokeDashoffset = '0';
        this.dom.procTitleText.textContent = '도마 위 레시피 차림 완성!';

        harness.addLog('ANIMATION', '2초 냉장고 오픈 시퀀스 완료', '도마 레시피 카탈로그 화면으로 전환합니다.', 'success');

        // 검증 완료된 레시피 목록 갱신
        verifyPromise.then(verified => {
          this.currentRecipesList = verified;
          this.renderRecipeCards();
          this.isAnimationPlaying = false;

          // 부드러운 화면 전환 (350ms 지연)
          setTimeout(() => {
            this.switchTab('view-recipes');
          }, 350);
        });
      }
    };

    requestAnimationFrame(updateTimer);
  }

  // 6. 도마 레시피 목록 렌더링 (중복 추천 및 사용자 공유 레시피 포함)
  renderRecipeCards() {
    let list = this.currentRecipesList;

    // 사용자 쿼리가 설정되어 있는 경우 필터링 지원
    if (store.customQuery) {
      const q = store.customQuery.toLowerCase();
      const filtered = list.filter(r => 
        r.title.toLowerCase().includes(q) || 
        r.subTitle.toLowerCase().includes(q) ||
        r.ingredients.some(i => i.name.toLowerCase().includes(q))
      );
      if (filtered.length > 0) {
        list = filtered;
      }
    }

    // 필터링 (95% 이상, 90% 이상)
    if (this.matchFilter === '95') {
      list = list.filter(r => r.matchRate >= 95);
    } else if (this.matchFilter === '90') {
      list = list.filter(r => r.matchRate >= 90);
    }

    this.dom.recipesCountVal.textContent = list.length;
    this.dom.filterTotalCount.textContent = this.currentRecipesList.length;

    // 평균 일치율 계산
    const avg = list.length > 0 
      ? (list.reduce((acc, r) => acc + (r.matchRate || 85), 0) / list.length).toFixed(1)
      : 0;
    this.dom.recipesAvgMatch.textContent = avg;

    // 상단 선택된 재료 칩 렌더링
    const selected = store.getSelectedIngredients();
    this.dom.recipeSelectedChips.innerHTML = selected.map(item => `
      <span class="filter-chip">${this.getFoodEmoji(item.name)} ${item.name}</span>
    `).join('');

    // 레시피 카드 그리드 HTML 렌더링
    this.dom.recipesGrid.innerHTML = list.map(recipe => {
      const isUserRecipe = recipe.isUserRecipe || false;
      return `
        <article class="recipe-card ${isUserRecipe ? 'user-shared-card' : ''}" data-id="${recipe.id}">
          <div class="craft-badge-bar">
            <span>${recipe.craftNo}</span>
            ${isUserRecipe ? '<span style="color: var(--gold); font-weight: 800;">[셰프 공유]</span>' : '<span>★</span>'}
          </div>

          <div class="recipe-thumb-box">
            <img src="frontend/assets/images/recipe%20.png" onerror="this.onerror=null; this.src='images/recipe%20.png'; if(!this.complete) this.src='../assets/images/recipe%20.png';" alt="${recipe.title}" class="recipe-thumb-img" style="object-position: center;">
            <div class="match-rate-pill">
              ★ 재료 일치 ${recipe.matchRate}%
            </div>
            <div class="recipe-time-difficulty">
              <span>⏱ ${recipe.timeMinutes}분</span>
              <span>•</span>
              <span>${recipe.difficulty}</span>
            </div>
          </div>

          <div class="recipe-content">
            <div class="recipe-meta-row">
              <span class="recipe-sub-category">${recipe.subTitle}</span>
              <span class="recipe-rating">★ ${recipe.rating} (${recipe.reviewCount})</span>
            </div>

            <h3 class="recipe-title">${recipe.title}</h3>
            <p class="recipe-desc">${recipe.description}</p>

            <div class="cutting-board-match-box">
              <div class="match-box-title">
                <span>도마 위 식재료 매칭</span>
                <span style="color: var(--green-accent); font-weight: bold;">${recipe.ingredients.filter(i => i.match).length}/${recipe.ingredients.length} 매칭</span>
              </div>
              <div class="matching-tags">
                ${recipe.ingredients.map(ing => `
                  <span class="tag-ingredient ${ing.match ? 'matched' : ''}">
                    ${ing.match ? '✓ ' : ''}${ing.name}
                  </span>
                `).join('')}
              </div>
            </div>

            <button class="btn-cook-recipe btn-select-cook" data-id="${recipe.id}">
              <span>🥢 레시피 조리하기</span>
            </button>
          </div>
        </article>
      `;
    }).join('');

    // 카드 내부 [레시피 조리하기] 버튼 클릭 바인딩
    this.dom.recipesGrid.querySelectorAll('.btn-select-cook').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const recipeId = e.currentTarget.dataset.id;
        const target = this.currentRecipesList.find(r => r.id === recipeId) || RECIPES_DATA[0];
        this.openRecipeDetail(target);
      });
    });
  }

  // 7. 도마 위 상세 조리 화면 바인딩
  openRecipeDetail(recipe) {
    this.activeRecipe = recipe;

    this.dom.detailCraftNo.textContent = recipe.craftNo;
    this.dom.detailRecipeTitle.textContent = recipe.title;
    this.dom.detailChannelName.textContent = recipe.youtube.channel;
    this.dom.detailChannelStats.textContent = `구독자 ${recipe.youtube.subscribers} • 조회수 ${recipe.youtube.views}`;
    
    // YouTube 임베드 URL (실제 유효 ID 및 안전한 임베드 파라미터 적용)
    this.dom.youtubeIframe.src = `https://www.youtube.com/embed/${recipe.youtube.embedId}?autoplay=0&rel=0&enablejsapi=1`;
    
    // YouTube 원본 영상 새 창 바로가기 버튼 동기화
    if (this.dom.btnYoutubeLink) {
      this.dom.btnYoutubeLink.href = recipe.youtube.url;
      this.dom.btnYoutubeLink.innerHTML = `▶️ [${recipe.youtube.channel}] 유튜브 원본 영상 새 창으로 시청하기 ➔`;
    }

    this.dom.detailMatchRatio.textContent = `일치율 ${recipe.matchRate}%`;

    // 식재료 태그 목록
    this.dom.detailIngredientsList.innerHTML = recipe.ingredients.map(ing => `
      <span class="tag-ingredient ${ing.match ? 'matched' : ''}">
        ${ing.match ? '✓ ' : ''}${ing.name} (${ing.need}${ing.unit})
      </span>
    `).join('');

    // 순서별 조리 가이드 (텍스트 + 각 스텝별 TTS 음성 버튼 포함 - 요구사항 6)
    this.dom.detailStepsList.innerHTML = recipe.steps.map(s => `
      <div class="step-item" id="step-item-${s.step}">
        <div class="step-num">${s.step}</div>
        <div class="step-body">
          <div class="step-title-row">
            <span class="step-title">${s.title}</span>
            <div style="display: flex; gap: 0.5rem; align-items: center;">
              <span class="step-time">⏱ ${s.time}</span>
              <button type="button" class="btn-step-tts" data-step="${s.step}" title="이 단계 음성으로 듣기">
                🔊 듣기
              </button>
            </div>
          </div>
          <p class="step-desc">${s.desc}</p>
        </div>
      </div>
    `).join('');

    // 스텝별 TTS 개별 재생 버튼 이벤트 바인딩
    this.dom.detailStepsList.querySelectorAll('.btn-step-tts').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const stepNum = parseInt(btn.dataset.step, 10);
        const stepData = recipe.steps.find(s => s.step === stepNum);
        if (stepData) {
          this.highlightStep(stepNum);
          const readText = `${stepData.title}. ${stepData.desc}`;
          this.speakText(readText, () => {
            this.clearStepHighlights();
          });
        }
      });
    });

    this.switchTab('view-detail');
  }

  // 7-1. 전체 조리 레시피 순차 낭독 (Web Speech API TTS 문장 큐 엔진 - 요구사항 6)
  speakEntireRecipe() {
    if (!this.activeRecipe) return;

    this.stopSpeech();
    this.isSpeaking = true;

    if (this.dom.ttsStatusBadge) {
      this.dom.ttsStatusBadge.textContent = '🔊 전체 조리 음성 준비 중...';
      this.dom.ttsStatusBadge.style.background = '#dcfce7';
      this.dom.ttsStatusBadge.style.color = '#15803d';
    }

    // 단계별 시퀀스 생성: 인트로 -> 각 스텝(스텝별 하이라이트 연동) -> 아웃트로
    const sequence = [];

    // 1) 인트로
    sequence.push({
      text: `지금부터 ${this.activeRecipe.title} 조리를 시작하겠습니다. 소요 시간은 약 ${this.activeRecipe.timeMinutes}분입니다. 필요한 주재료는 ${this.activeRecipe.ingredients.map(i => i.name).join(', ')} 입니다.`,
      stepNum: null
    });

    // 2) 단계별 스텝
    this.activeRecipe.steps.forEach(s => {
      sequence.push({
        text: `${s.title}. ${s.desc}`,
        stepNum: s.step
      });
    });

    // 3) 아웃트로
    sequence.push({
      text: `모든 조리 과정이 끝났습니다. 도마 위에서 따뜻하게 플레이팅하여 맛있게 즐겨보세요!`,
      stepNum: null
    });

    let seqIndex = 0;

    const playNextStepInSequence = () => {
      if (!this.isSpeaking || seqIndex >= sequence.length) {
        this.isSpeaking = false;
        this.clearStepHighlights();
        if (this.dom.ttsStatusBadge) {
          this.dom.ttsStatusBadge.textContent = '낭독 완료';
          this.dom.ttsStatusBadge.style.background = '#fef3c7';
          this.dom.ttsStatusBadge.style.color = '#b45309';
        }
        return;
      }

      const item = sequence[seqIndex];
      seqIndex++;

      if (item.stepNum) {
        this.highlightStep(item.stepNum);
      } else {
        this.clearStepHighlights();
      }

      this.speakText(item.text, () => {
        setTimeout(playNextStepInSequence, 300);
      });
    };

    playNextStepInSequence();
  }

  // 문장 큐 기반 안정적 음성 합성 (브라우저 버퍼 끊김 및 paused 버그 완벽 방지)
  speakText(text, onComplete) {
    if (!('speechSynthesis' in window)) {
      this.showToast('이 브라우저는 음성 낭독(TTS)을 지원하지 않습니다.');
      if (onComplete) onComplete();
      return;
    }

    // 마침표, 느낌표, 물음표, 개행 기준으로 문장 쪼개기
    const sentences = text
      .split(/(?<=[.!?\n])\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (sentences.length === 0) {
      if (onComplete) onComplete();
      return;
    }

    let sentenceIndex = 0;

    const playSentence = () => {
      if (!this.isSpeaking && sentenceIndex > 0) {
        if (onComplete) onComplete();
        return;
      }

      if (sentenceIndex >= sentences.length) {
        if (onComplete) onComplete();
        return;
      }

      const curText = sentences[sentenceIndex];
      sentenceIndex++;

      const utterance = new SpeechSynthesisUtterance(curText);
      utterance.lang = 'ko-KR';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      const koVoice = this.getKoreanVoice();
      if (koVoice) {
        utterance.voice = koVoice;
      }

      utterance.onstart = () => {
        if (this.dom.ttsStatusBadge) {
          this.dom.ttsStatusBadge.textContent = '🔊 조리 음성 낭독 중...';
          this.dom.ttsStatusBadge.style.background = '#dcfce7';
          this.dom.ttsStatusBadge.style.color = '#15803d';
        }
      };

      utterance.onend = () => {
        setTimeout(playSentence, 120);
      };

      utterance.onerror = (err) => {
        console.warn('SpeechSynthesis error:', err);
        setTimeout(playSentence, 100);
      };

      this.speechUtterance = utterance;

      // 크롬/사파리 일시 정지 상태 강제 해제 후 재생
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      window.speechSynthesis.speak(utterance);
    };

    // 브라우저 큐 락 해제
    window.speechSynthesis.resume();
    playSentence();
  }

  // 스텝 하이라이트 제어
  highlightStep(stepNum) {
    this.clearStepHighlights();
    const target = document.getElementById(`step-item-${stepNum}`);
    if (target) {
      target.classList.add('active-speaking');
      target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  clearStepHighlights() {
    document.querySelectorAll('.step-item').forEach(el => el.classList.remove('active-speaking'));
  }

  stopSpeech() {
    this.isSpeaking = false;
    this.ttsQueue = [];
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    }
    this.clearStepHighlights();
    if (this.dom.ttsStatusBadge) {
      this.dom.ttsStatusBadge.textContent = '정지됨';
      this.dom.ttsStatusBadge.style.background = '#f1f5f9';
      this.dom.ttsStatusBadge.style.color = '#64748b';
    }
  }

  // 8. ⭐ 조리 완료 및 냉장고 식재료 실시간 자동 소진 (Deduction) & 칭호/락 갱신
  completeCookingAndDeduct() {
    harness.setPipelineState('DEDUCTING', { recipe: this.activeRecipe.title });
    harness.addLog('DEDUCTION', `조리 완료: [${this.activeRecipe.title}]`, '냉장고 재고 실시간 차감 파이프라인 가동', 'info');

    // 스토어에서 식재료 실시간 차감 및 완식 레시피 ID 등록 실행 (요구사항 7 & 9 & 12)
    const result = store.deductRecipeIngredients(this.activeRecipe);

    let toastMsg = `🍽️ [${this.activeRecipe.title}] 조리 완료! `;
    if (result.deducted.length > 0) {
      toastMsg += `${result.deducted.map(d => `${d.name} -${d.deducted}${d.unit}`).join(', ')} 소진되었습니다.`;
    }
    if (result.depleted.length > 0) {
      toastMsg += ` (⚠️ ${result.depleted.join(', ')} 완전 소진)`;
    }

    this.showToast(toastMsg);
    harness.addLog('DEDUCTION', '냉장고 재고 차감 및 완식 언락 완료', JSON.stringify(result.deducted), 'success');

    // 커뮤니티 완료 뷰 준비
    this.dom.certRecipeTitle.textContent = this.activeRecipe.title;
    this.dom.certTime.textContent = `소요 시간 ${this.activeRecipe.timeMinutes}분`;
    this.dom.certCalorie.textContent = `약 ${this.activeRecipe.calorie} kcal`;

    this.switchTab('view-community');
  }

  // 8-1. 커뮤니티 락/언락 상태 갱신 (요구사항 7)
  updateCommunityLockState() {
    if (!this.activeRecipe) return;

    const hasCompleted = store.hasCompletedRecipe(this.activeRecipe.id);

    if (hasCompleted) {
      if (this.dom.cookingLockBox) this.dom.cookingLockBox.style.display = 'none';
      if (this.dom.communityReviewForm) this.dom.communityReviewForm.style.display = 'block';
    } else {
      if (this.dom.cookingLockBox) this.dom.cookingLockBox.style.display = 'block';
      if (this.dom.communityReviewForm) this.dom.communityReviewForm.style.display = 'none';
    }
  }

  // 9. 개인 냉장고 선반 렌더링
  renderFridge() {
    const ingredients = store.getIngredients();
    const selected = store.getSelectedIngredients();

    this.dom.totalInventoryCount.textContent = ingredients.filter(i => i.count > 0).length;
    this.dom.selectedIngredientsCount.textContent = selected.length;
    this.dom.ctaRecipeCount.textContent = Math.max(3, selected.length);

    // 선반별 분류
    const shelves = {
      vege: ingredients.filter(i => i.shelf === 'vege'),
      meat: ingredients.filter(i => i.shelf === 'meat'),
      dairy: ingredients.filter(i => i.shelf === 'dairy'),
      sauce: ingredients.filter(i => i.shelf === 'sauce')
    };

    const renderShelfItems = (container, list) => {
      if (list.length === 0) {
        container.innerHTML = `<div style="font-size: 0.76rem; color: var(--text-subtle); padding: 0.5rem;">보관된 재료가 없습니다.</div>`;
        return;
      }
      container.innerHTML = list.map(item => `
        <div class="ing-chip ${item.selected ? 'selected' : ''}" data-id="${item.id}">
          <div class="ing-top-row">
            <span class="ing-name">${item.name}</span>
            <div class="ing-checkbox"></div>
          </div>
          <div class="ing-count-row">
            <span>잔여: <strong>${item.count}${item.unit}</strong></span>
            <div style="display: flex; gap: 3px;" onclick="event.stopPropagation()">
              <button class="btn-counter btn-minus" data-id="${item.id}">-</button>
              <button class="btn-counter btn-plus" data-id="${item.id}">+</button>
            </div>
          </div>
        </div>
      `).join('');
    };

    renderShelfItems(this.dom.shelfVege, shelves.vege);
    renderShelfItems(this.dom.shelfMeat, shelves.meat);
    renderShelfItems(this.dom.shelfDairy, shelves.dairy);
    renderShelfItems(this.dom.shelfSauce, shelves.sauce);

    // 이벤트 바인딩: 칩 클릭(선택 토글) 및 +/- 버튼
    document.querySelectorAll('.ing-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const id = chip.dataset.id;
        store.toggleSelectIngredient(id);
      });
    });

    document.querySelectorAll('.btn-minus').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        store.updateIngredientCount(id, -1);
      });
    });

    document.querySelectorAll('.btn-plus').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        store.updateIngredientCount(id, 1);
      });
    });
  }

  // 10. 커뮤니티 후기 렌더링 & 베스트 노하우 댓글 / 추천수 / 조회수 (요구사항 8)
  renderCommunityPosts() {
    store.evaluateBestKnowhow(); // 베스트 노하우 자동 선정
    const posts = store.posts;
    this.dom.communityPostCount.textContent = posts.length;

    this.dom.communityPostsList.innerHTML = posts.map(post => `
      <div class="post-card ${post.isBestKnowhow ? 'best-knowhow-card' : ''}" data-id="${post.id}">
        <div class="post-header">
          <div class="post-author-row">
            <span class="post-author-name">${post.author}</span>
            <span class="badge-ai" style="background: #f1f5f9; color: #475569;">${post.authorBadge}</span>
            <span class="badge-ai" style="background: #fef3c7; color: #b45309;">${post.tag}</span>
            ${post.isBestKnowhow ? '<span class="badge-best-knowhow">👑 [베스트 노하우 댓글]</span>' : ''}
          </div>
          <span class="post-time">${post.timeAgo} • ★★★★★</span>
        </div>

        <p class="post-body-text">${post.content}</p>

        ${post.chefTip ? `<div class="post-chef-tip">👨‍🍳 셰프 추가 팁: ${post.chefTip}</div>` : ''}

        <div class="post-footer-actions">
          <div style="display: flex; gap: 0.8rem; align-items: center;">
            <button class="btn-like-post" data-id="${post.id}" title="이 노하우 댓글 추천하기">
              👍 추천 <strong>${post.likes}</strong>
            </button>
            <span style="font-size: 0.78rem; color: var(--text-subtle);">💬 댓글 ${post.comments}</span>
            <span style="font-size: 0.78rem; color: var(--text-subtle);">👀 조회 ${post.views || 0}</span>
          </div>
          <span style="color: var(--green-accent); font-weight: 700;">✓ 완식 인증 완료</span>
        </div>
      </div>
    `).join('');

    // 추천 버튼 클릭 이벤트 바인딩
    this.dom.communityPostsList.querySelectorAll('.btn-like-post').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const newLikes = store.likePost(id);
        this.showToast(`👍 노하우 댓글을 추천했습니다! (총 ${newLikes}회 추천)`);
      });
    });

    // 포스트 카드 클릭 시 조회수 증가
    this.dom.communityPostsList.querySelectorAll('.post-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.dataset.id;
        store.viewPost(id);
      });
    });
  }

  // 11. 유저 정보 & 칭호 진행도 렌더링 (요구사항 9)
  renderUser() {
    const user = store.currentUser;
    const titleInfo = store.getUserTitleInfo();

    this.dom.userNameDisplay.textContent = user.name;
    this.dom.userLvlDisplay.textContent = `${titleInfo.tier} (${titleInfo.level})`;

    // 완식 인증서 영역 칭호 및 프로그레스 바
    if (this.dom.certUserTitle) {
      this.dom.certUserTitle.textContent = `${titleInfo.tier} • ${titleInfo.desc}`;
    }
    if (this.dom.titleProgressFill) {
      this.dom.titleProgressFill.style.width = `${titleInfo.progress}%`;
    }
    if (this.dom.titleProgressText) {
      this.dom.titleProgressText.textContent = `완식 ${titleInfo.completedCount}회 달성 (${titleInfo.progress}%) - 다음 칭호까지 ${titleInfo.remaining}회 남음`;
    }
  }

  renderAll() {
    this.renderUser();
    this.renderFridge();
    this.renderRecipeCards();
    this.renderCommunityPosts();
  }

  // 나만의 도마 레시피 모달 제어
  openAddRecipeModal() {
    if (this.dom.modalAddRecipe) {
      this.dom.modalAddRecipe.classList.add('active');
    }
  }

  closeAddRecipeModal() {
    if (this.dom.modalAddRecipe) {
      this.dom.modalAddRecipe.classList.remove('active');
    }
  }

  // 유틸리티: 이모지 매핑
  getFoodEmoji(name) {
    if (name.includes('계란') || name.includes('달걀')) return '🥚';
    if (name.includes('스팸') || name.includes('햄')) return '🥓';
    if (name.includes('김치')) return '🥬';
    if (name.includes('대파') || name.includes('파')) return '🥢';
    if (name.includes('양파')) return '🧅';
    if (name.includes('두부')) return '🧊';
    if (name.includes('치즈')) return '🧀';
    if (name.includes('삼겹')) return '🥩';
    if (name.includes('밥')) return '🍚';
    if (name.includes('마늘')) return '🧄';
    if (name.includes('호박')) return '🥒';
    if (name.includes('당근')) return '🥕';
    return '🥗';
  }

  // 하네스 로그 스트림 추가
  appendHarnessLog(entry) {
    if (!this.dom.harnessDockBody) return;
    const item = document.createElement('div');
    item.className = 'harness-log-entry';
    item.innerHTML = `
      <span class="harness-log-time">[${entry.time}]</span>
      <span class="harness-log-src">[${entry.source}]</span>
      <span class="harness-log-msg">${entry.title} - ${entry.detail}</span>
    `;
    this.dom.harnessDockBody.prepend(item);
  }

  // 모달 제어
  openSignModal() {
    this.dom.signModal.classList.add('active');
  }

  closeSignModal() {
    this.dom.signModal.classList.remove('active');
  }

  // 토스트 메시지
  showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>💬</span> <span>${message}</span>`;
    this.dom.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(40px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
}

// 앱 실행
window.addEventListener('DOMContentLoaded', () => {
  window.kitchenApp = new KitchenChefApp();
});
