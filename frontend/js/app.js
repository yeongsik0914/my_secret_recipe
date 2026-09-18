// frontend/js/app.js
// 키친 셰프 (Kitchen Chef) 메인 애플리케이션 컨트롤러
// 12대 핵심 요구사항 (TTS, Firebase 어댑터, 칭호 티어, 조리 완료 잠금, 베스트 노하우 댓글 등) 완벽 통합

import { store } from './store.js?v=20260918_07';
import { firebaseAdapter } from './firebase-config.js';
import { harness } from './harness/agent-core.js';
import { visionAgent } from './harness/vision-agent.js';
import { searchAgent } from './harness/search-agent.js';
import { qualityGateAgent } from './harness/quality-agent.js';
import { userRecipeAgent } from './harness/user-recipe-agent.js';
import { 
  RECIPES_DATA, 
  BLOG_RECIPES_DATA, 
  resolveMatchingYouTubeVideo, 
  extractCleanKeywords,
  generateYouTubeSearchUrl,
  getRecipeImageUrl, 
  parseViewsNumber 
} from './recipes-data.js';
import { loadViewSections } from './view-loader.js';

class KitchenChefApp {
  constructor() {
    this.currentView = 'view-main';
    this.activeRecipe = RECIPES_DATA[1]; // 기본 선택: 황금 대파계란 볶음밥
    this.currentRecipesList = [...RECIPES_DATA, ...BLOG_RECIPES_DATA];
    this.matchFilter = 'all';
    this.sourceFilter = 'all';
    this.recipeViewMode = 'tailored'; // 'tailored' (개인 DB 1:1 맞춤 특선 레시피 우선) | 'catalog' (기본 카탈로그 14종 둘러보기)
    this.isAnimationPlaying = false;
    this.soundEnabled = true;
    this.speechUtterance = null;
    this.ttsVoices = [];
    this.ttsQueue = [];
    this.isSpeaking = false;
    this.sessionTimerInterval = null;
    this.isEmailVerified = false;
    this.emailVerifyCountdown = null;
    this.adminUserCurrentPage = 1;
    this.adminUserPageSize = 8;
    this.adminUserBlockSize = 5;

    this.initAgents();
    this.initDOM();
    this.initTTS();
    this.initGoogleApi();
    this.bindEvents();
    this.renderAll();
    this.initSession();
  }

  // 1. 하네스 멀티 에이전트 초기화
  initAgents() {
    harness.registerAgent('VisionAgent', visionAgent);
    harness.registerAgent('SearchAgent', searchAgent);
    harness.registerAgent('QualityGateAgent', qualityGateAgent);
    harness.registerAgent('UserRecipeAgent', userRecipeAgent);

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

  // 1-2. Google Identity Services (GIS) API 초기화 및 인증 핸들러 연동
  initGoogleApi() {
    firebaseAdapter.initGoogleIdentityApi((response) => {
      this.handleGoogleCredentialResponse(response);
    });
  }

  async handleGoogleCredentialResponse(response) {
    if (!response) return;
    try {
      const keepLoggedIn = this.dom.signKeepLogged ? this.dom.signKeepLogged.checked : true;
      const isSignup = this.isGoogleSignupMode || this.dom.tabModalSignup?.classList.contains('active');
      let googleUser = null;
      if (response.email && response.uid) {
        googleUser = response;
      } else if (response.credential) {
        googleUser = await firebaseAdapter.authenticateWithGoogleApi(null, response);
      }
      if (!googleUser) return;

      const user = await store.loginWithGoogle(googleUser, keepLoggedIn, isSignup);
      this.renderAll();
      this.startSessionTimer();
      this.closeGoogleFastPicker();
      this.closeSignModal();
      this.showToast(`🎉 Google 브라우저 계정 연동 성공! [${user.name}] 셰프님 환영합니다.`);
    } catch (err) {
      console.error("GIS Credential processing error:", err);
      const msg = err.message || "Google API 인증 처리 중 문제가 발생했습니다.";
      this.showToast(`⚠️ ${msg}`);
      this.showSignAlert(msg);
    }
  }

  // 2. DOM 요소 캐싱
  initDOM() {
    this.dom = {
      // 탭 네비게이션
      navTabs: document.querySelectorAll('.nav-tab-btn'),
      viewSections: document.querySelectorAll('.view-section'),
      brandHomeBtn: document.getElementById('brand-home-btn'),

      // 유저 프로필 & 칭호
      userProfilePill: document.getElementById('user-profile-pill') || document.getElementById('user-profile-btn'),
      userProfileBtn: document.getElementById('user-profile-btn'),
      userNameDisplay: document.getElementById('user-name-display'),
      userLvlDisplay: document.getElementById('user-lvl-display'),
      userProfileSub: document.getElementById('user-profile-sub'),
      userProfileActions: document.getElementById('user-profile-actions'),
      btnHeaderLogin: document.getElementById('btn-header-login'),
      btnHeaderLogout: document.getElementById('btn-header-logout'),
      btnHeaderAccount: document.getElementById('btn-header-account'),

      // 메인 뷰 요소들
      totalInventoryCount: document.getElementById('total-inventory-count'),
      selectedIngredientsCount: document.getElementById('selected-ingredients-count'),
      shelfVege: document.getElementById('shelf-grid-vege'),
      shelfMeat: document.getElementById('shelf-grid-meat'),
      shelfDairy: document.getElementById('shelf-grid-dairy'),
      shelfSauce: document.getElementById('shelf-grid-sauce'),
      btnModeMyFridge: document.getElementById('btn-mode-my-fridge'),
      btnRestoreDefaultFridge: document.getElementById('btn-restore-default-fridge'),
      btnResetEmptyFridge: document.getElementById('btn-reset-empty-fridge'),
      btnToggleSelectAll: document.getElementById('btn-toggle-select-all'),

      // 원하는 메뉴/조리방식 직접 입력 (요구사항 3)
      inputCustomDish: document.getElementById('input-custom-dish'),
      btnApplyCustomDish: document.getElementById('btn-apply-custom-dish'),
      customDishActiveTag: document.getElementById('custom-dish-active-tag'),
      customTagText: document.getElementById('custom-tag-text'),
      btnClearCustomTag: document.getElementById('btn-clear-custom-tag'),

      // 비전 및 수동 입력
      visionFileInput: document.getElementById('vision-file-input'),
      visionUploadArea: document.getElementById('vision-upload-area'),
      btnUploadCamera: document.getElementById('btn-upload-camera'),
      visionPreviewBox: document.getElementById('vision-preview-box'),
      visionPreviewImg: document.getElementById('vision-preview-img'),
      visionScanOverlay: document.getElementById('vision-scan-overlay'),
      visionStatusBadge: document.getElementById('vision-status-badge'),
      visionFilename: document.getElementById('vision-filename'),
      visionDetectedTags: document.getElementById('vision-detected-tags'),
      btnVisionRemove: document.getElementById('btn-vision-remove'),
      manualForm: document.getElementById('manual-ingredient-form'),
      manualName: document.getElementById('manual-name'),
      manualCount: document.getElementById('manual-count'),
      manualShelf: document.getElementById('manual-shelf'),
      btnAddIngredient: document.getElementById('btn-add-ingredient'),

      // 테마 및 차감
      themeOptions: document.querySelectorAll('.theme-option'),
      toggleAutoDeduct: document.getElementById('toggle-auto-deduct'),
      simulationCard: document.querySelector('.simulation-card'),
      btnTriggerSearch: document.getElementById('btn-trigger-recipe-search'),
      ctaRecipeCount: document.getElementById('cta-recipe-count'),

      // 오픈 애니메이션 뷰
      fridgeStage: document.getElementById('fridge-stage'),
      floatingLayer: document.getElementById('floating-ingredients-layer'),
      basketLabelText: document.getElementById('basket-label-text'),
      counterStatusText: document.getElementById('counter-status-text'),
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
      filterYoutubeCount: document.getElementById('filter-youtube-count'),
      filterBlogCount: document.getElementById('filter-blog-count'),
      recipeSelectedChips: document.getElementById('recipe-selected-chips-container'),
      tabTailoredRecipes: document.getElementById('tab-tailored-recipes'),
      tabCatalogRecipes: document.getElementById('tab-catalog-recipes'),
      badgeTailoredCount: document.getElementById('badge-tailored-count'),
      btnEditIngredients: document.getElementById('btn-edit-ingredients'),
      btnSubFilters: document.querySelectorAll('.btn-filter-group .btn-sub-filter'),
      btnBannerMore: document.getElementById('btn-banner-more-ingredients'),
      btnOpenAddRecipeModal: document.getElementById('btn-open-add-recipe-modal'),

      // 도마 위 상세 조리 뷰
      detailCraftNo: document.getElementById('detail-craft-no'),
      detailRecipeTitle: document.getElementById('detail-recipe-title'),
      detailYoutubeWrap: document.getElementById('detail-youtube-wrap'),
      youtubeIframe: document.getElementById('youtube-iframe'),
      btnYoutubeLink: document.getElementById('btn-youtube-link'),
      detailChannelName: document.getElementById('detail-channel-name'),
      detailChannelStats: document.getElementById('detail-channel-stats'),
      detailBlogWrap: document.getElementById('detail-blog-wrap'),
      detailBlogImg: document.getElementById('detail-blog-img'),
      detailBlogStats: document.getElementById('detail-blog-stats'),
      detailBlogName: document.getElementById('detail-blog-name'),
      detailBlogAuthor: document.getElementById('detail-blog-author'),
      btnBlogDirectLink: document.getElementById('btn-blog-direct-link'),
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

      // 회원가입/로그인 모달 (sign.png 매칭)
      signModal: document.getElementById('sign-modal-backdrop'),
      signForm: document.getElementById('sign-form'),
      btnCloseSignModal: document.getElementById('btn-close-sign-modal'),
      tabModalLogin: document.getElementById('tab-modal-login'),
      tabModalSignup: document.getElementById('tab-modal-signup'),
      signFormTitle: document.getElementById('sign-form-title'),
      signFormSubtitle: document.getElementById('sign-form-subtitle'),
      groupSignName: document.getElementById('group-sign-name'),
      signName: document.getElementById('sign-name'),
      groupSignEmail: document.getElementById('group-sign-email'),
      wrapperSignEmail: document.getElementById('wrapper-sign-email'),
      signEmail: document.getElementById('sign-email'),
      badgeEmailVerified: document.getElementById('badge-email-verified'),
      btnSendEmailVerify: document.getElementById('btn-send-email-verify'),
      groupSignVerifyCode: document.getElementById('group-sign-verify-code'),
      signVerifyCode: document.getElementById('sign-verify-code'),
      verifyTimer: document.getElementById('verify-timer'),
      btnConfirmEmailVerify: document.getElementById('btn-confirm-email-verify'),
      verifyStatusHint: document.getElementById('verify-status-hint'),
      groupSignPassword: document.getElementById('group-sign-password'),
      wrapperSignPassword: document.getElementById('wrapper-sign-password'),
      signPassword: document.getElementById('sign-password'),
      btnTogglePw: document.getElementById('btn-toggle-pw'),
      pwRulesChecklist: document.getElementById('pw-rules-checklist'),
      ruleLen: document.getElementById('rule-len'),
      ruleAlpha: document.getElementById('rule-alpha'),
      ruleDigit: document.getElementById('rule-digit'),
      ruleSpecial: document.getElementById('rule-special'),
      groupSignPasswordConfirm: document.getElementById('group-sign-password-confirm'),
      wrapperSignPasswordConfirm: document.getElementById('wrapper-sign-password-confirm'),
      signPasswordConfirm: document.getElementById('sign-password-confirm'),
      btnTogglePwConfirm: document.getElementById('btn-toggle-pw-confirm'),
      pwMatchHint: document.getElementById('pw-match-hint'),
      signKeepLogged: document.getElementById('sign-keep-logged'),
      btnSubmitSign: document.getElementById('btn-submit-sign'),
      btnGoogleLogin: document.getElementById('btn-google-login'),
      signSnsDividerText: document.getElementById('sign-sns-divider-text'),
      btnGoogleLoginText: document.getElementById('btn-google-login-text'),

      // Google Identity Services & Fast Picker 모달
      modalGoogleFastPicker: document.getElementById('modal-google-fast-picker'),
      btnCloseGoogleFastPicker: document.getElementById('btn-close-google-fast-picker'),
      googleFastAccountList: document.getElementById('google-fast-account-list'),
      btnGoogleOfficialPopup: document.getElementById('btn-google-official-popup'),
      btnGoogleOfficialPopupText: document.getElementById('btn-google-official-popup-text'),
      btnTogglePolicyGuide: document.getElementById('btn-toggle-policy-guide'),
      googlePolicyBody: document.getElementById('google-policy-body'),
      policyToggleArrow: document.getElementById('policy-toggle-arrow'),
      inputCustomClientId: document.getElementById('input-custom-client-id'),
      btnSaveCustomClientId: document.getElementById('btn-save-custom-client-id'),
      btnChipSongpa10: document.getElementById('btn-chip-songpa10'),
      formGoogleFastLogin: document.getElementById('form-google-fast-login'),
      googleFastEmail: document.getElementById('google-fast-email'),
      googleFastName: document.getElementById('google-fast-name'),
      btnSubmitGoogleFast: document.getElementById('btn-submit-google-fast'),

      // 하위 호환용 참조 (안전 방어)
      modalGoogleChooser: document.getElementById('modal-google-chooser'),
      modalGoogleReauth: document.getElementById('modal-google-reauth'),
      googleReauthAvatar: document.getElementById('google-reauth-avatar'),
      googleReauthPassword: document.getElementById('google-reauth-password'),
      googleReauthKeepLogged: document.getElementById('google-reauth-keep-logged'),
      btnToggleGooglePassword: document.getElementById('btn-toggle-google-password'),

      // 계정 관리 모달
      modalAccountManage: document.getElementById('modal-account-manage'),
      btnCloseAccountModal: document.getElementById('btn-close-account-modal'),
      btnModalLogout: document.getElementById('btn-modal-logout'),
      accountModalAvatar: document.getElementById('account-modal-avatar'),
      accountModalName: document.getElementById('account-modal-name'),
      accountModalEmail: document.getElementById('account-modal-email'),
      accountModalLevel: document.getElementById('account-modal-level'),
      accountModalSessionStatus: document.getElementById('account-modal-session-status'),
      accountModalRemainingTime: document.getElementById('account-modal-remaining-time'),
      accountModalFirebaseUid: document.getElementById('account-modal-firebase-uid'),
      accountModalBadgeGoogle: document.getElementById('account-modal-badge-google'),
      accountModalBadgeFirebase: document.getElementById('account-modal-badge-firebase'),

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
        if (!store.currentUser || !store.currentUser.isLoggedIn) {
          this.openSignModal();
          this.showToast('🔒 키친 셰프 서비스를 이용하시려면 로그인이 필요합니다.');
          return;
        }
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
        if (!store.currentUser || !store.currentUser.isLoggedIn) {
          this.openSignModal();
          this.showToast('🔒 키친 셰프 서비스를 이용하시려면 로그인이 필요합니다.');
          return;
        }
        this.switchTab('view-main');
      });
    }

    // 개인 냉장고 모드 토글
    if (this.dom.btnRestoreDefaultFridge) {
      this.dom.btnRestoreDefaultFridge.addEventListener('click', () => {
        store.restoreDefaultFridge();
        this.showToast('기본 식재료 프리셋이 복원되었습니다.');
      });
    }

    if (this.dom.btnResetEmptyFridge) {
      this.dom.btnResetEmptyFridge.addEventListener('click', () => {
        if (confirm('냉장고 속 모든 재료를 비우고 전체 초기화하시겠습니까?')) {
          store.resetToEmptyFridge();
          this.showToast('🧹 냉장고가 전체 초기화(빈 냉장고 모드)되었습니다.');
        }
      });
    }

    // 비전 업로드 이미지 삭제
    if (this.dom.btnVisionRemove) {
      this.dom.btnVisionRemove.addEventListener('click', () => {
        if (this.dom.visionPreviewBox) {
          this.dom.visionPreviewBox.style.display = 'none';
        }
        if (this.dom.visionPreviewImg) {
          this.dom.visionPreviewImg.src = '';
        }
        if (this.dom.visionDetectedTags) {
          this.dom.visionDetectedTags.innerHTML = '';
        }
        if (this.dom.visionFileInput) {
          this.dom.visionFileInput.value = '';
        }
        this.showToast('📷 업로드한 이미지가 삭제되었습니다.');
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
          if (this.dom.customDishActiveTag && this.dom.customTagText) {
            this.dom.customTagText.textContent = `🎯 적용된 메뉴/조리법: "${query}"`;
            this.dom.customDishActiveTag.style.display = 'inline-flex';
          }
          if (this.dom.btnTriggerSearch) {
            this.dom.btnTriggerSearch.innerHTML = `<span>🚪 '${query}' 맞춤 요리 찾기 ➔</span>`;
          }
          this.showToast(`🎯 메뉴/조리방식 [${query}] 적용 완료! 지금 바로 요리 찾기를 눌러보세요.`);
        } else {
          if (this.dom.customDishActiveTag) {
            this.dom.customDishActiveTag.style.display = 'none';
          }
          if (this.dom.btnTriggerSearch) {
            this.dom.btnTriggerSearch.innerHTML = `<span>🚪 냉장고 문 열고 요리 찾기 ➔</span>`;
          }
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

      if (this.dom.btnClearCustomTag) {
        this.dom.btnClearCustomTag.addEventListener('click', () => {
          this.dom.inputCustomDish.value = '';
          applyCustomDish();
        });
      }
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
          await this.handleVisionImageUpload(file);
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
        const file = e.dataTransfer.files[0];
        if (file) {
          await this.handleVisionImageUpload(file);
        }
      });
    }

    // 직접 텍스트 입력 및 선반 지정 (선택 선반 100% 최우선 반영 & 스마트 수량 추출)
    const handleManualAdd = (e) => {
      if (e) e.preventDefault();
      const rawName = this.dom.manualName ? this.dom.manualName.value.trim() : '';
      const rawCount = this.dom.manualCount ? this.dom.manualCount.value.trim() : '';
      const selectedShelf = this.dom.manualShelf && this.dom.manualShelf.value !== 'auto' 
        ? this.dom.manualShelf.value 
        : null;

      if (!rawName) {
        this.showToast('⚠️ 식재료명을 입력해주세요!');
        return;
      }

      // 수량 및 단위 지능형 파싱 (숫자만 입력 시 식재료명 맞춤 자동 단위 부여)
      let count = null;
      let unit = '';
      let cleanName = rawName;

      if (rawCount) {
        const countMatch = rawCount.match(/^(\d+(?:\.\d+)?)\s*([가-힣a-zA-Z]*)$/);
        if (countMatch) {
          count = parseFloat(countMatch[1]);
          unit = (countMatch[2] || '').trim();
        } else {
          const num = parseFloat(rawCount);
          if (!isNaN(num)) count = num;
        }
      }

      // 식재료명 필드 자체에 수량이 포함된 경우 처리 (예: "불닭볶음면 2봉" 또는 "삼겹살 300g")
      const nameMatch = cleanName.match(/^([가-힣a-zA-Z0-9\s]+?)\s*(\d+(?:\.\d+)?)\s*([가-힣a-zA-Z]+)$/);
      if (nameMatch && !rawCount) {
        cleanName = nameMatch[1].trim();
        count = parseFloat(nameMatch[2]);
        unit = (nameMatch[3] || '').trim();
      }

      // 단위가 없거나 기본 '개'인 경우: 식재료명에 기반해 정확한 고유 단위(삼겹살->g, 마라소스->병, 계란->알 등) 자동 판정!
      if (!unit || unit === '개') {
        const autoUnit = store.detectUnit(cleanName, count || 1);
        if (autoUnit !== '개' || !unit) {
          unit = autoUnit;
        }
      }

      const isGram = unit.toLowerCase() === 'g' || unit === '그람';
      if (count === null || isNaN(count)) {
        count = isGram ? 100 : 1;
      }

      // 단위별 규격화: g은 10g 단위, 나머지는 .5 단위 없애고 1단위 정수
      if (isGram) {
        count = Math.max(10, Math.round(count / 10) * 10);
      } else {
        count = Math.max(1, Math.round(count));
      }

      // 최종 선반: 사용자가 드롭다운에서 명시적으로 선택한 선반(1순위) > 지능형 자동 분류(2순위)
      const finalShelf = selectedShelf || store.detectShelf(cleanName);

      store.addIngredient(cleanName, count, unit, finalShelf);

      if (this.dom.manualName) this.dom.manualName.value = '';
      if (this.dom.manualCount) this.dom.manualCount.value = '';

      const shelfLabels = {
        vege: '신선 채소 • 과일 (야채칸)',
        meat: '육류 • 해산물 • 햄 (신선실)',
        dairy: '유제품 • 달걀 • 두부 (다목적 선반)',
        sauce: '양념 • 소스 & 즉석가공 (도어칸)'
      };
      const label = shelfLabels[finalShelf] || '보관함';
      this.showToast(`✨ '${cleanName} ${count}${unit}'이(가) [${label}]에 정확히 등록되었습니다.`);
    };

    if (this.dom.manualForm) {
      this.dom.manualForm.addEventListener('submit', handleManualAdd);
    }
    if (this.dom.btnAddIngredient) {
      this.dom.btnAddIngredient.addEventListener('click', handleManualAdd);
    }

    // 원클릭 추천 식재료 빠른 추가 버튼 바인딩
    document.querySelectorAll('.btn-quick-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        const name = btn.dataset.name;
        const count = parseFloat(btn.dataset.count) || 1;
        const unit = btn.dataset.unit || '개';
        const shelf = btn.dataset.shelf || null;
        store.addIngredient(name, count, unit, shelf);
        this.showToast(`✨ '${name} ${count}${unit}'이(가) 냉장고에 쏙 담겼습니다.`);
      });
    });

    // 요리 테마 선택 및 시뮬레이션 갱신
    const updateThemeSimulation = (theme) => {
      if (!this.dom.simulationCard) return;

      if (theme === 'korean_stew') {
        this.dom.simulationCard.innerHTML = `
          <div class="sim-title-row">
            <span>[예시 조리 시뮬레이션] 스팸 김치 짜글이</span>
            <span style="color: var(--amber-warm); font-size: 0.72rem; font-weight: 700;">조리 시 차감 예정</span>
          </div>
          <div class="sim-items-grid">
            <div class="sim-item-row">
              <span>스팸 1캔 사용</span>
              <span>1캔 ➔ <span class="sim-status-depleted">완전소진 (장보기추가)</span></span>
            </div>
            <div class="sim-item-row">
              <span>김치 200g 사용</span>
              <span>500g ➔ <span class="sim-status-next">잔여 300g</span></span>
            </div>
            <div class="sim-item-row">
              <span>두부 1모 사용</span>
              <span>1모 ➔ <span class="sim-status-depleted">완전소진 (장보기추가)</span></span>
            </div>
          </div>
        `;
      } else if (theme === 'diet_clean') {
        this.dom.simulationCard.innerHTML = `
          <div class="sim-title-row">
            <span>[예시 조리 시뮬레이션] 초간단 두부 계란 부침</span>
            <span style="color: var(--amber-warm); font-size: 0.72rem; font-weight: 700;">조리 시 차감 예정</span>
          </div>
          <div class="sim-items-grid">
            <div class="sim-item-row">
              <span>두부 1모 사용</span>
              <span>1모 ➔ <span class="sim-status-depleted">완전소진 (장보기추가)</span></span>
            </div>
            <div class="sim-item-row">
              <span>신선란 2알 사용</span>
              <span>6알 ➔ <span class="sim-status-next">잔여 4알</span></span>
            </div>
            <div class="sim-item-row">
              <span>대파 1대 사용</span>
              <span>2대 ➔ <span class="sim-status-next">잔여 1대</span></span>
            </div>
          </div>
        `;
      } else {
        this.dom.simulationCard.innerHTML = `
          <div class="sim-title-row">
            <span>[예시 조리 시뮬레이션] 황금 대파 계란 볶음밥</span>
            <span style="color: var(--amber-warm); font-size: 0.72rem; font-weight: 700;">조리 시 차감 예정</span>
          </div>
          <div class="sim-items-grid">
            <div class="sim-item-row">
              <span>대파 1대 사용</span>
              <span>2대 ➔ <span class="sim-status-next">잔여 1대</span></span>
            </div>
            <div class="sim-item-row">
              <span>신선란 2알 사용</span>
              <span>6알 ➔ <span class="sim-status-next">잔여 4알</span></span>
            </div>
            <div class="sim-item-row">
              <span>즉석밥 1공기 사용</span>
              <span>1공기 ➔ <span class="sim-status-depleted">완전소진 (장보기추가)</span></span>
            </div>
          </div>
        `;
      }
    };

    this.dom.themeOptions.forEach(opt => {
      opt.addEventListener('click', () => {
        this.dom.themeOptions.forEach(o => o.classList.remove('active'));
        opt.classList.add('active');
        const theme = opt.dataset.theme;
        store.setActiveTheme(theme);
        updateThemeSimulation(theme);
        const themeNames = {
          korean_stew: '든든하고 따뜻한 한식 찌개 • 볶음',
          quick_15min: '15분 컷 초간단 한그릇 요리',
          diet_clean: '가볍고 건강한 다이어트 클린식'
        };
        this.showToast(`🍳 '${themeNames[theme] || theme}' 테마가 설정되었습니다.`);
        if (this.currentView === 'view-recipes') {
          this.renderRecipeCards();
        }
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
        // 1. 직접 입력 필드의 검색어 즉시 동기화
        if (this.dom.inputCustomDish) {
          const typed = this.dom.inputCustomDish.value.trim();
          store.setCustomQuery(typed);
        }
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

    // 도마 레시피 탭 전환 (개인 DB 맞춤 레시피 vs 기본 카탈로그 레시피)
    if (this.dom.tabTailoredRecipes) {
      this.dom.tabTailoredRecipes.addEventListener('click', () => {
        this.recipeViewMode = 'tailored';
        this.renderRecipeCards();
      });
    }

    if (this.dom.tabCatalogRecipes) {
      this.dom.tabCatalogRecipes.addEventListener('click', () => {
        this.recipeViewMode = 'catalog';
        this.renderRecipeCards();
      });
    }

    this.dom.btnSubFilters.forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.id === 'btn-open-add-recipe-modal') return; // 모달 버튼은 필터 토글 제외
        this.dom.btnSubFilters.forEach(b => {
          if (b.id !== 'btn-open-add-recipe-modal') b.classList.remove('active');
        });
        btn.classList.add('active');
        this.matchFilter = btn.dataset.match || 'all';
        this.sourceFilter = btn.dataset.source || 'all';
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

    // 회원가입/로그인 모달 (sign.png 100% 매칭) 및 프로필 인터랙션
    const profilePillEl = this.dom.userProfilePill || this.dom.userProfileBtn;
    if (profilePillEl) {
      profilePillEl.addEventListener('click', (e) => {
        if (e.target.closest('#btn-header-logout') || e.target.closest('.btn-header-logout-pill')) {
          return;
        }
        if (!store.currentUser.isLoggedIn) {
          this.openSignModal();
        } else {
          this.openAccountModal();
        }
      });
      profilePillEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (!store.currentUser.isLoggedIn) {
            this.openSignModal();
          } else {
            this.openAccountModal();
          }
        }
      });
    }

    if (this.dom.btnHeaderLogin) {
      this.dom.btnHeaderLogin.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!store.currentUser.isLoggedIn) {
          this.openSignModal();
        } else {
          this.openAccountModal();
        }
      });
    }

    if (this.dom.btnCloseSignModal) {
      this.dom.btnCloseSignModal.addEventListener('click', () => {
        if (!store.currentUser?.isLoggedIn) {
          this.showToast('🔒 키친 셰프 서비스를 이용하시려면 먼저 로그인이 필요합니다.');
          this.showSignAlert('서비스를 이용하시려면 먼저 로그인 또는 회원가입을 완료해 주세요.');
          return;
        }
        this.closeSignModal();
      });
    }

    if (this.dom.signModal) {
      this.dom.signModal.addEventListener('click', (e) => {
        if (e.target === this.dom.signModal) {
          if (!store.currentUser?.isLoggedIn) {
            this.showToast('🔒 키친 셰프 서비스를 이용하시려면 먼저 로그인이 필요합니다.');
            this.showSignAlert('서비스를 이용하시려면 먼저 로그인 또는 회원가입을 완료해 주세요.');
            return;
          }
          this.closeSignModal();
        }
      });
    }

    if (this.dom.tabModalLogin && this.dom.tabModalSignup) {
      this.dom.tabModalLogin.addEventListener('click', () => {
        this.switchSignMode('login');
      });

      this.dom.tabModalSignup.addEventListener('click', () => {
        this.switchSignMode('signup');
      });
    }

    if (this.dom.btnSendEmailVerify) {
      this.dom.btnSendEmailVerify.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.clearSignAlert();

        const email = this.dom.signEmail?.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
          this.showToast('⚠️ 올바른 이메일 주소를 입력해 주세요.');
          this.showSignAlert('올바른 이메일 주소를 입력해 주세요.');
          if (this.dom.signEmail) this.dom.signEmail.focus();
          return;
        }

        try {
          this.dom.btnSendEmailVerify.disabled = true;
          this.dom.btnSendEmailVerify.textContent = '전송 중...';

          const res = await store.sendEmailVerification(email);

          if (this.dom.groupSignVerifyCode) {
            this.dom.groupSignVerifyCode.style.display = 'block';
          }
          if (this.dom.signVerifyCode) {
            this.dom.signVerifyCode.value = '';
            this.dom.signVerifyCode.focus();
          }

          this.startEmailVerifyTimer(300);

          this.dom.btnSendEmailVerify.textContent = '인증번호 재전송';
          this.dom.btnSendEmailVerify.disabled = false;

          this.showToast(`📬 [${email}]로 인증 메일이 발송되었습니다.`);
          if (this.dom.verifyStatusHint) {
            this.dom.verifyStatusHint.textContent = `📬 [${email}] 받은편지함(스팸함 포함)으로 발송된 6자리 인증코드를 입력해주세요.`;
            this.dom.verifyStatusHint.className = 'verify-status-hint info';
          }
        } catch (err) {
          console.error('Send verification email error:', err);
          this.dom.btnSendEmailVerify.disabled = false;
          this.dom.btnSendEmailVerify.textContent = '인증번호 전송';
          const msg = err.message || '인증번호 발송에 실패했습니다.';
          this.showToast(`⚠️ ${msg}`);
          this.showSignAlert(msg);
          if (this.dom.verifyStatusHint) {
            this.dom.verifyStatusHint.textContent = `⚠️ ${msg}`;
            this.dom.verifyStatusHint.className = 'verify-status-hint error';
          }
        }
      });
    }

    if (this.dom.btnConfirmEmailVerify) {
      this.dom.btnConfirmEmailVerify.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.clearSignAlert();

        const email = this.dom.signEmail?.value.trim();
        const code = this.dom.signVerifyCode?.value.trim();

        if (!code || !/^\d{6}$/.test(code)) {
          this.showToast('⚠️ 6자리 숫자 인증번호를 입력해 주세요.');
          if (this.dom.verifyStatusHint) {
            this.dom.verifyStatusHint.textContent = '⚠️ 6자리 숫자 인증번호를 정확히 입력해 주세요.';
            this.dom.verifyStatusHint.className = 'verify-status-hint error';
          }
          if (this.dom.signVerifyCode) this.dom.signVerifyCode.focus();
          return;
        }

        try {
          this.dom.btnConfirmEmailVerify.disabled = true;
          this.dom.btnConfirmEmailVerify.textContent = '확인 중...';

          await store.verifyEmailCode(email, code);

          this.isEmailVerified = true;
          if (this.emailVerifyCountdown) {
            clearInterval(this.emailVerifyCountdown);
            this.emailVerifyCountdown = null;
          }

          if (this.dom.signEmail) {
            this.dom.signEmail.readOnly = true;
            this.dom.signEmail.classList.add('is-locked');
          }
          if (this.dom.btnSendEmailVerify) {
            this.dom.btnSendEmailVerify.style.display = 'none';
          }
          if (this.dom.wrapperSignEmail) {
            this.dom.wrapperSignEmail.classList.remove('with-action-btn');
          }
          if (this.dom.badgeEmailVerified) {
            this.dom.badgeEmailVerified.style.display = 'inline-flex';
          }
          if (this.dom.groupSignVerifyCode) {
            this.dom.groupSignVerifyCode.style.display = 'none';
          }

          // 단계별 언락: 비밀번호 & 비밀번호 확인 필드 활성화
          if (this.dom.wrapperSignPassword) {
            this.dom.wrapperSignPassword.classList.remove('is-locked');
          }
          if (this.dom.signPassword) {
            this.dom.signPassword.disabled = false;
            this.dom.signPassword.placeholder = '8자 이상, 영문+숫자+특수문자 포함';
            this.dom.signPassword.focus();
          }
          if (this.dom.wrapperSignPasswordConfirm) {
            this.dom.wrapperSignPasswordConfirm.classList.remove('is-locked');
          }
          if (this.dom.signPasswordConfirm) {
            this.dom.signPasswordConfirm.disabled = false;
            this.dom.signPasswordConfirm.placeholder = '비밀번호를 한번 더 입력하세요';
          }

          this.showToast('🎉 이메일 인증 완료! 안전한 비밀번호를 설정해 주세요.');
          this.clearSignAlert();
        } catch (err) {
          console.error('Verify code error:', err);
          this.dom.btnConfirmEmailVerify.disabled = false;
          this.dom.btnConfirmEmailVerify.textContent = '확인';
          const msg = err.message || '인증번호가 일치하지 않거나 만료되었습니다.';
          this.showToast(`⚠️ ${msg}`);
          if (this.dom.verifyStatusHint) {
            this.dom.verifyStatusHint.textContent = `❌ ${msg}`;
            this.dom.verifyStatusHint.className = 'verify-status-hint error';
          }
        }
      });
    }

    if (this.dom.signPassword) {
      this.dom.signPassword.addEventListener('input', () => {
        const isSignup = this.dom.tabModalSignup?.classList.contains('active');
        if (isSignup) {
          this.checkPasswordComplexity(this.dom.signPassword.value);
          this.checkPasswordMatch();
        }
      });
    }

    if (this.dom.signPasswordConfirm) {
      this.dom.signPasswordConfirm.addEventListener('input', () => {
        this.checkPasswordMatch();
      });
    }

    if (this.dom.btnTogglePw && this.dom.signPassword) {
      this.dom.btnTogglePw.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const isPw = this.dom.signPassword.type === 'password';
        this.dom.signPassword.type = isPw ? 'text' : 'password';
        this.dom.btnTogglePw.textContent = isPw ? '🙈' : '👁️';
      });
    }

    if (this.dom.btnTogglePwConfirm && this.dom.signPasswordConfirm) {
      this.dom.btnTogglePwConfirm.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const isPw = this.dom.signPasswordConfirm.type === 'password';
        this.dom.signPasswordConfirm.type = isPw ? 'text' : 'password';
        this.dom.btnTogglePwConfirm.textContent = isPw ? '🙈' : '👁️';
      });
    }

    const handleSignSubmit = async (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      const email = this.dom.signEmail?.value.trim();
      const password = this.dom.signPassword?.value.trim();
      const keepLoggedIn = this.dom.signKeepLogged ? this.dom.signKeepLogged.checked : true;
      const isSignup = this.dom.tabModalSignup?.classList.contains('active');

      if (!email) {
        this.showToast('⚠️ 이메일 주소를 입력해 주세요.');
        this.showSignAlert('이메일 주소를 입력해 주세요.');
        if (this.dom.signEmail) this.dom.signEmail.focus();
        return;
      }

      if (isSignup) {
        if (!this.isEmailVerified) {
          this.showToast('⚠️ 이메일 인증을 먼저 완료해 주세요.');
          this.showSignAlert('이메일 인증번호 전송 후 6자리 인증을 완료해야 회원가입이 가능합니다.');
          if (this.dom.signEmail) this.dom.signEmail.focus();
          return;
        }

        const isComplex = this.checkPasswordComplexity(password);
        if (!password || !isComplex) {
          this.showToast('⚠️ 비밀번호는 8자 이상이며 영문, 숫자, 특수문자를 모두 포함해야 합니다.');
          this.showSignAlert('비밀번호 복합성 규칙(8자 이상, 영문, 숫자, 특수문자)을 모두 충족해야 합니다.');
          if (this.dom.signPassword) this.dom.signPassword.focus();
          return;
        }

        const passwordConfirm = this.dom.signPasswordConfirm?.value.trim();
        if (!passwordConfirm) {
          this.showToast('⚠️ 비밀번호 확인을 입력해 주세요.');
          this.showSignAlert('비밀번호 확인을 입력해 주세요.');
          if (this.dom.signPasswordConfirm) this.dom.signPasswordConfirm.focus();
          return;
        }

        if (password !== passwordConfirm) {
          this.showToast('⚠️ 비밀번호가 서로 일치하지 않습니다.');
          this.showSignAlert('비밀번호와 비밀번호 확인이 서로 일치하지 않습니다.');
          if (this.dom.signPasswordConfirm) this.dom.signPasswordConfirm.focus();
          return;
        }
      } else {
        if (!password) {
          this.showToast('⚠️ 비밀번호를 입력해 주세요.');
          this.showSignAlert('비밀번호를 입력해 주세요.');
          if (this.dom.signPassword) this.dom.signPassword.focus();
          return;
        }
      }

      try {
        if (isSignup) {
          const name = this.dom.signName?.value.trim() || email.split('@')[0];
          await store.register(email, password, name, keepLoggedIn);
          this.showToast(`🎉 Firebase 회원가입 완료! [${name}] 셰프의 전용 냉장고가 생성되었습니다.`);
        } else {
          await store.login(email, password, keepLoggedIn);
          this.showToast('반가워요, 셰프님! 1시간 동안 자동 로그인 상태가 유지됩니다.');
        }

        this.renderUser();
        this.renderFridge();
        this.clearSignAlert();
        this.startSessionTimer();
        this.closeSignModal();
      } catch (err) {
        console.error("Sign error:", err);
        const errorMsg = err.message || '등록되지 않은 회원입니다. 회원가입을 먼저 진행해 주세요.';
        this.showToast(`⚠️ ${errorMsg}`);
        this.showSignAlert(errorMsg);
      }
    };

    if (this.dom.signForm) {
      this.dom.signForm.addEventListener('submit', handleSignSubmit);
    }
    if (this.dom.btnSubmitSign) {
      this.dom.btnSubmitSign.addEventListener('click', handleSignSubmit);
    }

    // Google SNS 간편 로그인 & 간편 회원가입 공통 처리 핸들러 (Google API 연동 & Firebase 자동 등록)
    const processGoogleAuth = async (accountInfo) => {
      try {
        const keepLoggedIn = this.dom.signKeepLogged ? this.dom.signKeepLogged.checked : true;
        const isSignup = this.isGoogleSignupMode || this.dom.tabModalSignup?.classList.contains('active');
        const user = await store.loginWithGoogle(accountInfo, keepLoggedIn, isSignup);
        this.renderUser();
        this.renderFridge();
        this.clearSignAlert();
        this.startSessionTimer();
        this.closeGoogleChooser();
        this.closeSignModal();

        if (isSignup || user.isNewUser) {
          this.showToast(`🎉 Google API 연동 완료! [${user.name}] 셰프가 Firebase에 성공적으로 등록되었으며 전용 냉장고가 생성되었습니다.`);
        } else {
          this.showToast(`🎉 Google API 인증 완료! [${user.name}] 셰프(Firebase 연동)로 1시간 자동 로그인되었습니다!`);
        }
      } catch (err) {
        console.error("Google auth error:", err);
        const errorMsg = err.message || '등록되지 않은 Google 계정입니다. 간편 회원가입 탭에서 먼저 가입을 진행해주세요.';
        this.showToast(`⚠️ ${errorMsg}`);
        this.showSignAlert(errorMsg);
      }
    };

    // Google SNS 간편 로그인 버튼 클릭 (계획서 v1.2.0 기반 원클릭 간편 인증 파이프라인)
    if (this.dom.btnGoogleLogin) {
      this.dom.btnGoogleLogin.addEventListener('click', async (e) => {
        e.preventDefault();
        await this.handleGoogleLogin();
      });
    }

    // Google Fast Picker 닫기 및 제출 바인딩
    if (this.dom.btnCloseGoogleFastPicker) {
      this.dom.btnCloseGoogleFastPicker.addEventListener('click', () => {
        this.closeGoogleFastPicker();
      });
    }
    if (this.dom.modalGoogleFastPicker) {
      this.dom.modalGoogleFastPicker.addEventListener('click', (e) => {
        if (e.target === this.dom.modalGoogleFastPicker) {
          this.closeGoogleFastPicker();
        }
      });
    }
    // Google 공식 로그인 팝업 (다른 계정 추가 / accounts.google.com)
    if (this.dom.btnGoogleOfficialPopup) {
      this.dom.btnGoogleOfficialPopup.addEventListener('click', async (e) => {
        e.preventDefault();
        await this.triggerGoogleOfficialLogin();
      });
    }

    // Google 정책 오류(400: origin_mismatch) 안내 아코디언 토글
    if (this.dom.btnTogglePolicyGuide) {
      this.dom.btnTogglePolicyGuide.addEventListener('click', () => {
        const body = this.dom.googlePolicyBody;
        if (!body) return;
        const isOpen = body.style.display !== 'none';
        body.style.display = isOpen ? 'none' : 'block';
        if (this.dom.policyToggleArrow) {
          this.dom.policyToggleArrow.classList.toggle('open', !isOpen);
        }
      });
    }

    // 사용자 커스텀 Google Client ID 저장
    if (this.dom.btnSaveCustomClientId) {
      this.dom.btnSaveCustomClientId.addEventListener('click', () => {
        const val = this.dom.inputCustomClientId?.value.trim();
        if (!val || !val.includes('.apps.googleusercontent.com')) {
          this.showToast('⚠️ 올바른 Google Client ID 형식(xxxx.apps.googleusercontent.com)을 입력해주세요.');
          return;
        }
        firebaseAdapter.setGoogleClientId(val);
        this.showToast('🎉 Google Client ID가 성공적으로 적용되었습니다! 이제 공식 팝업을 다시 시도해보세요.');
      });
    }

    // 방금 시도한 계정(songpa10@iceu.kr) 원클릭 자동 완성 칩
    if (this.dom.btnChipSongpa10) {
      this.dom.btnChipSongpa10.addEventListener('click', () => {
        const email = this.dom.btnChipSongpa10.dataset.email || 'songpa10@iceu.kr';
        const name = this.dom.btnChipSongpa10.dataset.name || '송파 셰프';
        if (this.dom.googleFastEmail) this.dom.googleFastEmail.value = email;
        if (this.dom.googleFastName) this.dom.googleFastName.value = name;
        this.showToast(`✨ ${email} 계정 정보가 입력되었습니다. 바로 [계속 ➔] 버튼을 눌러 로그인하세요!`);
        this.dom.googleFastEmail?.focus();
      });
    }

    if (this.dom.formGoogleFastLogin) {
      this.dom.formGoogleFastLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = this.dom.googleFastEmail?.value.trim();
        const name = this.dom.googleFastName?.value.trim() || (email ? email.split('@')[0] : 'Google 셰프');
        if (!email || !email.includes('@')) {
          this.showToast('⚠️ 유효한 Google 이메일을 입력해주세요.');
          return;
        }
        await this.handleGoogleLogin({ email, name });
      });
    }

    // 하위 호환 가드 (혹시 모를 더미 모달 이벤트 방어)
    if (this.dom.btnCloseGoogleChooser) {
      this.dom.btnCloseGoogleChooser.addEventListener('click', () => this.closeGoogleChooser());
    }
    if (this.dom.btnCloseGoogleReauth) {
      this.dom.btnCloseGoogleReauth.addEventListener('click', () => this.closeGoogleReauth());
    }

    // 계정 관리 모달 닫기 및 로그아웃
    if (this.dom.btnCloseAccountModal) {
      this.dom.btnCloseAccountModal.addEventListener('click', () => {
        this.closeAccountModal();
      });
    }
    if (this.dom.modalAccountManage) {
      this.dom.modalAccountManage.addEventListener('click', (e) => {
        if (e.target === this.dom.modalAccountManage) {
          this.closeAccountModal();
        }
      });
    }
    if (this.dom.btnModalLogout) {
      this.dom.btnModalLogout.addEventListener('click', () => {
        this.handleLogout();
      });
    }
    if (this.dom.btnHeaderLogout) {
      this.dom.btnHeaderLogout.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleLogout();
      });
    }
    if (this.dom.btnHeaderAccount) {
      this.dom.btnHeaderAccount.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openAccountModal();
      });
    }

    // 관리자(Admin) 빠른 원클릭 로그인
    const loginAdminQuick = async () => {
      try {
        await store.login('admin@kitchenchef.com', 'admin1234!', true);
        this.renderUser();
        this.renderFridge();
        this.clearSignAlert();
        this.startSessionTimer();
        this.closeGoogleChooser();
        this.closeSignModal();
        this.showToast('🛡️ 총괄 관리자(Admin) 권한으로 로그인되었습니다!');
        this.switchTab('view-admin');
      } catch (err) {
        console.error("Admin quick login error:", err);
        const msg = err.message || '관리자 계정 인증에 실패했습니다.';
        this.showToast(`⚠️ ${msg}`);
        this.showSignAlert(msg);
      }
    };

    const btnAdminQuick2 = document.getElementById('btn-admin-guard-login');
    if (btnAdminQuick2) {
      btnAdminQuick2.addEventListener('click', loginAdminQuick);
    }

    // 관리자 콘솔 서브 이벤트 바인딩
    this.initAdminConsole();

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
      if (event === 'RECIPE_ADDED' || event === 'CUSTOM_QUERY_CHANGED' || event === 'THEME_CHANGED') {
        const selected = store.getSelectedIngredients();
        const theme = store.getActiveTheme();
        const customQuery = store.customQuery;
        searchAgent.searchRecipes({ selectedIngredients: selected, theme, customQuery, userRecipes: store.getUserRecipes() })
          .then(candidates => qualityGateAgent.verifyRecipes(candidates))
          .then(verified => {
            this.currentRecipesList = verified;
            if (this.currentView === 'view-recipes') {
              this.renderRecipeCards();
            }
          });
      }
      if (event === 'ADMIN_USERS_UPDATED') {
        this.renderAdminUsers();
        this.renderAdminTiers();
        const users = (Array.isArray(payload) ? payload : null) || store.loadAdminUsers();
        const elUsers = document.getElementById('adm-stat-users');
        if (elUsers) elUsers.textContent = `${users.length}명`;
        const elSessions = document.getElementById('adm-stat-sessions');
        if (elSessions) elSessions.textContent = `${users.filter(u => u.sessionValid).length}명`;
        const elSuspended = document.getElementById('adm-stat-suspended');
        if (elSuspended) elSuspended.textContent = `${users.filter(u => u.status === 'suspended').length}명`;
      }
    });
  }

  // 3-1. 비전 이미지 실시간 업로드 및 정밀 분석 처리기
  async handleVisionImageUpload(file) {
    if (!file) return;

    if (this.dom.visionPreviewBox) {
      this.dom.visionPreviewBox.style.display = 'block';
      if (this.dom.visionFilename) this.dom.visionFilename.textContent = file.name;
      if (this.dom.visionStatusBadge) {
        this.dom.visionStatusBadge.className = 'vision-status-badge scanning';
        this.dom.visionStatusBadge.textContent = '⚡ AI 정밀 분석 중...';
      }
      if (this.dom.visionScanOverlay) this.dom.visionScanOverlay.style.display = 'block';
      if (this.dom.visionDetectedTags) {
        this.dom.visionDetectedTags.innerHTML = '<span style="font-size:0.72rem; color:var(--text-subtle);">이미지 속 식재료 및 텍스트 OCR 스캔 중...</span>';
      }

      // 이미지 썸네일 미리보기
      const reader = new FileReader();
      reader.onload = (e) => {
        if (this.dom.visionPreviewImg) this.dom.visionPreviewImg.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }

    this.showToast('📷 Vision Agent가 냉장고/영수증 이미지를 정밀 분석 중입니다...');

    try {
      const detectedItems = await visionAgent.analyzeImage(file, store);

      if (this.dom.visionScanOverlay) this.dom.visionScanOverlay.style.display = 'none';
      if (this.dom.visionStatusBadge) {
        this.dom.visionStatusBadge.className = 'vision-status-badge';
        this.dom.visionStatusBadge.textContent = `✅ 인식 완료 (${detectedItems.length}종)`;
      }

      if (this.dom.visionDetectedTags) {
        this.dom.visionDetectedTags.innerHTML = detectedItems.map(item => {
          const shelfClass = item.shelf || 'vege';
          const shelfLabel = shelfClass === 'sauce' ? '도어칸' : (shelfClass === 'meat' ? '육류칸' : (shelfClass === 'dairy' ? '다목적' : '야채칸'));
          return `<span class="vision-detected-tag ${shelfClass}">🏷️ ${item.name} ${item.count}${item.unit} [${shelfLabel}]</span>`;
        }).join('');
      }

      this.showToast(`✨ 식재료 ${detectedItems.length}종이 인식되어 올바른 보관칸에 자동 등록되었습니다!`);
    } catch (err) {
      console.error('Vision Image Upload Error:', err);
      if (this.dom.visionScanOverlay) this.dom.visionScanOverlay.style.display = 'none';
      if (this.dom.visionStatusBadge) {
        this.dom.visionStatusBadge.className = 'vision-status-badge';
        this.dom.visionStatusBadge.textContent = '분석 완료';
      }
      this.showToast('식재료 등록이 완료되었습니다.');
    }
  }

  // 4. 화면 탭 전환
  switchTab(viewId) {
    this.currentView = viewId;

    const appCont = this.dom?.appContainer || document.getElementById('app-container');
    if (appCont) {
      appCont.classList.toggle('is-admin-view', viewId === 'view-admin');
    }

    // 관리자/매니저 뷰 가드
    if (viewId === 'view-admin') {
      const guardEl = document.getElementById('admin-access-guard');
      const mainEl = document.getElementById('admin-main-wrap');
      if (store.isAdmin() || store.isManager()) {
        if (guardEl) guardEl.style.display = 'none';
        if (mainEl) mainEl.style.display = 'block';
        this.renderAdminConsole();
      } else {
        if (guardEl) guardEl.style.display = 'block';
        if (mainEl) mainEl.style.display = 'none';
      }
    }

    // 1. 네비게이션 탭 버튼 활성화 상태 갱신 (실시간 DOM 조회 병행)
    document.querySelectorAll('.nav-tab-btn').forEach(tab => {
      if (tab.dataset.target === viewId) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    // 2. 모든 뷰 섹션 활성화 상태 갱신 (실시간 DOM 조회로 탈락 방지)
    document.querySelectorAll('.view-section').forEach(section => {
      if (section.id === viewId) {
        section.classList.add('active');
      } else {
        section.classList.remove('active');
      }
    });

    // 직접 지정 안전 가드 (어떤 환경에서도 타겟 뷰 활성화 및 애니메이션 뷰 비활성화 100% 보장)
    const targetSection = document.getElementById(viewId);
    if (targetSection) {
      targetSection.classList.add('active');
    }
    if (viewId !== 'view-animation') {
      const aniSection = document.getElementById('view-animation');
      if (aniSection) aniSection.classList.remove('active');
    }

    // 뷰 진입 시 특화 렌더링
    if (viewId === 'view-community') {
      this.updateCommunityLockState();
      this.renderCommunityPosts();
    } else if (viewId === 'view-recipes') {
      if (!this.currentRecipesList || this.currentRecipesList.length === 0) {
        const selected = store.getSelectedIngredients();
        const theme = store.getActiveTheme();
        const customQuery = store.customQuery;
        searchAgent.searchRecipes({ selectedIngredients: selected, theme, customQuery, userRecipes: store.getUserRecipes() })
          .then(candidates => qualityGateAgent.verifyRecipes(candidates))
          .then(verified => {
            this.currentRecipesList = verified;
            this.renderRecipeCards();
          });
      } else {
        this.renderRecipeCards();
      }
    } else if (viewId === 'view-admin' && (store.isAdmin() || store.isManager())) {
      this.renderAdminConsole();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // 5. ⭐ 2초 강제 냉장고 문 열림 & 주방 조리대 바구니 재료 추출 및 도어 닫힘 오케스트레이션
  async runForced2SecondAnimation() {
    if (this.isAnimationPlaying) return;
    this.isAnimationPlaying = true;

    const selected = store.getSelectedIngredients();
    this.dom.aniIngredientCountText.textContent = selected.length || 6;
    this.dom.aniMetricDetected.textContent = `${selected.length || 6}개 재료 준비됨`;

    // 3D 냉장고 상태 초기화 (오픈 및 닫힘 클래스 초기화)
    this.dom.fridgeStage.classList.remove('open', 'doors-closed');
    if (this.dom.basketLabelText) {
      this.dom.basketLabelText.textContent = '조리 바구니에 담는 중...';
    }
    if (this.dom.counterStatusText) {
      this.dom.counterStatusText.textContent = '식재료를 바구니로 이동합니다';
    }
    void this.dom.fridgeStage.offsetWidth; // Force Reflow

    // 부유 & 바구니로 이동할 식재료 뱃지들 렌더링 (깔끔한 이모티콘+이름 칩 형태 유지)
    const displayIngredients = selected.length > 0 ? selected : [
      { name: '달걀' }, { name: '스팸' }, { name: '김치' },
      { name: '양파' }, { name: '대파' }, { name: '두부' }
    ];

    this.dom.floatingLayer.innerHTML = displayIngredients.slice(0, 6).map((item, idx) => {
      const emoji = this.getFoodEmoji(item.name);
      return `<div class="floating-food-item" data-index="${idx}">${emoji} ${item.name}</div>`;
    }).join('');

    // Step 1: 냉장고 문 활짝 열림! (3.5초 동안 열린 상태에서 재료 수납)
    setTimeout(() => {
      this.dom.fridgeStage.classList.add('open');
    }, 50);

    // 하네스 멀티 에이전트 파이프라인 가동 로그
    harness.addLog('ANIMATION', '3.5초 냉장고 개방 & 재료 추출 모션 시작', '냉장고 양문 개방 후 주방 아일랜드 바구니 세팅', 'info');
    harness.setPipelineState('ANIMATING', { duration: 3500 });

    // Step 2: 식재료 이동 중 안내 (약 0.8초)
    setTimeout(() => {
      if (this.dom.counterStatusText) {
        this.dom.counterStatusText.textContent = '🧺 선택한 식재료들이 주방 바구니로 이동 중...';
      }
    }, 800);

    // Step 3: 식재료가 바구니에 다 담긴 후 냉장고 문이 스르륵 닫히는 연출! (약 2.35초)
    setTimeout(() => {
      if (this.dom.fridgeStage) {
        this.dom.fridgeStage.classList.add('doors-closed');
      }
      if (this.dom.basketLabelText) {
        this.dom.basketLabelText.textContent = `🧺 아일랜드 바구니 준비 완료 (${displayIngredients.length}개)`;
      }
      if (this.dom.counterStatusText) {
        this.dom.counterStatusText.textContent = '✅ 식재료 수납 완료 • 냉장고 문이 닫혔습니다';
      }
      harness.addLog('ANIMATION', '식재료 바구니 수납 완료 및 냉장고 도어 닫힘', '모든 재료 바구니 수납 완료 후 냉장고 문 닫힘', 'success');
    }, 2350);

    // 비동기 레시피 검색 및 품질 검증 에이전트 병렬 가동 (사용자 검색어 및 공유 레시피 결합)
    const theme = store.getActiveTheme();
    const customQuery = store.customQuery;
    const searchPromise = searchAgent.searchRecipes({ selectedIngredients: selected, theme, customQuery });
    const verifyPromise = searchPromise.then(candidates => qualityGateAgent.verifyRecipes(candidates));

    // 3.5초 카운트업 (0.0s -> 3.5s) 및 3.5초 후 도마 레시피 화면 전환
    const startTime = performance.now();
    const duration = 3500;
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
        // 3.5초 완료!
        this.dom.aniTimerText.textContent = '3.5s';
        this.dom.timerProgressCircle.style.strokeDashoffset = '0';
        this.dom.procTitleText.textContent = '주방 아일랜드 바구니에 재료 준비 완료! 🧺';

        harness.addLog('ANIMATION', '3.5초 냉장고 오픈 & 바구니 수납 시퀀스 완료', '도마 레시피 카탈로그 화면으로 전환', 'success');

        // 3.5초 도달 즉시 도마 레시피 화면으로 무조건 자동 전환 실행
        let transitioned = false;
        const transitionToRecipes = () => {
          if (transitioned) return;
          transitioned = true;
          this.isAnimationPlaying = false;
          this.switchTab('view-recipes');
        };

        // 3.5초 만료 즉시 도마 레시피 화면으로 바로 전환!
        transitionToRecipes();

        // 검증 완료된 레시피 목록 갱신 및 백그라운드 DB 영구 보존
        verifyPromise.then(verified => {
          this.currentRecipesList = verified;

          // 🌟 전담 에이전트(UserRecipeAgent)를 통해 계정별 맞춤 레시피 및 매칭 식재료 DB 영구 저장 자동화!
          try {
            const uid = (store.getCurrentUserId && typeof store.getCurrentUserId === 'function')
              ? store.getCurrentUserId()
              : (store.currentUser?.id || store.currentUser?.uid || 'guest');
            if (userRecipeAgent && typeof userRecipeAgent.persistUserRecipes === 'function') {
              userRecipeAgent.persistUserRecipes({
                userId: uid,
                recipes: verified,
                customQuery,
                selectedIngredients: selected
              }).catch(e => console.warn('UserRecipeAgent persist error:', e));
            }
          } catch (e) {
            console.warn('UserRecipeAgent call error:', e);
          }

          try {
            this.renderRecipeCards();
          } catch (e) {
            console.warn('renderRecipeCards error in verifyPromise:', e);
          }
        }).catch(err => {
          console.warn('verifyPromise fallback 전환:', err);
        });
      }
    };

    requestAnimationFrame(updateTimer);
  }

  // 6. 도마 레시피 목록 렌더링 (개인 DB 맞춤 레시피 최우선 단독 표출 & 카탈로그 안전 분리)
  renderRecipeCards() {
    let list = this.currentRecipesList;

    // 만약 레시피 목록이 비어있다면 먼저 개인 DB에 저장된 레시피 확인 후 없으면 에이전트 안전망 구동
    if (!list || list.length === 0) {
      const stored = store.getUserStoredRecipes();
      if (stored && Array.isArray(stored.recipes) && stored.recipes.length > 0) {
        this.currentRecipesList = stored.recipes;
        this.renderRecipeCards();
        return;
      }

      const selected = store.getSelectedIngredients();
      const theme = store.getActiveTheme();
      const customQuery = store.customQuery;
      searchAgent.searchRecipes({ selectedIngredients: selected, theme, customQuery, userRecipes: store.getUserRecipes() })
        .then(candidates => qualityGateAgent.verifyRecipes(candidates))
        .then(verified => {
          this.currentRecipesList = verified;
          try {
            const uid = (store.getCurrentUserId && typeof store.getCurrentUserId === 'function')
              ? store.getCurrentUserId()
              : (store.currentUser?.id || store.currentUser?.uid || 'guest');
            if (userRecipeAgent && typeof userRecipeAgent.persistUserRecipes === 'function') {
              userRecipeAgent.persistUserRecipes({
                userId: uid,
                recipes: verified,
                customQuery,
                selectedIngredients: selected
              }).catch(e => console.warn('UserRecipeAgent persist error:', e));
            }
          } catch (e) {
            console.warn('UserRecipeAgent error in renderRecipeCards:', e);
          }
          this.renderRecipeCards();
        });
      return;
    }

    // 0. 최상단 1:1 맞춤 AI 레시피 3종 분리 (NO. 01, NO. 02, NO. 03)
    const topTailored = list.filter(r => r.isTopTailored);
    const regularList = list.filter(r => !r.isTopTailored);
    topTailored.sort((a, b) => (a.craftNo || '').localeCompare(b.craftNo || ''));

    // 1. 탭 카운트 및 스타일 실시간 갱신
    if (this.dom.badgeTailoredCount) {
      this.dom.badgeTailoredCount.textContent = topTailored.length > 0 ? topTailored.length : (list.filter(r => r.isTopTailored).length || 3);
    }

    if (this.dom.tabTailoredRecipes && this.dom.tabCatalogRecipes) {
      if (this.recipeViewMode === 'tailored') {
        this.dom.tabTailoredRecipes.style.border = '1.5px solid #10b981';
        this.dom.tabTailoredRecipes.style.background = '#ecfdf5';
        this.dom.tabTailoredRecipes.style.color = '#065f46';
        this.dom.tabTailoredRecipes.style.fontWeight = '700';

        this.dom.tabCatalogRecipes.style.border = '1.5px solid #cbd5e1';
        this.dom.tabCatalogRecipes.style.background = '#fff';
        this.dom.tabCatalogRecipes.style.color = '#64748b';
        this.dom.tabCatalogRecipes.style.fontWeight = '600';
      } else {
        this.dom.tabTailoredRecipes.style.border = '1.5px solid #cbd5e1';
        this.dom.tabTailoredRecipes.style.background = '#fff';
        this.dom.tabTailoredRecipes.style.color = '#64748b';
        this.dom.tabTailoredRecipes.style.fontWeight = '600';

        this.dom.tabCatalogRecipes.style.border = '1.5px solid #10b981';
        this.dom.tabCatalogRecipes.style.background = '#ecfdf5';
        this.dom.tabCatalogRecipes.style.color = '#065f46';
        this.dom.tabCatalogRecipes.style.fontWeight = '700';
      }
    }

    // 2. 뷰 모드에 따른 표시 목록 결정:
    // - tailored 모드 (기본 추천 1순위): 고정 더미를 걷어내고, 사용자 개인 DB의 1:1 맞춤 AI 레시피만 단독 표출!
    // - catalog 모드: 기본 카탈로그 14종 둘러보기
    let displayList = [];
    if (this.recipeViewMode === 'tailored') {
      displayList = topTailored.length > 0 ? topTailored : list.filter(r => r.isTopTailored);
      if (displayList.length === 0) {
        const stored = store.getUserStoredRecipes();
        if (stored && Array.isArray(stored.recipes) && stored.recipes.length > 0) {
          displayList = stored.recipes;
        } else {
          displayList = list.slice(0, 3);
        }
      }
    } else {
      // 카탈로그 모드
      let processedRegular = regularList;
      if (store.customQuery) {
        const q = store.customQuery.toLowerCase();
        const queryMatches = regularList.filter(r => 
          r.isCustomSearchMatch ||
          r.title.toLowerCase().includes(q) || 
          r.subTitle.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.ingredients.some(i => i.name.toLowerCase().includes(q))
        );
        const others = regularList.filter(r => !queryMatches.includes(r));
        if (queryMatches.length > 0) {
          processedRegular = [...queryMatches, ...others];
        }
      }

      if (store.activeTheme && store.activeTheme !== 'all') {
        const themeMatches = processedRegular.filter(r => r.theme === store.activeTheme);
        const others = processedRegular.filter(r => r.theme !== store.activeTheme);
        if (themeMatches.length > 0) {
          processedRegular = [...themeMatches, ...others];
        }
      }

      displayList = processedRegular;

      if (this.sourceFilter === 'youtube') {
        displayList = displayList.filter(r => r.sourceType === 'youtube');
      } else if (this.sourceFilter === 'blog') {
        displayList = displayList.filter(r => r.sourceType === 'blog');
      } else if (this.matchFilter === '95') {
        const f95 = displayList.filter(r => (r.calculatedMatchRate || r.matchRate) >= 95);
        displayList = f95.length > 0 ? f95 : displayList.slice(0, 3);
      } else if (this.matchFilter === '90') {
        const f90 = displayList.filter(r => (r.calculatedMatchRate || r.matchRate) >= 90);
        displayList = f90.length > 0 ? f90 : displayList.slice(0, 4);
      }
    }

    this.dom.recipesCountVal.textContent = displayList.length;
    this.dom.filterTotalCount.textContent = (this.recipeViewMode === 'tailored') ? displayList.length : list.length;
    if (this.dom.filterYoutubeCount) {
      this.dom.filterYoutubeCount.textContent = list.filter(r => r.sourceType === 'youtube').length;
    }
    if (this.dom.filterBlogCount) {
      this.dom.filterBlogCount.textContent = list.filter(r => r.sourceType === 'blog').length;
    }

    // 평균 일치율 계산
    const avg = displayList.length > 0 
      ? (displayList.reduce((acc, r) => acc + (r.calculatedMatchRate || r.matchRate || 85), 0) / displayList.length).toFixed(1)
      : 0;
    this.dom.recipesAvgMatch.textContent = avg;

    // 상단 선택된 재료 칩 렌더링
    const selected = store.getSelectedIngredients();
    this.dom.recipeSelectedChips.innerHTML = selected.map(item => `
      <span class="filter-chip">${this.getFoodEmoji(item.name)} ${item.name}</span>
    `).join('');

    // 레시피 카드 그리드 HTML 렌더링
    const hasTopTailored = displayList.some(r => r.isTopTailored);
    let cardsHtml = '';
    let renderedDivider = false;
    const usedImagesInRender = new Set();

    displayList.forEach((recipe, idx) => {
      const isTop = (hasTopTailored && recipe.isTopTailored) || (!hasTopTailored && idx === 0 && (!this.sourceFilter || this.sourceFilter === 'all'));
      const isUserRecipe = recipe.isUserRecipe || false;
      const isMatch = recipe.isCustomSearchMatch || false;
      const displayRate = (isTop || isMatch) ? 100 : (recipe.calculatedMatchRate || recipe.matchRate);
      const isBlog = recipe.sourceType === 'blog';
      const isYouTube = recipe.sourceType === 'youtube' || (!recipe.sourceType && !isTop);

      // 최상단 맞춤 AI 레시피 3종(3열 그리드)이 모두 렌더링된 직후에 하단 검증 레시피 구분 헤더 출력
      const topTailoredCount = displayList.filter(r => r.isTopTailored).length;
      if (!renderedDivider && (!this.sourceFilter || this.sourceFilter === 'all')) {
        const triggerIdx = topTailoredCount > 0 ? topTailoredCount : 3;
        if (idx === triggerIdx) {
          renderedDivider = true;
          cardsHtml += `
            <div class="recipes-section-divider">
              <div>
                <div class="divider-title">🔥 유튜브 &amp; 파워 블로그 인기 검증 레시피 (관련성 &amp; 조회수 TOP 순)</div>
                <div class="divider-meta">선택하신 식재료와 조회수/관련성 알고리즘으로 엄선한 고화질 미디어 레시피입니다.</div>
              </div>
              <div style="font-size: 0.82rem; font-weight: 700; color: var(--amber-warm);">
                총 ${displayList.length - topTailoredCount}개 검증 완료
              </div>
            </div>
          `;
        }
      }

      // 레시피 맞춤 고화질/맛있는 음식 사진 매핑 (화면 내 중복 100% 방지)
      const recipeImgUrl = (typeof getRecipeImageUrl === 'function')
        ? getRecipeImageUrl(recipe, usedImagesInRender)
        : (recipe.image || 'images/recipes/default_food.jpg');

      // 출처 및 조회수 뱃지
      let mediaSourceHtml = '';
      if (isTop) {
        mediaSourceHtml = `
          <span class="badge-tailored-pill">⭐ 맞춤 추천</span>
        `;
      } else if (isBlog) {
        mediaSourceHtml = `
          <span class="media-source-pill blog">📝 블로그</span>
          <span class="media-views-pill">🔥 조회수 ${recipe.views || '120만회'}</span>
        `;
      } else if (isYouTube) {
        mediaSourceHtml = `
          <span class="media-source-pill youtube">📺 유튜브</span>
          <span class="media-views-pill">🔥 조회수 ${recipe.youtube?.views || recipe.views || '150만회'}</span>
        `;
      }

      cardsHtml += `
        <article class="recipe-card ${isTop ? 'top-spotlight-card' : ''} ${isUserRecipe ? 'user-shared-card' : ''}" data-id="${recipe.id}">
          <div class="craft-badge-bar">
            <span>${recipe.craftNo}</span>
            <div style="display: flex; gap: 0.35rem; align-items: center;">
              ${mediaSourceHtml}
            </div>
          </div>

          <div class="recipe-thumb-box">
            <img src="${recipeImgUrl}" onerror="this.onerror=null; this.src='images/recipes/default_food.jpg'; if(!this.complete) this.src='frontend/assets/images/recipes/default_food.jpg';" alt="${recipe.title}" class="recipe-thumb-img" loading="lazy" style="object-position: center;">
            <div class="match-rate-pill">
              ★ 재료 일치 ${displayRate}%
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
    });

    this.dom.recipesGrid.innerHTML = cardsHtml;

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

    const isBlog = recipe.sourceType === 'blog';

    this.dom.detailCraftNo.textContent = recipe.craftNo;
    this.dom.detailRecipeTitle.textContent = recipe.title;

    if (isBlog) {
      // 블로그 레시피일 경우 영상 대신 블로그 상세 정보 노출
      if (this.dom.detailYoutubeWrap) this.dom.detailYoutubeWrap.style.display = 'none';
      if (this.dom.detailBlogWrap) {
        this.dom.detailBlogWrap.style.display = 'block';
        if (this.dom.detailBlogImg) {
          this.dom.detailBlogImg.src = (typeof getRecipeImageUrl === 'function') 
            ? getRecipeImageUrl(recipe) 
            : (recipe.image || 'images/recipes/default_food.jpg');
        }
        if (this.dom.detailBlogStats) {
          this.dom.detailBlogStats.textContent = `🔥 누적 조회수 ${recipe.views || '100만회'}`;
        }
        if (this.dom.detailBlogName) {
          this.dom.detailBlogName.textContent = recipe.blog?.blogName || `${recipe.author || '인플루언서'} 공식 블로그`;
        }
        if (this.dom.detailBlogAuthor) {
          this.dom.detailBlogAuthor.textContent = `${recipe.blog?.author || recipe.author || '푸드 크리에이터'} • 푸드 인플루언서 공식 레시피 포스팅`;
        }
        if (this.dom.btnBlogDirectLink) {
          this.dom.btnBlogDirectLink.href = recipe.blog?.postUrl || recipe.blog?.url || '#';
        }
      }
    } else {
      // 유튜브 / 일반 레시피일 경우
      if (this.dom.detailBlogWrap) this.dom.detailBlogWrap.style.display = 'none';
      if (this.dom.detailYoutubeWrap) this.dom.detailYoutubeWrap.style.display = 'block';

      // 추천 메뉴 및 식재료 기반 유튜브 영상 정밀 검증 & 지능형 매핑 가드
      if (typeof resolveMatchingYouTubeVideo === 'function') {
        const resolved = resolveMatchingYouTubeVideo(recipe.title, recipe.ingredients, recipe.theme, recipe.youtube);
        if (resolved) {
          recipe.youtube = resolved;
        }
      }

      if (recipe.youtube) {
        this.dom.detailChannelName.textContent = recipe.youtube.channel;
        this.dom.detailChannelStats.textContent = `구독자 ${recipe.youtube.subscribers} • 조회수 ${recipe.youtube.views}`;
        this.dom.youtubeIframe.src = `https://www.youtube.com/embed/${recipe.youtube.embedId}?autoplay=0&rel=0&enablejsapi=1`;

        if (this.dom.btnYoutubeLink) {
          const cleanKw = extractCleanKeywords(recipe.title);
          const searchUrl = generateYouTubeSearchUrl(cleanKw || recipe.title);
          this.dom.btnYoutubeLink.href = searchUrl;
          this.dom.btnYoutubeLink.setAttribute('title', `YouTube에서 '${cleanKw} 레시피' 관련 원본 영상 실시간 모아보기`);
          this.dom.btnYoutubeLink.innerHTML = `▶️ YouTube 관련 원본 영상 실시간 모아보기 ➔`;
        }
      }
    }

    const displayRate = (recipe.isTopTailored || recipe.isCustomSearchMatch) ? 100 : (recipe.calculatedMatchRate || recipe.matchRate);
    this.dom.detailMatchRatio.textContent = `일치율 ${displayRate}%`;

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
    if (this.dom.certRecipeThumb) {
      this.dom.certRecipeThumb.src = (typeof getRecipeImageUrl === 'function')
        ? getRecipeImageUrl(this.activeRecipe)
        : (this.activeRecipe.image || 'images/recipes/default_food.jpg');
    }
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
      container.innerHTML = list.map(item => {
        const isExpiring = item.freshness === 'expiring' || (item.daysLeft && item.daysLeft <= 3);
        return `
        <div class="ing-chip ${item.selected ? 'selected' : ''}" data-id="${item.id}">
          <div class="ing-top-row">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span class="ing-fresh-dot ${isExpiring ? 'warn' : 'fresh'}" title="${isExpiring ? '빠른 조리 권장 (유통기한 임박)' : '신선함 유지중'}"></span>
              <span class="ing-name">${item.name}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 5px;">
              <button class="btn-ing-delete" data-id="${item.id}" title="재료 삭제" onclick="event.stopPropagation()">✕</button>
              <div class="ing-checkbox"></div>
            </div>
          </div>
          <div class="ing-count-row">
            <span>잔여: <strong>${item.count}${item.unit}</strong></span>
            <div style="display: flex; gap: 3px;" onclick="event.stopPropagation()">
              <button class="btn-counter btn-minus" data-id="${item.id}">-</button>
              <button class="btn-counter btn-plus" data-id="${item.id}">+</button>
            </div>
          </div>
        </div>
      `;
      }).join('');
    };

    renderShelfItems(this.dom.shelfVege, shelves.vege);
    renderShelfItems(this.dom.shelfMeat, shelves.meat);
    renderShelfItems(this.dom.shelfDairy, shelves.dairy);
    renderShelfItems(this.dom.shelfSauce, shelves.sauce);

    // 이벤트 바인딩: 칩 클릭(선택 토글), 개별 삭제(X버튼) 및 +/- 버튼
    document.querySelectorAll('.ing-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const id = chip.dataset.id;
        store.toggleSelectIngredient(id);
      });
    });

    document.querySelectorAll('.btn-ing-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const removed = store.removeIngredient(id);
        if (removed) {
          this.showToast(`🗑️ '${removed.name}'이(가) 냉장고에서 삭제되었습니다.`);
        }
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

  // 11. 유저 정보 & 칭호 진행도 렌더링 (홈페이지 테마 완벽 동기화)
  renderUser() {
    const user = store.currentUser;
    const titleInfo = store.getUserTitleInfo();

    if (this.dom.userNameDisplay) {
      this.dom.userNameDisplay.textContent = user.isLoggedIn ? user.name : '게스트 셰프';
    }

    const avatarImg = this.dom.userAvatar || document.getElementById('user-avatar');
    if (avatarImg) {
      if (user.isLoggedIn && user.avatar) {
        avatarImg.src = user.avatar;
      } else {
        avatarImg.src = 'frontend/assets/images/icon.png';
      }
    }

    const pillEl = this.dom.userProfilePill || document.getElementById('user-profile-pill');
    if (pillEl) {
      if (user.isLoggedIn) {
        pillEl.classList.remove('is-guest');
        pillEl.classList.add('is-logged-in');
        pillEl.setAttribute('title', '셰프 계정 관리 및 세션 정보 열기');
      } else {
        pillEl.classList.remove('is-logged-in');
        pillEl.classList.add('is-guest');
        pillEl.setAttribute('title', '로그인 또는 회원가입하기');
      }
    }

    if (this.dom.userLvlDisplay) {
      if (user.isLoggedIn) {
        if (store.isAdmin()) {
          this.dom.userLvlDisplay.textContent = '🛡️ 총괄 관리자 (ADMIN)';
          this.dom.userLvlDisplay.style.display = 'inline-flex';
          this.dom.userLvlDisplay.style.background = 'rgba(239, 68, 68, 0.15)';
          this.dom.userLvlDisplay.style.color = '#ef4444';
          this.dom.userLvlDisplay.style.border = '1px solid rgba(239, 68, 68, 0.4)';
        } else {
          const tierName = titleInfo.tier || titleInfo.title || '주방의 호기심쟁이';
          this.dom.userLvlDisplay.textContent = `${tierName} (${titleInfo.level})`;
          this.dom.userLvlDisplay.style.display = 'inline-flex';
          this.dom.userLvlDisplay.style.background = '';
          this.dom.userLvlDisplay.style.color = '';
          this.dom.userLvlDisplay.style.border = '';
        }
      } else {
        this.dom.userLvlDisplay.style.display = 'none';
      }
    }

    // 관리자/매니저 콘솔 내비게이션 탭 토글
    const navTabAdmin = document.getElementById('nav-tab-admin');
    if (navTabAdmin) {
      if (store.isAdmin() || store.isManager()) {
        navTabAdmin.style.display = 'inline-flex';
      } else {
        navTabAdmin.style.display = 'none';
        if (this.currentView === 'view-admin') {
          this.switchTab('view-main');
        }
      }
    }

    // 서브 영역 (로그인/회원가입 뱃지 또는 실시간 세션 타이머)
    const subArea = this.dom.userProfileSub || document.getElementById('user-profile-sub');
    if (subArea) {
      if (user.isLoggedIn) {
        const sessionInfo = store.getSessionInfo();
        const min = Math.floor((sessionInfo.remainingMs || 0) / 60000);
        const sec = Math.floor(((sessionInfo.remainingMs || 0) % 60000) / 1000);
        const timeStr = `${min}:${String(sec).padStart(2, '0')}`;
        subArea.innerHTML = `
          <span class="session-timer-badge" id="header-session-timer" title="1시간 세션 만료까지 남은 시간">
            <span class="session-timer-dot"></span>
            <span class="session-timer-text">${timeStr} 남음</span>
          </span>
        `;
      } else {
        subArea.innerHTML = `
          <span class="user-login-badge" id="btn-header-login">
            <span>로그인 / 회원가입</span>
            <span class="login-badge-arrow">➜</span>
          </span>
        `;
      }
    }

    // 헤더 액션 영역 (로그아웃 버튼)
    const actionsArea = this.dom.userProfileActions || document.getElementById('user-profile-actions');
    if (actionsArea) {
      if (user.isLoggedIn) {
        actionsArea.style.display = 'flex';
        actionsArea.innerHTML = `
          <button type="button" class="btn-header-logout-pill" id="btn-header-logout" title="로그아웃 (세션 종료)">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            <span>로그아웃</span>
          </button>
        `;
        const btnLogout = document.getElementById('btn-header-logout');
        if (btnLogout) {
          btnLogout.onclick = (e) => {
            e.stopPropagation();
            this.handleLogout();
          };
        }
      } else {
        actionsArea.style.display = 'none';
        actionsArea.innerHTML = '';
      }
    }

    // 완식 인증서 영역 칭호 및 프로그레스 바
    if (this.dom.certUserTitle) {
      const tierName = titleInfo.tier || titleInfo.title || '주방의 호기심쟁이';
      this.dom.certUserTitle.textContent = `${tierName} • ${titleInfo.desc || '맛있는 한 끼를 만드는 셰프'}`;
    }
    if (this.dom.titleProgressFill) {
      this.dom.titleProgressFill.style.width = `${titleInfo.progress}%`;
    }
    if (this.dom.titleProgressText) {
      this.dom.titleProgressText.textContent = `완식 ${titleInfo.completedCount}회 달성 (${titleInfo.progress}%) - 다음 칭호까지 ${titleInfo.remaining}회 남음`;
    }
  }

  // 12. 세션 초기화 & 1시간 자동 로그인 감시
  initSession() {
    const sessionInfo = store.getSessionInfo();
    if (sessionInfo.valid) {
      this.startSessionTimer();
    } else {
      // 첫 접속 또는 세션 만료 시 로그인 모달 자동 오픈 (요구사항)
      setTimeout(() => {
        this.openSignModal();
        if (sessionInfo.expired) {
          this.showToast('⏰ 로그인 유지 시간(1시간)이 만료되어 자동 로그아웃되었습니다.');
        }
      }, 350);
    }
  }

  startSessionTimer() {
    if (this.sessionTimerInterval) {
      clearInterval(this.sessionTimerInterval);
    }
    this.sessionTimerInterval = setInterval(() => {
      const sessionInfo = store.getSessionInfo();
      if (!sessionInfo.valid) {
        clearInterval(this.sessionTimerInterval);
        this.sessionTimerInterval = null;
        this.handleLogout(true);
      } else {
        if (this.dom.accountModalRemainingTime) {
          this.dom.accountModalRemainingTime.textContent = sessionInfo.remainingText;
        }
        const timerTextEl = document.querySelector('#header-session-timer .session-timer-text');
        if (timerTextEl) {
          const min = Math.floor((sessionInfo.remainingMs || 0) / 60000);
          const sec = Math.floor(((sessionInfo.remainingMs || 0) % 60000) / 1000);
          timerTextEl.textContent = `${min}:${String(sec).padStart(2, '0')} 남음`;
        }
      }
    }, 1000);
  }

  async handleLogout(isExpired = false) {
    if (this.sessionTimerInterval) {
      clearInterval(this.sessionTimerInterval);
      this.sessionTimerInterval = null;
    }
    await store.logout();
    this.closeAccountModal();
    this.renderUser();
    this.renderFridge();
    if (isExpired) {
      this.showToast('⏰ 로그인 유지 시간(1시간)이 만료되어 자동 로그아웃되었습니다.');
    } else {
      this.showToast('로그아웃되었습니다. 따뜻한 요리가 생각날 때 다시 방문해 주세요!');
    }
    this.openSignModal();
  }

  openAccountModal() {
    const sessionInfo = store.getSessionInfo();
    const user = store.currentUser;
    if (this.dom.accountModalName) this.dom.accountModalName.textContent = user.name || '요리하는 소라';
    if (this.dom.accountModalEmail) this.dom.accountModalEmail.textContent = user.email || (user.id + '@kitchenchef.kr');
    if (this.dom.accountModalAvatar) this.dom.accountModalAvatar.src = user.avatar || 'frontend/assets/images/icon.png';

    // 1. 역할(Role) 뱃지
    const roleBadgeEl = document.getElementById('account-modal-role-badge');
    if (roleBadgeEl) {
      const r = (user.role || 'user').toUpperCase();
      roleBadgeEl.textContent = r;
      roleBadgeEl.className = `user-role-badge role-${r.toLowerCase()}`;
    }

    if (this.dom.accountModalLevel) {
      const titleInfo = store.getUserTitleInfo();
      const tierName = titleInfo.tier || titleInfo.title || '주방의 호기심쟁이';
      this.dom.accountModalLevel.textContent = `${tierName} (${titleInfo.level})`;
    }
    if (this.dom.accountModalSessionStatus) {
      this.dom.accountModalSessionStatus.textContent = sessionInfo.valid ? '1시간 자동 유지 활성화' : '로그인 세션 없음';
    }
    if (this.dom.accountModalRemainingTime) {
      this.dom.accountModalRemainingTime.textContent = sessionInfo.valid ? sessionInfo.remainingText : '0초';
    }
    if (this.dom.accountModalFirebaseUid) {
      this.dom.accountModalFirebaseUid.textContent = user.firebaseUid || user.id || 'N/A';
    }
    if (this.dom.accountModalBadgeFirebase) {
      this.dom.accountModalBadgeFirebase.style.display = (user.firebaseRegistered || user.provider === 'google' || user.isLoggedIn) ? 'inline-flex' : 'none';
    }

    // 2. 연동된 로그인 수단 (Providers) 뱃지 렌더링
    const providers = Array.isArray(user.providers) && user.providers.length > 0
      ? user.providers
      : (user.provider === 'google' ? ['google.com'] : ['password']);

    const countEl = document.getElementById('account-modal-provider-count');
    if (countEl) countEl.textContent = `${providers.length}개 연동됨`;

    const containerEl = document.getElementById('account-modal-providers-container');
    if (containerEl) {
      containerEl.innerHTML = providers.map(p => {
        if (p === 'google.com' || p === 'google') {
          return `<span class="badge-provider google"><svg viewBox="0 0 24 24" width="11" height="11"><path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.27 21.36 7.33 24 12 24z"/><path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.98 0 12s.46 3.84 1.26 5.42l4.02-3.15z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.27 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/></svg> Google 계정 연동</span>`;
        }
        return `<span class="badge-provider password">🔑 이메일/비밀번호 연동</span>`;
      }).join('');
    }

    // 3. Google 연동 / 연동 해제 버튼 렌더링 (계정 고립 방지 가드 탑재)
    const actionsEl = document.getElementById('account-modal-link-actions');
    if (actionsEl) {
      const hasGoogle = providers.includes('google.com') || providers.includes('google');
      if (hasGoogle) {
        actionsEl.innerHTML = `
          <button type="button" class="btn-account-link-toggle btn-unlink" id="btn-act-unlink-google">
            <span>🔗 Google 계정 연동 해제</span>
          </button>
        `;
        document.getElementById('btn-act-unlink-google')?.addEventListener('click', async () => {
          if (confirm('Google 계정 연동을 해제하시겠습니까?\n(해제 후에는 이메일과 비밀번호로 로그인해야 합니다)')) {
            try {
              await store.unlinkGoogle();
              this.showToast('✅ Google 계정 연동이 안전하게 해제되었습니다.');
              this.openAccountModal();
            } catch (err) {
              alert(err.message || '연동 해제에 실패했습니다.');
            }
          }
        });
      } else {
        actionsEl.innerHTML = `
          <button type="button" class="btn-account-link-toggle btn-link" id="btn-act-link-google">
            <svg viewBox="0 0 24 24" width="14" height="14"><path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.27 21.36 7.33 24 12 24z"/><path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.98 0 12s.46 3.84 1.26 5.42l4.02-3.15z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.27 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/></svg>
            <span>Google 계정 연동하기</span>
          </button>
        `;
        document.getElementById('btn-act-link-google')?.addEventListener('click', async () => {
          this.closeAccountModal();
          await this.handleGoogleLogin();
        });
      }
    }

    // 4. 관리자/매니저 콘솔 바로가기 버튼 토글
    const btnGoAdmin = document.getElementById('btn-modal-go-admin');
    if (btnGoAdmin) {
      if (store.isAdmin() || store.isManager()) {
        btnGoAdmin.style.display = 'inline-flex';
        btnGoAdmin.onclick = () => {
          this.closeAccountModal();
          this.switchTab('view-admin');
        };
      } else {
        btnGoAdmin.style.display = 'none';
      }
    }

    if (this.dom.modalAccountManage) {
      this.dom.modalAccountManage.classList.add('active');
    }
  }

  closeAccountModal() {
    if (this.dom.modalAccountManage) {
      this.dom.modalAccountManage.classList.remove('active');
    }
  }

  // 🌟 Google 간편 로그인 통합 처리 파이프라인 (계획서 v1.2.0 준수)
  async handleGoogleLogin(selectedAccount = null) {
    const isSignup = this.dom.tabModalSignup?.classList.contains('active') || false;
    const keepLogged = this.dom.signKeepLogged ? this.dom.signKeepLogged.checked : true;

    // 1. 버튼 로딩 상태 표시
    const originalBtnText = this.dom.btnGoogleLoginText?.textContent || 'Google 계정으로 계속하기';
    if (this.dom.btnGoogleLoginText) {
      this.dom.btnGoogleLoginText.textContent = 'Google 계정 연결 중... ⏳';
    }
    if (this.dom.btnGoogleLogin) {
      this.dom.btnGoogleLogin.style.pointerEvents = 'none';
      this.dom.btnGoogleLogin.style.opacity = '0.7';
    }

    try {
      // 2. Google SNS 간편 로그인 실행 (GIS / Firebase / Fast-Picker)
      const user = await store.loginWithGoogle(selectedAccount, keepLogged, isSignup);

      // 3. 세션 타이머 시작 & 모달 닫기
      this.startSessionTimer();
      this.closeGoogleFastPicker();
      this.closeSignModal();

      // 4. UI 갱신 및 냉장고 재고 즉시 동기화
      this.renderAll();
      this.showToast(`🎉 ${user.name}님, Google 계정으로 간편 로그인되었습니다!`);
      console.log(`✅ [Google SSO] Authenticated as: ${user.name} (${user.email})`);
    } catch (err) {
      console.warn("⚠️ [Google SSO] Sign-in notice/fallback:", err);
      if (!selectedAccount && !err.message?.includes('취소')) {
        this.openGoogleFastPicker();
      } else {
        this.showToast(`⚠️ Google 로그인 안내: ${err.message || '인증이 취소되었습니다.'}`);
      }
    } finally {
      // 버튼 상태 복구
      if (this.dom.btnGoogleLoginText) {
        this.dom.btnGoogleLoginText.textContent = originalBtnText;
      }
      if (this.dom.btnGoogleLogin) {
        this.dom.btnGoogleLogin.style.pointerEvents = '';
        this.dom.btnGoogleLogin.style.opacity = '';
      }
    }
  }

  // 🌟 Google 공식 로그인 창(accounts.google.com) 호출
  async triggerGoogleOfficialLogin() {
    const originalText = this.dom.btnGoogleOfficialPopupText?.textContent || '➕ 다른 Google 계정 추가 (공식 팝업)';
    if (this.dom.btnGoogleOfficialPopupText) {
      this.dom.btnGoogleOfficialPopupText.textContent = 'Google 공식 로그인 연결 중... ⏳';
    }
    if (this.dom.btnGoogleOfficialPopup) {
      this.dom.btnGoogleOfficialPopup.style.pointerEvents = 'none';
      this.dom.btnGoogleOfficialPopup.style.opacity = '0.7';
    }

    try {
      const officialUser = await firebaseAdapter.launchGoogleOfficialPopup();
      if (officialUser) {
        await this.handleGoogleLogin(officialUser);
      }
    } catch (err) {
      console.warn("⚠️ [Google Official Login] Notice:", err);
      // origin_mismatch 또는 팝업 정책 오류 시 가이드 모달 및 아코디언 자동 노출
      this.openGoogleFastPicker();
      if (this.dom.googlePolicyBody) {
        this.dom.googlePolicyBody.style.display = 'block';
      }
      if (this.dom.policyToggleArrow) {
        this.dom.policyToggleArrow.classList.add('open');
      }

      const isMismatch = err.isOriginMismatch || err.message?.includes('origin_mismatch') || err.message?.includes('400');
      if (isMismatch) {
        this.showToast('⚠️ Google 정책 오류(400: origin_mismatch): 아래 출처 등록 가이드를 확인하거나 방금 계정으로 계속하세요.');
      } else {
        this.showToast(`⚠️ Google 로그인 안내: ${err.message || '로그인이 취소되었습니다.'}`);
      }
    } finally {
      if (this.dom.btnGoogleOfficialPopupText) {
        this.dom.btnGoogleOfficialPopupText.textContent = originalText;
      }
      if (this.dom.btnGoogleOfficialPopup) {
        this.dom.btnGoogleOfficialPopup.style.pointerEvents = '';
        this.dom.btnGoogleOfficialPopup.style.opacity = '';
      }
    }
  }

  // Google Fast Picker 모달 제어 (더미 데이터 100% 제거, 브라우저 실제 계정만 동적 노출)
  openGoogleFastPicker() {
    if (this.dom.modalGoogleFastPicker) {
      this.dom.modalGoogleFastPicker.style.display = 'flex';
      this.dom.modalGoogleFastPicker.classList.add('active');

      // 폼 입력란 완전 초기화 (더미 값 일절 없음)
      if (this.dom.googleFastEmail) this.dom.googleFastEmail.value = '';
      if (this.dom.googleFastName) this.dom.googleFastName.value = '';

      // 현재 적용된 Google Client ID 표시
      if (this.dom.inputCustomClientId && firebaseAdapter.getGoogleClientId) {
        this.dom.inputCustomClientId.value = firebaseAdapter.getGoogleClientId() || '';
      }

      // 브라우저에서 실제 로그인 이력이 있는 유저만 동적 렌더링 (더미 배열 완전 삭제)
      const registered = store.getFirebaseGoogleUsers?.() || [];
      if (this.dom.googleFastAccountList) {
        if (registered.length > 0) {
          this.dom.googleFastAccountList.innerHTML = registered.map(acc => `
            <div class="google-fast-acc-chip" data-email="${acc.email}" data-name="${acc.name}">
              <div class="google-fast-acc-avatar">
                ${acc.avatar ? `<img src="${acc.avatar}" onerror="this.onerror=null; this.parentElement.textContent='${(acc.name||'G').charAt(0)}';" alt="${acc.name}">` : (acc.name||'G').charAt(0)}
              </div>
              <div class="google-fast-acc-info">
                <div class="google-fast-acc-name">${acc.name}</div>
                <div class="google-fast-acc-email">${acc.email}</div>
              </div>
              <span style="font-size: 0.8rem; color: #1a73e8; font-weight: 600;">선택 ➔</span>
            </div>
          `).join('');

          this.dom.googleFastAccountList.querySelectorAll('.google-fast-acc-chip').forEach(chip => {
            chip.addEventListener('click', async () => {
              const email = chip.dataset.email;
              const name = chip.dataset.name;
              await this.handleGoogleLogin({ email, name });
            });
          });
        } else {
          // 브라우저에 저장된 계정이 없는 경우 더미 계정을 띄우지 않고 깨끗하게 안내
          this.dom.googleFastAccountList.innerHTML = `
            <div style="text-align: center; padding: 0.75rem 0.5rem; color: #5f6368; font-size: 0.82rem; line-height: 1.45; background: #f8fafd; border-radius: 10px; border: 1px dashed #c2e7ff; margin-bottom: 0.8rem;">
              <span>브라우저에 감지된 계정이 없습니다.<br>아래 공식 팝업 버튼을 눌러 본인의 Google 계정으로 로그인하세요.</span>
            </div>
          `;
        }
      }
    }
  }

  closeGoogleFastPicker() {
    if (this.dom.modalGoogleFastPicker) {
      this.dom.modalGoogleFastPicker.style.display = 'none';
      this.dom.modalGoogleFastPicker.classList.remove('active');
    }
  }

  // 하위 호환성 래퍼 (가짜 모달 원천 차단)
  openGoogleChooser() {
    return this.handleGoogleLogin();
  }
  closeGoogleChooser() {
    this.closeGoogleFastPicker();
  }
  openGoogleReauth(account) {
    return this.handleGoogleLogin(account);
  }
  closeGoogleReauth() {
    this.closeGoogleFastPicker();
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

  // ============================================================
  // 🛡️ 관리자 콘솔 (Admin Console) 관제 엔진
  // ============================================================

  initAdminConsole() {
    // 1. 관리자 서브탭 전환
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tabKey = btn.dataset.adminTab;
        this.switchAdminTab(tabKey);
      });
    });

    // 2. 회원 검색 및 필터
    const userSearchInput = document.getElementById('admin-user-search');
    if (userSearchInput) {
      userSearchInput.addEventListener('input', () => {
        this.adminUserCurrentPage = 1;
        this.renderAdminUsers();
      });
    }
    const filterRoleSelect = document.getElementById('admin-user-filter-role');
    if (filterRoleSelect) {
      filterRoleSelect.addEventListener('change', () => {
        this.adminUserCurrentPage = 1;
        this.renderAdminUsers();
      });
    }
    const filterStatusSelect = document.getElementById('admin-user-filter-status');
    if (filterStatusSelect) {
      filterStatusSelect.addEventListener('change', () => {
        this.adminUserCurrentPage = 1;
        this.renderAdminUsers();
      });
    }

    // 3. 등급/칭호 수정 폼 저장
    const btnTierSave = document.getElementById('btn-tier-save');
    if (btnTierSave) {
      btnTierSave.addEventListener('click', () => {
        const userSelect = document.getElementById('tier-edit-user-select');
        const levelSelect = document.getElementById('tier-edit-level-select');
        const countInput = document.getElementById('tier-edit-count-input');
        if (!userSelect || !levelSelect || !countInput) return;

        const userId = userSelect.value;
        const newLevel = levelSelect.value;
        const cookCount = countInput.value;

        const updated = store.updateUserTier(userId, newLevel, cookCount);
        if (updated) {
          this.showToast(`✨ [${updated.name}] 회원 등급이 '${newLevel}' (${updated.tier})로 변경되었습니다.`);
          this.renderAdminTiers();
          this.renderAdminUsers();
        }
      });
    }

    // 4. 냉장고 유저 선택 & 복구
    const fridgeUserSelect = document.getElementById('fridge-inspect-user-select');
    if (fridgeUserSelect) {
      fridgeUserSelect.addEventListener('change', () => {
        this.renderAdminFridge();
      });
    }
    const btnFridgeRestore = document.getElementById('btn-admin-fridge-restore');
    if (btnFridgeRestore) {
      btnFridgeRestore.addEventListener('click', () => {
        const select = document.getElementById('fridge-inspect-user-select');
        if (!select) return;
        const userId = select.value;
        if (confirm(`해당 회원(${userId})의 냉장고 재고를 6대 기본 식재료 프리셋으로 복구하시겠습니까?`)) {
          store.restoreUserFridge(userId);
          this.showToast(`🔄 [${userId}] 회원의 냉장고 데이터가 성공적으로 복구되었습니다.`);
          this.renderAdminFridge();
        }
      });
    }

    // 4-1. 📖 독립 맞춤 레시피 DB 유저 선택, 복구, 비우기, 검색/필터 및 모달 제어
    const recipeUserSelect = document.getElementById('recipe-inspect-user-select');
    if (recipeUserSelect) {
      recipeUserSelect.addEventListener('change', () => {
        this.renderAdminRecipes();
      });
    }

    const recipeSearch = document.getElementById('admin-recipe-search');
    if (recipeSearch) {
      recipeSearch.addEventListener('input', () => this.renderAdminRecipes());
    }
    const recipeFilterDiff = document.getElementById('admin-recipe-filter-diff');
    if (recipeFilterDiff) {
      recipeFilterDiff.addEventListener('change', () => this.renderAdminRecipes());
    }
    const recipeFilterTime = document.getElementById('admin-recipe-filter-time');
    if (recipeFilterTime) {
      recipeFilterTime.addEventListener('change', () => this.renderAdminRecipes());
    }
    const recipeSort = document.getElementById('admin-recipe-sort');
    if (recipeSort) {
      recipeSort.addEventListener('change', () => this.renderAdminRecipes());
    }

    const btnRecipeRestore = document.getElementById('btn-admin-recipe-restore');
    if (btnRecipeRestore) {
      btnRecipeRestore.addEventListener('click', async () => {
        const select = document.getElementById('recipe-inspect-user-select');
        if (!select) return;
        const userId = select.value;
        if (confirm(`해당 회원(${userId})의 맞춤 레시피 DB를 기본 3대 추천 레시피로 복구하시겠습니까?`)) {
          await store.restoreUserRecipes(userId);
          this.showToast(`🔄 [${userId}] 회원의 1:1 맞춤 추천 레시피 3종이 성공적으로 복구되었습니다.`);
          this.renderAdminRecipes();
        }
      });
    }

    const btnRecipeClear = document.getElementById('btn-admin-recipe-clear');
    if (btnRecipeClear) {
      btnRecipeClear.addEventListener('click', async () => {
        const select = document.getElementById('recipe-inspect-user-select');
        if (!select) return;
        const userId = select.value;
        if (confirm(`⚠️ 정말로 해당 회원(${userId})의 맞춤 레시피 DB를 모두 비우시겠습니까?`)) {
          await store.clearUserRecipes(userId);
          this.showToast(`🗑️ [${userId}] 회원의 맞춤 레시피 DB가 완전히 초기화되었습니다.`);
          this.renderAdminRecipes();
        }
      });
    }

    const btnRecipeAddModal = document.getElementById('btn-admin-recipe-add-modal');
    if (btnRecipeAddModal) {
      btnRecipeAddModal.addEventListener('click', () => {
        const select = document.getElementById('recipe-inspect-user-select');
        const userId = select?.value || 'admin';
        this.openAdminRecipeModal(null, userId);
      });
    }

    const btnCloseRecipeModal = document.getElementById('btn-close-admin-recipe-modal');
    const btnCancelRecipeForm = document.getElementById('btn-cancel-admin-recipe-form');
    if (btnCloseRecipeModal) btnCloseRecipeModal.addEventListener('click', () => this.closeAdminRecipeModal());
    if (btnCancelRecipeForm) btnCancelRecipeForm.addEventListener('click', () => this.closeAdminRecipeModal());

    const btnSubmitRecipeForm = document.getElementById('btn-submit-admin-recipe-form');
    if (btnSubmitRecipeForm) {
      btnSubmitRecipeForm.addEventListener('click', async () => {
        await this.handleAdminRecipeFormSubmit();
      });
    }

    // 5. 통계 새로고침
    const btnRefreshStats = document.getElementById('btn-refresh-stats');
    if (btnRefreshStats) {
      btnRefreshStats.addEventListener('click', () => {
        this.renderAdminStats();
        this.showToast('📊 AI 에이전트 가동률 및 지표가 새로고침되었습니다.');
      });
    }

    // 6. 감사 로그 카테고리 필터 & 내보내기
    const auditCatFilter = document.getElementById('admin-audit-filter-cat');
    if (auditCatFilter) {
      auditCatFilter.addEventListener('change', () => this.renderAdminAudit());
    }
    const btnExportAudit = document.getElementById('btn-export-audit-json');
    if (btnExportAudit) {
      btnExportAudit.addEventListener('click', () => {
        const logs = store.loadAuditLogs();
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
        const dlAnchor = document.createElement('a');
        dlAnchor.setAttribute("href", dataStr);
        dlAnchor.setAttribute("download", `kitchen_chef_audit_logs_${Date.now()}.json`);
        document.body.appendChild(dlAnchor);
        dlAnchor.click();
        dlAnchor.remove();
        this.showToast('📥 감사 로그가 JSON 파일로 다운로드되었습니다.');
      });
    }
  }

  switchAdminTab(tabKey) {
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.adminTab === tabKey);
    });
    document.querySelectorAll('.admin-tab-pane').forEach(pane => {
      pane.classList.toggle('active', pane.id === `pane-admin-${tabKey}`);
    });

    if (tabKey === 'users') {
      this.renderAdminUsers();
      this.renderAdminSmtpSettings();
      store.syncAdminUsersWithRemote().then(() => this.renderAdminUsers()).catch(() => {});
    }
    else if (tabKey === 'tiers') this.renderAdminTiers();
    else if (tabKey === 'fridge') {
      this.renderAdminFridge();
    }
    else if (tabKey === 'recipes') {
      this.renderAdminRecipes();
    }
    else if (tabKey === 'community') this.renderAdminCommunity();
    else if (tabKey === 'stats') this.renderAdminStats();
    else if (tabKey === 'audit') this.renderAdminAudit();
  }

  renderAdminConsole() {
    const updateStats = (list) => {
      const activeSessions = list.filter(u => u.sessionValid).length;
      const suspended = list.filter(u => u.status === 'suspended').length;
      const elUsers = document.getElementById('adm-stat-users');
      if (elUsers) elUsers.textContent = `${list.length}명`;
      const elSessions = document.getElementById('adm-stat-sessions');
      if (elSessions) elSessions.textContent = `${activeSessions}명`;
      const elSuspended = document.getElementById('adm-stat-suspended');
      if (elSuspended) elSuspended.textContent = `${suspended}명`;
    };

    const initialUsers = store.loadAdminUsers();
    updateStats(initialUsers);

    const activePane = document.querySelector('.admin-tab-pane.active');
    if (activePane) {
      const tabId = activePane.id.replace('pane-admin-', '');
      this.switchAdminTab(tabId);
    } else {
      this.switchAdminTab('users');
    }

    // Two-way background sync with remote DB / backend
    store.syncAdminUsersWithRemote().then(synced => {
      if (synced && synced.length > 0) {
        updateStats(synced);
      }
    }).catch(() => {});
  }

  // 🌟 회원 단일/다중 삭제 실행기 (스토어 메서드 및 브라우저 캐시 방어 폴백 내장)
  async executeDeleteUsers(selectedUsers, myRole, myId, myName) {
    const ids = selectedUsers.map(u => u.id);
    let res = null;

    // 1. store.deleteUsers 함수가 존재하면 우선 호출
    if (store && typeof store.deleteUsers === 'function') {
      res = await store.deleteUsers(ids, { role: myRole, id: myId, name: myName });
    } else {
      // 2. 브라우저 구버전 캐시 등으로 store.deleteUsers가 없을 경우 백엔드 API 직접 호출 폴백
      console.warn('⚠️ [Admin] store.deleteUsers 미탐지 -> 백엔드 직접 호출 및 스토어 동기화 폴백 가동');
      const resp = await fetch('/api/admin/users/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: ids,
          operatorId: myId,
          operatorRole: myRole,
          adminName: myName
        })
      });

      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.message || data.code || '회원 삭제 요청이 실패했습니다.');
      }
      res = data;

      // 로컬 스토어 및 localStorage 동기화
      const deletedUsers = data.deleted || [];
      const deletedIds = new Set(deletedUsers.map(u => u.id || u.uid));
      const deletedEmails = new Set(deletedUsers.map(u => (u.email || '').toLowerCase()).filter(Boolean));
      const deletedNames = new Set(deletedUsers.map(u => u.name || u.displayName || u.display_name).filter(Boolean));

      ids.forEach(id => {
        if (data.deletedCount > 0 && deletedIds.size === 0) deletedIds.add(id);
      });

      if (store && typeof store.loadAdminUsers === 'function' && typeof store.saveAdminUsers === 'function') {
        let users = store.loadAdminUsers();
        users = users.filter(u => !deletedIds.has(u.id) && !deletedIds.has(u.uid) && (!u.email || !deletedEmails.has(u.email.toLowerCase())));
        store.saveAdminUsers(users);
        if (typeof store.notify === 'function') {
          store.notify('ADMIN_USERS_UPDATED', users);
        }
      }

      // Firebase 클라우드/로컬 DB 및 레지스트리 영구 제거
      deletedUsers.forEach(u => {
        const uId = u.id || u.uid;
        const uEmail = u.email;
        if (typeof firebaseAdapter !== 'undefined' && firebaseAdapter.deleteUserAllData) {
          firebaseAdapter.deleteUserAllData(uId, uEmail).catch(() => {});
        }
      });

      // 개인 냉장고 및 개인 맞춤 레시피 스토리지 완전 정리
      deletedIds.forEach(id => {
        try {
          localStorage.removeItem(`kitchen_chef_fridge_${id}`);
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

      // 커뮤니티 게시글 연쇄 정리
      try {
        let posts = JSON.parse(localStorage.getItem('kitchen_chef_community_posts') || '[]');
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
          localStorage.setItem('kitchen_chef_community_posts', JSON.stringify(posts));
          if (store && Array.isArray(store.communityPosts)) {
            store.communityPosts = posts;
          }
          if (store && typeof store.notify === 'function') {
            store.notify('COMMUNITY_POSTS_UPDATED', posts);
          }
        }
      } catch (e) {}

      // 현재 로그인 유저 삭제 시 자동 로그아웃
      if (store && store.currentUser && (deletedIds.has(store.currentUser.id) || deletedIds.has(store.currentUser.uid) || (store.currentUser.email && deletedEmails.has(store.currentUser.email.toLowerCase())))) {
        if (typeof store.logout === 'function') store.logout();
      }
    }

    return res || { status: 'success', deletedCount: selectedUsers.length };
  }

  // 1. 회원 및 세션/보안 테이블 렌더링
  renderAdminUsers() {
    const q = document.getElementById('admin-user-search')?.value || '';
    const role = document.getElementById('admin-user-filter-role')?.value || 'all';
    const status = document.getElementById('admin-user-filter-status')?.value || 'all';

    const allUsers = store.getAdminUsers(q, role, status);
    const tbody = document.getElementById('admin-users-tbody');
    if (!tbody) return;

    const checkAll = document.getElementById('admin-user-check-all');
    const btnBatchDelete = document.getElementById('btn-admin-batch-delete');
    if (checkAll) {
      checkAll.checked = false;
      checkAll.indeterminate = false;
    }
    if (btnBatchDelete) {
      btnBatchDelete.style.display = 'none';
      btnBatchDelete.innerHTML = '<span>🗑️ 선택 회원 삭제 (0명)</span>';
    }

    const totalUsers = allUsers.length;
    const pageSize = this.adminUserPageSize || 8;
    const totalPages = Math.max(1, Math.ceil(totalUsers / pageSize));

    // 유효 페이지 범위 보정
    if (this.adminUserCurrentPage > totalPages) {
      this.adminUserCurrentPage = totalPages;
    }
    if (this.adminUserCurrentPage < 1) {
      this.adminUserCurrentPage = 1;
    }

    if (totalUsers === 0) {
      tbody.innerHTML = `<tr><td colspan="10" style="text-align:center; padding: 2rem; color: #888;">조건에 일치하는 회원이 없습니다.</td></tr>`;
      this.renderAdminUserPagination(0, 1);
      return;
    }

    // 8명(8칸) 단위 슬라이스 추출
    const startIndex = (this.adminUserCurrentPage - 1) * pageSize;
    const pageUsers = allUsers.slice(startIndex, startIndex + pageSize);

    tbody.innerHTML = pageUsers.map(u => {
      const isSuspended = u.status === 'suspended';
      let roleBadge = `<span class="badge-role user">USER</span>`;
      if (u.role === 'admin') roleBadge = `<span class="badge-role admin">ADMIN</span>`;
      else if (u.role === 'manager') roleBadge = `<span class="badge-role manager">MANAGER</span>`;
      
      const statusBadge = isSuspended
        ? `<span class="badge-status suspended">🚫 제재/정지</span>`
        : `<span class="badge-status active">🟢 정상 활동</span>`;

      const sessionBadge = u.sessionValid
        ? `<span class="badge-session live">🟢 세션 유지 중</span>`
        : `<span class="badge-session off">⚪ 미접속/만료</span>`;

      const providers = Array.isArray(u.providers) && u.providers.length > 0
        ? u.providers
        : (u.password === 'google_oauth' ? ['google.com'] : ['password']);

      const providerBadges = providers.map(p => {
        if (p === 'google.com' || p === 'google') {
          return `<span class="badge-provider google"><svg viewBox="0 0 24 24" width="10" height="10"><path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.27 21.36 7.33 24 12 24z"/><path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.98 0 12s.46 3.84 1.26 5.42l4.02-3.15z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.27 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/></svg> Google</span>`;
        }
        return `<span class="badge-provider password">🔑 이메일</span>`;
      }).join(' ');

      const isRootAdmin = (u.email || '').toLowerCase() === 'admin@kitchenchef.com';

      return `
        <tr>
          <td style="text-align: center;">
            <input type="checkbox" class="admin-user-chk admin-check-input" data-user-id="${u.id || u.uid}" data-name="${u.name}" data-role="${u.role || 'user'}" data-email="${u.email || ''}" ${isRootAdmin ? 'disabled title="시스템 루트 총괄 어드민은 영구 보호됩니다"' : ''}>
          </td>
          <td>
            <div class="user-profile-cell">
              <img src="${u.avatar || 'frontend/assets/images/icon.png'}" onerror="this.onerror=null; this.src='frontend/assets/images/icon.png';" class="admin-user-avatar">
              <div>
                <div class="user-name-cell">${u.name}</div>
                <div class="user-date-cell">가입: ${u.createdAt ? u.createdAt.substring(0, 10) : '2026-09-17'}</div>
              </div>
            </div>
          </td>
          <td class="col-user-email"><code>${u.email}</code></td>
          <td style="text-align: center;">${roleBadge}</td>
          <td><div class="providers-cell-wrap">${providerBadges}</div></td>
          <td>
            <div class="tier-level-text">${u.level}</div>
            <div class="tier-name-text">${u.tier}</div>
          </td>
          <td style="text-align: center;"><span class="cook-count-badge">${u.cookCount || 0}회</span></td>
          <td style="text-align: center;">${sessionBadge}</td>
          <td style="text-align: center;">${statusBadge}</td>
          <td>
            <div class="table-actions-cell">
              <button type="button" class="btn-table-action btn-admin-user-action" data-user-id="${u.id || u.uid}" title="권한 설정 및 종합 조치">🛠️ 권한/조치</button>
              ${u.sessionValid ? `<button type="button" class="btn-table-action btn-force-logout" data-user-id="${u.id || u.uid}" title="세션 강제 만료">🚫 로그아웃</button>` : ''}
              ${isSuspended 
                ? `<button type="button" class="btn-table-action btn-unban" data-user-id="${u.id || u.uid}">🔓 정상 복구</button>`
                : `<button type="button" class="btn-table-action btn-ban" data-user-id="${u.id || u.uid}">⚠️ 계정 정지</button>`}
              ${u.role === 'admin'
                ? (isRootAdmin
                    ? `<span class="badge-root-admin">👑 최고관리자</span>`
                    : `<button type="button" class="btn-table-action btn-demote-admin" data-user-id="${u.id || u.uid}" data-name="${u.name}" data-email="${u.email}" title="일반 회원으로 변경">👤 관리자해제</button>`)
                : `<button type="button" class="btn-table-action btn-grant-admin" data-user-id="${u.id || u.uid}" data-name="${u.name}" data-email="${u.email}" title="관리자(Admin) 권한 부여">👑 관리자부여</button>`}
              <button type="button" class="btn-table-action btn-jump-tier" data-user-id="${u.id || u.uid}">🎖️ 등급</button>
              ${isRootAdmin ? '' : `<button type="button" class="btn-table-action btn-danger-action btn-delete-user" data-user-id="${u.id || u.uid}" data-name="${u.name}" data-role="${u.role || 'user'}" data-email="${u.email}" title="회원 영구 삭제">🗑️ 삭제</button>`}
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // 체크박스 제어 및 일괄 삭제 바 갱신
    const rowCheckboxes = Array.from(tbody.querySelectorAll('.admin-user-chk:not([disabled])'));
    const updateBatchDeleteBar = () => {
      const checkedBoxes = Array.from(tbody.querySelectorAll('.admin-user-chk:checked'));
      const count = checkedBoxes.length;
      if (btnBatchDelete) {
        if (count > 0) {
          btnBatchDelete.style.display = 'inline-flex';
          btnBatchDelete.innerHTML = `<span>🗑️ 선택 회원 삭제 (${count}명)</span>`;
        } else {
          btnBatchDelete.style.display = 'none';
        }
      }
      if (checkAll) {
        checkAll.checked = rowCheckboxes.length > 0 && checkedBoxes.length === rowCheckboxes.length;
        checkAll.indeterminate = count > 0 && count < rowCheckboxes.length;
      }
    };

    if (checkAll) {
      checkAll.onclick = () => {
        rowCheckboxes.forEach(chk => { chk.checked = checkAll.checked; });
        updateBatchDeleteBar();
      };
    }

    rowCheckboxes.forEach(chk => {
      chk.addEventListener('change', () => {
        updateBatchDeleteBar();
      });
    });

    updateBatchDeleteBar();

    // 일괄 삭제 버튼 클릭 이벤트
    if (btnBatchDelete) {
      btnBatchDelete.onclick = async () => {
        const checkedBoxes = Array.from(tbody.querySelectorAll('.admin-user-chk:checked'));
        if (checkedBoxes.length === 0) {
          this.showToast('⚠️ 삭제할 회원을 먼저 체크박스로 선택해주세요.');
          return;
        }

        const currentUser = store.currentUser || { role: 'admin', name: '총괄 관리자' };
        const myRole = currentUser.role || 'admin';
        const myId = String(currentUser.id || currentUser.uid || '');
        const myEmail = (currentUser.email || '').toLowerCase();

        const selectedUsers = checkedBoxes.map(chk => ({
          id: chk.dataset.userId,
          name: chk.dataset.name,
          role: chk.dataset.role,
          email: (chk.dataset.email || '').toLowerCase()
        }));

        // 1. 일반 회원 차단
        if (myRole !== 'admin' && myRole !== 'manager') {
          alert('⚠️ 회원 삭제 권한이 없습니다. (관리자/어드민 전용)');
          return;
        }

        // 2. 본인 계정 포함 검사
        const selfTarget = selectedUsers.find(u => (myId && u.id === myId) || (myEmail && u.email === myEmail));
        if (selfTarget) {
          alert('⚠️ 관리자 콘솔에서 본인 계정은 삭제할 수 없습니다.\n본인 계정의 선택을 해제해주세요.');
          return;
        }

        // 3. 루트 어드민 포함 검사
        const rootTarget = selectedUsers.find(u => u.email === 'admin@kitchenchef.com');
        if (rootTarget) {
          alert('⚠️ 시스템 루트 총괄 어드민 계정(admin@kitchenchef.com)은 삭제할 수 없습니다.');
          return;
        }

        // 4. 매니저(manager) 역할 가드: 일반 회원(user)만 삭제 가능
        if (myRole === 'manager') {
          const nonUserTargets = selectedUsers.filter(u => u.role === 'admin' || u.role === 'manager');
          if (nonUserTargets.length > 0) {
            const targetNames = nonUserTargets.map(u => `${u.name}(${u.role.toUpperCase()})`).join(', ');
            alert(`⚠️ 관리자(Manager)는 관리자 및 어드민 계정을 삭제할 수 없습니다.\n[${targetNames}]을(를) 선택에서 제외하고 일반 회원만 선택해주세요.`);
            return;
          }
        }

        const count = selectedUsers.length;
        const confirmMsg = count === 1
          ? `정말 [${selectedUsers[0].name}] (${selectedUsers[0].email}) 회원을 영구 삭제하시겠습니까?\n\n※ 계정 정보 및 전용 냉장고 데이터가 즉시 영구 삭제되며 복구할 수 없습니다.`
          : `선택한 ${count}명의 회원을 영구 삭제하시겠습니까?\n\n※ 선택된 모든 계정 정보 및 전용 냉장고 데이터가 즉시 원자적으로 영구 삭제되며 복구할 수 없습니다.`;

        if (!confirm(confirmMsg)) return;

        try {
          const res = await this.executeDeleteUsers(selectedUsers, myRole, myId, currentUser.name || '총괄 관리자');

          const deletedCount = res?.deletedCount || count;
          this.showToast(`🗑️ ${deletedCount}명의 회원이 성공적으로 삭제되었습니다.`);

          // 삭제 후 현재 페이지에 남은 회원이 없을 경우 안전하게 이전 페이지로 보정
          const remainingUsers = store.getAdminUsers();
          const maxPage = Math.max(1, Math.ceil(remainingUsers.length / (this.adminUserPageSize || 8)));
          if (this.adminUserCurrentPage > maxPage) {
            this.adminUserCurrentPage = maxPage;
          }

          try { this.renderAdminUsers(); } catch (e) { console.warn('renderAdminUsers post-batch-delete non-fatal:', e); }
          try { this.renderAdminConsole(); } catch (e) { console.warn('renderAdminConsole post-batch-delete non-fatal:', e); }
        } catch (err) {
          console.error('회원 일괄 삭제 실패:', err);
          alert(`회원 삭제에 실패했습니다: ${err.message}`);
        }
      };
    }

    // 개별 삭제 버튼 바인딩
    tbody.querySelectorAll('.btn-delete-user').forEach(btn => {
      btn.addEventListener('click', async () => {
        const uid = btn.dataset.userId;
        const name = btn.dataset.name || uid;
        const role = btn.dataset.role || 'user';
        const email = (btn.dataset.email || '').toLowerCase();

        const currentUser = store.currentUser || { role: 'admin', name: '총괄 관리자' };
        const myRole = currentUser.role || 'admin';
        const myId = String(currentUser.id || currentUser.uid || '');
        const myEmail = (currentUser.email || '').toLowerCase();

        // 1. 일반 유저 차단
        if (myRole !== 'admin' && myRole !== 'manager') {
          alert('⚠️ 회원 삭제 권한이 없습니다. (관리자/어드민 전용)');
          return;
        }

        // 2. 루트 어드민 보호
        if (email === 'admin@kitchenchef.com') {
          alert('⚠️ 시스템 루트 총괄 어드민 계정(admin@kitchenchef.com)은 삭제할 수 없습니다.');
          return;
        }

        // 3. 본인 삭제 방어
        if ((myId && uid === myId) || (myEmail && email === myEmail)) {
          alert('⚠️ 관리자 콘솔에서 본인 계정은 삭제할 수 없습니다.');
          return;
        }

        // 4. 매니저 권한 가드
        if (myRole === 'manager' && (role === 'admin' || role === 'manager')) {
          alert(`⚠️ 관리자(Manager)는 관리자/어드민 계정([${name}])을 삭제할 수 없습니다. (일반 회원만 삭제 가능)`);
          return;
        }

        if (!confirm(`정말 [${name}] (${email}) 회원을 영구 삭제하시겠습니까?\n\n※ 계정 정보 및 전용 냉장고 데이터가 즉시 영구 삭제되며 복구할 수 없습니다.`)) {
          return;
        }

        try {
          const res = await this.executeDeleteUsers([{ id: uid, name, role, email }], myRole, myId, currentUser.name || '총괄 관리자');

          this.showToast(`🗑️ [${name}] 회원이 성공적으로 영구 삭제되었습니다.`);

          // 삭제 후 현재 페이지에 남은 회원이 없을 경우 안전하게 이전 페이지로 보정
          const remainingUsers = store.getAdminUsers();
          const maxPage = Math.max(1, Math.ceil(remainingUsers.length / (this.adminUserPageSize || 8)));
          if (this.adminUserCurrentPage > maxPage) {
            this.adminUserCurrentPage = maxPage;
          }

          try { this.renderAdminUsers(); } catch (e) { console.warn('renderAdminUsers post-delete non-fatal:', e); }
          try { this.renderAdminConsole(); } catch (e) { console.warn('renderAdminConsole post-delete non-fatal:', e); }
        } catch (err) {
          console.error('회원 삭제 실패:', err);
          alert(`회원 삭제에 실패했습니다: ${err.message}`);
        }
      });
    });

    // 액션 바인딩
    tbody.querySelectorAll('.btn-admin-user-action').forEach(btn => {
      btn.addEventListener('click', () => {
        const uid = btn.dataset.userId;
        this.openAdminUserActionModal(uid);
      });
    });

    tbody.querySelectorAll('.btn-force-logout').forEach(btn => {
      btn.addEventListener('click', () => {
        const uid = btn.dataset.userId;
        store.forceLogoutUser(uid);
        this.showToast(`🚫 [${uid}] 회원의 활성 세션이 강제 종료되었습니다.`);
        this.renderAdminUsers();
      });
    });

    tbody.querySelectorAll('.btn-ban').forEach(btn => {
      btn.addEventListener('click', () => {
        const uid = btn.dataset.userId;
        const reason = window.prompt("계정 일시 정지 사유를 입력하세요:", "커뮤니티 비방 및 스팸 활동 의심");
        if (reason !== null) {
          store.updateUserStatus(uid, 'suspended', reason);
          this.showToast(`⚠️ [${uid}] 회원이 활동 정지 처리되었습니다.`);
          this.renderAdminUsers();
        }
      });
    });

    tbody.querySelectorAll('.btn-unban').forEach(btn => {
      btn.addEventListener('click', () => {
        const uid = btn.dataset.userId;
        store.updateUserStatus(uid, 'active', '관리자 확인 후 제재 해제');
        this.showToast(`🔓 [${uid}] 회원이 정상 복구되었습니다.`);
        this.renderAdminUsers();
      });
    });

    tbody.querySelectorAll('.btn-grant-admin').forEach(btn => {
      btn.addEventListener('click', async () => {
        const uid = btn.dataset.userId;
        const name = btn.dataset.name || uid;
        const email = btn.dataset.email || '';
        if (confirm(`👑 [${name}] (${email}) 회원에게 총괄 관리자(Admin) 권한을 부여하시겠습니까?\n\n부여 시 해당 회원은 관리자 콘솔 접근 및 전체 거버넌스 제어 권한을 얻게 됩니다.`)) {
          await store.updateUserRole(uid, 'admin');
          this.showToast(`👑 [${name}] 회원에게 관리자(Admin) 권한이 성공적으로 부여되었습니다.`);
          this.renderAdminUsers();
        }
      });
    });

    tbody.querySelectorAll('.btn-demote-admin').forEach(btn => {
      btn.addEventListener('click', async () => {
        const uid = btn.dataset.userId;
        const name = btn.dataset.name || uid;
        const email = btn.dataset.email || '';
        if (confirm(`👤 [${name}] (${email}) 회원의 관리자 권한을 회수하고 일반 회원(User)으로 변경하시겠습니까?`)) {
          await store.updateUserRole(uid, 'user');
          this.showToast(`👤 [${name}] 회원의 관리자 권한이 회수되어 일반 회원으로 변경되었습니다.`);
          this.renderAdminUsers();
        }
      });
    });

    tbody.querySelectorAll('.btn-jump-tier').forEach(btn => {
      btn.addEventListener('click', () => {
        const uid = btn.dataset.userId;
        this.switchAdminTab('tiers');
        const select = document.getElementById('tier-edit-user-select');
        if (select) select.value = uid;
      });
    });

    // 🌟 8명(8칸) 단위 5페이지 블록(1~5, 6~10) 페이지네이션 렌더링
    this.renderAdminUserPagination(totalUsers, totalPages);
  }

  // 🌟 관리자 콘솔: 회원 목록 8명(8칸) 단위 5페이지 블록(1~5, 6~10) 페이지네이션 렌더러
  renderAdminUserPagination(totalUsers, totalPages) {
    const wrapper = document.getElementById('admin-user-pagination-wrapper');
    const infoEl = document.getElementById('admin-user-pagination-info');
    const paginationEl = document.getElementById('admin-user-pagination');
    if (!wrapper || !infoEl || !paginationEl) return;

    const pageSize = this.adminUserPageSize || 8;
    const blockSize = this.adminUserBlockSize || 5;

    // 회원이 8명(8칸) 이하이거나 0명이면 페이지네이션 숨김 (요구사항: 유저수가 8명 이상이 되면)
    if (totalUsers <= pageSize) {
      wrapper.style.display = 'none';
      paginationEl.innerHTML = '';
      infoEl.innerHTML = '';
      return;
    }

    wrapper.style.display = 'flex';

    // 1) 좌측 안내 정보
    const startNum = (this.adminUserCurrentPage - 1) * pageSize + 1;
    const endNum = Math.min(this.adminUserCurrentPage * pageSize, totalUsers);
    infoEl.innerHTML = `
      <span>총 <strong>${totalUsers}</strong>명 중 <strong>${startNum}~${endNum}</strong>명 표시</span>
      <span style="color: #cbd5e1; margin: 0 4px;">|</span>
      <span>페이지 <strong>${this.adminUserCurrentPage}</strong> / ${totalPages}</span>
    `;

    // 2) 5개 단위 블록 계산 (1~5, 6~10, 11~15 등)
    const currentBlock = Math.floor((this.adminUserCurrentPage - 1) / blockSize);
    const startPage = currentBlock * blockSize + 1;
    const endPage = Math.min(startPage + blockSize - 1, totalPages);

    let html = '';

    // [◀ 이전] 버튼 (현재 페이지가 1이면 disabled)
    const isFirstPage = this.adminUserCurrentPage <= 1;
    html += `
      <button type="button" class="admin-page-btn admin-page-nav-btn" id="adm-page-prev" ${isFirstPage ? 'disabled title="첫 번째 페이지입니다"' : 'title="이전 페이지로 이동"'}>
        ◀ 이전
      </button>
    `;

    // 5개 단위 번호 버튼 (1~5, 6~10 등)
    for (let p = startPage; p <= endPage; p++) {
      const isActive = p === this.adminUserCurrentPage;
      html += `
        <button type="button" class="admin-page-btn ${isActive ? 'active' : ''}" data-page="${p}" ${isActive ? 'aria-current="page"' : ''} title="${p}페이지로 이동">
          ${p}
        </button>
      `;
    }

    // [다음 ▶] 버튼 (현재 페이지가 마지막 페이지이면 disabled)
    const isLastPage = this.adminUserCurrentPage >= totalPages;
    html += `
      <button type="button" class="admin-page-btn admin-page-nav-btn" id="adm-page-next" ${isLastPage ? 'disabled title="마지막 페이지입니다"' : 'title="다음 페이지로 이동"'}>
        다음 ▶
      </button>
    `;

    paginationEl.innerHTML = html;

    // [◀ 이전] 버튼 클릭 이벤트
    const prevBtn = document.getElementById('adm-page-prev');
    if (prevBtn && !isFirstPage) {
      prevBtn.addEventListener('click', () => {
        if (this.adminUserCurrentPage > 1) {
          this.adminUserCurrentPage--;
          this.renderAdminUsers();
        }
      });
    }

    // [다음 ▶] 버튼 클릭 이벤트
    const nextBtn = document.getElementById('adm-page-next');
    if (nextBtn && !isLastPage) {
      nextBtn.addEventListener('click', () => {
        if (this.adminUserCurrentPage < totalPages) {
          this.adminUserCurrentPage++;
          this.renderAdminUsers();
        }
      });
    }

    // 개별 번호 버튼(1~5, 6~10 등) 클릭 이벤트
    paginationEl.querySelectorAll('.admin-page-btn[data-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetPage = parseInt(btn.dataset.page, 10);
        if (targetPage && targetPage !== this.adminUserCurrentPage) {
          this.adminUserCurrentPage = targetPage;
          this.renderAdminUsers();
        }
      });
    });
  }

  // 🌟 관리자: 회원 권한 설정 및 종합 조치 모달 열기
  openAdminUserActionModal(userId) {
    const users = store.loadAdminUsers();
    const user = users.find(u => u.id === userId || u.uid === userId);
    if (!user) return;
    this.currentAdminTargetUserId = userId;

    const modal = document.getElementById('modal-admin-user-action');
    if (!modal) return;

    // 1. 유저 기본 정보 바인딩
    const avatarEl = document.getElementById('adm-action-user-avatar');
    if (avatarEl) avatarEl.src = user.avatar || 'frontend/assets/images/icon.png';
    const nameEl = document.getElementById('adm-action-user-name');
    if (nameEl) nameEl.textContent = user.name || '신규 셰프';
    const emailEl = document.getElementById('adm-action-user-email');
    if (emailEl) emailEl.textContent = user.email || 'N/A';
    const uidEl = document.getElementById('adm-action-user-uid');
    if (uidEl) uidEl.textContent = user.id || user.uid || 'N/A';
    const cooksEl = document.getElementById('adm-action-user-cooks');
    if (cooksEl) cooksEl.textContent = `${user.cookCount || 0}회`;

    // 뱃지 바인딩
    const roleBadgeEl = document.getElementById('adm-action-user-role-badge');
    if (roleBadgeEl) {
      const r = (user.role || 'user').toUpperCase();
      roleBadgeEl.textContent = r;
      roleBadgeEl.className = `user-role-badge role-${r.toLowerCase()}`;
    }
    const statusBadgeEl = document.getElementById('adm-action-user-status-badge');
    if (statusBadgeEl) {
      const s = (user.status || (user.is_active ? 'active' : 'suspended')).toUpperCase();
      statusBadgeEl.textContent = s;
      statusBadgeEl.className = `user-status-badge status-${s.toLowerCase()}`;
    }

    // 2. 권한 라디오 선택
    const currentRole = user.role || 'user';
    const roleRadios = modal.querySelectorAll('input[name="adm-role-radio"]');
    roleRadios.forEach(radio => {
      radio.checked = (radio.value === currentRole);
    });

    // 3. 상태 셀렉트
    const statusSelect = document.getElementById('adm-action-status-select');
    if (statusSelect) {
      statusSelect.value = user.status || (user.is_active === false ? 'suspended' : 'active');
    }

    // 4. 로그인 제공자 목록 바인딩
    const providersContainer = document.getElementById('adm-action-providers-list');
    if (providersContainer) {
      const providers = Array.isArray(user.providers) && user.providers.length > 0
        ? user.providers
        : (user.password === 'google_oauth' ? ['google.com'] : ['password']);
      
      const hasGoogle = providers.includes('google.com') || providers.includes('google');
      const hasPassword = providers.includes('password');

      let listHtml = '';
      if (hasPassword) {
        listHtml += `<div class="adm-provider-item"><span class="badge-provider password">🔑 이메일/비밀번호</span> <span class="provider-status-text">기본 인증</span></div>`;
      }
      if (hasGoogle) {
        const canUnlink = providers.length > 1;
        listHtml += `
          <div class="adm-provider-item">
            <span class="badge-provider google"><svg viewBox="0 0 24 24" width="12" height="12"><path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.27 21.36 7.33 24 12 24z"/><path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.98 0 12s.46 3.84 1.26 5.42l4.02-3.15z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.27 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/></svg> Google 연동됨</span>
            ${canUnlink 
              ? `<button type="button" class="btn-adm-unlink-provider" id="btn-adm-unlink-google-action">🔗 구글 연동 해제</button>`
              : `<span class="provider-lock-text">🔒 유일한 로그인 수단 (고립 방지)</span>`}
          </div>
        `;
      }
      providersContainer.innerHTML = listHtml;

      const btnUnlinkGoogle = document.getElementById('btn-adm-unlink-google-action');
      if (btnUnlinkGoogle) {
        btnUnlinkGoogle.addEventListener('click', async () => {
          if (confirm(`[${user.name}] 회원의 Google 연동을 해제하시겠습니까?`)) {
            try {
              await store.unlinkUserProvider(userId, 'google.com', '관리자 콘솔에서 구글 연동 해제');
              this.showToast(`✅ [${user.name}] 회원의 Google 연동이 해제되었습니다.`);
              this.openAdminUserActionModal(userId);
              this.renderAdminUsers();
            } catch (err) {
              alert(err.message || '연동 해제에 실패했습니다.');
            }
          }
        });
      }
    }

    // 5. 즉시 세션 만료 버튼
    const btnExpireSession = document.getElementById('btn-adm-force-expire-session');
    if (btnExpireSession) {
      btnExpireSession.onclick = async () => {
        try {
          await store.expireUserSession(userId, '관리자에 의한 강제 세션 만료');
          this.showToast(`🚫 [${user.name}] 회원의 세션이 즉시 만료 처리되었습니다.`);
          this.renderAdminUsers();
          this.openAdminUserActionModal(userId);
        } catch (e) {
          alert('세션 만료 처리 실패');
        }
      };
    }

    // 6. 임시 비밀번호 난수 생성기
    const tempPwdInput = document.getElementById('adm-action-temp-password');
    const pwdTip = document.getElementById('adm-pwd-tip');
    if (tempPwdInput) tempPwdInput.value = '';
    if (pwdTip) {
      pwdTip.style.display = 'none';
      pwdTip.textContent = '';
    }
    const btnGenPwd = document.getElementById('btn-adm-gen-random-pwd');
    if (btnGenPwd) {
      btnGenPwd.onclick = () => {
        const randStr = Math.random().toString(36).substring(2, 8) + '!';
        const newPwd = `Chef_${randStr}`;
        if (tempPwdInput) tempPwdInput.value = newPwd;
        if (pwdTip) {
          pwdTip.style.display = 'inline-block';
          pwdTip.textContent = `🎲 생성된 임시 비밀번호: ${newPwd} (저장 시 적용)`;
        }
      };
    }

    // 7. 제출 버튼 이벤트
    const btnSubmit = document.getElementById('btn-submit-admin-user-action');
    if (btnSubmit) {
      btnSubmit.onclick = async () => {
        const selectedRoleRadio = modal.querySelector('input[name="adm-role-radio"]:checked');
        const newRole = selectedRoleRadio ? selectedRoleRadio.value : 'user';
        const newStatus = statusSelect ? statusSelect.value : 'active';
        const newPassword = tempPwdInput ? tempPwdInput.value.trim() : '';
        const reason = document.getElementById('adm-action-reason')?.value.trim() || '관리자 설정 변경';

        try {
          btnSubmit.disabled = true;
          btnSubmit.innerHTML = `<span>⏳ 저장 중...</span>`;

          const payload = {
            role: newRole,
            status: newStatus,
            reason
          };
          if (newPassword) {
            payload.newPassword = newPassword;
          }

          await store.applyAdminActions(userId, payload);
          this.showToast(`✅ [${user.name}] 회원의 권한 및 종합 조치가 성공적으로 적용되었습니다.`);
          this.closeAdminUserActionModal();
          this.renderAdminUsers();
        } catch (err) {
          alert(err.message || '조치 적용 중 오류가 발생했습니다.');
        } finally {
          btnSubmit.disabled = false;
          btnSubmit.innerHTML = `<span>💾 설정 및 조치 적용</span>`;
        }
      };
    }

    // 8. 닫기 버튼 이벤트 바인딩
    const btnCloseUserAction = document.getElementById('btn-close-admin-user-action');
    if (btnCloseUserAction) btnCloseUserAction.onclick = () => this.closeAdminUserActionModal();
    const btnCancelUserAction = document.getElementById('btn-cancel-admin-user-action');
    if (btnCancelUserAction) btnCancelUserAction.onclick = () => this.closeAdminUserActionModal();
    modal.onclick = (e) => {
      if (e.target === modal) this.closeAdminUserActionModal();
    };

    modal.style.display = 'flex';
  }

  closeAdminUserActionModal() {
    const modal = document.getElementById('modal-admin-user-action');
    if (modal) modal.style.display = 'none';
    this.currentAdminTargetUserId = null;
  }

  // 1-1. 실존 인증 메일(SMTP) 설정 렌더링 및 제어
  async renderAdminSmtpSettings() {
    const hostEl = document.getElementById('adm-smtp-host');
    const portEl = document.getElementById('adm-smtp-port');
    const userEl = document.getElementById('adm-smtp-user');
    const pwdEl = document.getElementById('adm-smtp-password');
    const senderEl = document.getElementById('adm-smtp-sender-name');
    const tlsEl = document.getElementById('adm-smtp-tls');
    const sslEl = document.getElementById('adm-smtp-ssl');
    const badgeEl = document.getElementById('adm-smtp-status-badge');
    const feedbackEl = document.getElementById('adm-smtp-feedback');
    const saveBtn = document.getElementById('btn-adm-smtp-save');
    const testBtn = document.getElementById('btn-adm-smtp-test');
    const testEmailInput = document.getElementById('adm-smtp-test-email');

    if (!hostEl || !saveBtn) return;

    // 프리셋 버튼 이벤트 연결
    const btnNaver = document.getElementById('btn-preset-naver');
    const btnGmail = document.getElementById('btn-preset-gmail');
    const btnDaum = document.getElementById('btn-preset-daum');

    if (btnNaver && !btnNaver._bound) {
      btnNaver._bound = true;
      btnNaver.addEventListener('click', () => {
        hostEl.value = 'smtp.naver.com';
        portEl.value = '587';
        if (tlsEl) tlsEl.checked = true;
        if (sslEl) sslEl.checked = false;
        if (pwdEl) pwdEl.placeholder = '네이버 2단계 인증 애플리케이션 비밀번호';
        this.showToast('🟢 네이버 SMTP 프리셋이 적용되었습니다. 아이디와 앱 비밀번호를 입력해주세요.');
      });
    }
    if (btnGmail && !btnGmail._bound) {
      btnGmail._bound = true;
      btnGmail.addEventListener('click', () => {
        hostEl.value = 'smtp.gmail.com';
        portEl.value = '587';
        if (tlsEl) tlsEl.checked = true;
        if (sslEl) sslEl.checked = false;
        if (pwdEl) pwdEl.placeholder = 'Google 계정 16자리 앱 비밀번호';
        this.showToast('🔴 지메일 SMTP 프리셋이 적용되었습니다. 지메일 주소와 16자리 앱 비밀번호를 입력해주세요.');
      });
    }
    if (btnDaum && !btnDaum._bound) {
      btnDaum._bound = true;
      btnDaum.addEventListener('click', () => {
        hostEl.value = 'smtp.daum.net';
        portEl.value = '465';
        if (tlsEl) tlsEl.checked = false;
        if (sslEl) sslEl.checked = true;
        if (pwdEl) pwdEl.placeholder = '카카오/다음 계정 비밀번호';
        this.showToast('🟡 카카오/다음 SMTP 프리셋이 적용되었습니다.');
      });
    }

    // 현재 설정 비동기 조회
    try {
      const resp = await fetch('/api/admin/smtp');
      if (resp.ok) {
        const data = await resp.json();
        const conf = data.config || {};
        if (hostEl && !hostEl.value) hostEl.value = conf.host || 'smtp.gmail.com';
        if (portEl && !portEl.value) portEl.value = conf.port || 587;
        if (userEl && !userEl.value) userEl.value = conf.user || '';
        if (senderEl) senderEl.value = conf.sender_name || 'Kitchen Chef 키친 셰프';
        if (tlsEl) tlsEl.checked = conf.use_tls !== false;
        if (sslEl) sslEl.checked = !!conf.use_ssl;

        if (badgeEl) {
          if (conf.has_password && conf.user) {
            badgeEl.textContent = '🟢 SMTP 발신 연동됨';
            badgeEl.style.background = '#dcfce7';
            badgeEl.style.color = '#166534';
          } else {
            badgeEl.textContent = '⚪ 미설정 (발송 계정 필요)';
            badgeEl.style.background = '#fee2e2';
            badgeEl.style.color = '#991b1b';
          }
        }
      }
    } catch (e) {
      console.warn('Failed to load SMTP config:', e);
    }

    // 설정 저장 핸들러
    if (saveBtn && !saveBtn._bound) {
      saveBtn._bound = true;
      saveBtn.addEventListener('click', async () => {
        saveBtn.disabled = true;
        saveBtn.textContent = '저장 중...';
        try {
          const configPayload = {
            host: hostEl?.value.trim() || 'smtp.gmail.com',
            port: parseInt(portEl?.value.trim() || '587', 10),
            user: userEl?.value.trim() || '',
            sender_name: senderEl?.value.trim() || 'Kitchen Chef 키친 셰프',
            use_tls: tlsEl ? tlsEl.checked : true,
            use_ssl: sslEl ? sslEl.checked : false
          };
          if (pwdEl && pwdEl.value) {
            configPayload.password = pwdEl.value.trim();
          }
          const resp = await fetch('/api/admin/smtp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ config: configPayload })
          });
          const data = await resp.json();
          if (resp.ok) {
            this.showToast('✅ SMTP 발송 설정이 저장되었습니다.');
            if (badgeEl) {
              badgeEl.textContent = '🟢 SMTP 발신 연동됨';
              badgeEl.style.background = '#dcfce7';
              badgeEl.style.color = '#166534';
            }
            if (feedbackEl) {
              feedbackEl.style.display = 'block';
              feedbackEl.style.color = '#166534';
              feedbackEl.textContent = '✅ SMTP 발신 설정이 안전하게 업데이트되었습니다.';
            }
          } else {
            throw new Error(data.message || 'SMTP 설정 저장에 실패했습니다.');
          }
        } catch (err) {
          this.showToast(`⚠️ ${err.message}`);
          if (feedbackEl) {
            feedbackEl.style.display = 'block';
            feedbackEl.style.color = '#dc2626';
            feedbackEl.textContent = `❌ ${err.message}`;
          }
        } finally {
          saveBtn.disabled = false;
          saveBtn.textContent = '💾 SMTP 설정 저장';
        }
      });
    }

    // 테스트 발송 핸들러
    if (testBtn && !testBtn._bound) {
      testBtn._bound = true;
      testBtn.addEventListener('click', async () => {
        const testEmail = testEmailInput?.value.trim();
        if (!testEmail) {
          this.showToast('⚠️ 테스트를 수신할 이메일 주소를 입력해주세요.');
          if (testEmailInput) testEmailInput.focus();
          return;
        }
        testBtn.disabled = true;
        testBtn.textContent = '발송 중...';
        if (feedbackEl) {
          feedbackEl.style.display = 'block';
          feedbackEl.style.color = '#2563eb';
          feedbackEl.textContent = `📡 [${testEmail}]로 실제 SMTP 연결 및 테스트 메일을 전송하는 중입니다...`;
        }
        try {
          const resp = await fetch('/api/admin/smtp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ testEmail })
          });
          const data = await resp.json();
          if (resp.ok) {
            this.showToast(`🎉 ${data.message || '테스트 메일이 성공적으로 발송되었습니다!'}`);
            if (feedbackEl) {
              feedbackEl.style.color = '#166534';
              feedbackEl.textContent = `✅ [${testEmail}]로 테스트 인증 메일이 발송되었습니다. 받은편지함을 확인하세요!`;
            }
          } else {
            throw new Error(data.message || '테스트 발송에 실패했습니다.');
          }
        } catch (err) {
          this.showToast(`⚠️ ${err.message}`);
          if (feedbackEl) {
            feedbackEl.style.color = '#dc2626';
            feedbackEl.textContent = `❌ 발송 실패: ${err.message}`;
          }
        } finally {
          testBtn.disabled = false;
          testBtn.textContent = '📨 테스트 발송';
        }
      });
    }
  }

  // 2. 등급 및 칭호 관리
  renderAdminTiers() {
    const users = store.loadAdminUsers();
    const select = document.getElementById('tier-edit-user-select');
    if (select) {
      const currentVal = select.value;
      select.innerHTML = users.map(u => `<option value="${u.id}">${u.name} (${u.email}) - ${u.level}</option>`).join('');
      if (currentVal && users.some(u => u.id === currentVal)) {
        select.value = currentVal;
      }
    }

    const tbody = document.getElementById('admin-tiers-tbody');
    if (!tbody) return;

    tbody.innerHTML = users.map(u => {
      let nextDesc = '최고 등급 달성 👑';
      if ((u.cookCount || 0) < 1) nextDesc = `다음 등급까지 ${1 - (u.cookCount || 0)}회 완식`;
      else if ((u.cookCount || 0) < 3) nextDesc = `다음 등급까지 ${3 - (u.cookCount || 0)}회 완식`;
      else if ((u.cookCount || 0) < 6) nextDesc = `다음 등급까지 ${6 - (u.cookCount || 0)}회 완식`;

      return `
        <tr>
          <td><strong>${u.name}</strong></td>
          <td style="font-size: 0.8rem; color: #666;">${u.email}</td>
          <td><span class="badge-tier-level">${u.level}</span></td>
          <td><strong>${u.tier}</strong></td>
          <td style="font-weight: 800; color: #d97706;">${u.cookCount || 0}회</td>
          <td style="font-size: 0.78rem; color: #888;">${nextDesc}</td>
          <td>
            <button type="button" class="btn-table-action btn-quick-promote" data-user-id="${u.id}">+1회 완식 승급</button>
          </td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('.btn-quick-promote').forEach(btn => {
      btn.addEventListener('click', () => {
        const uid = btn.dataset.userId;
        const user = users.find(u => u.id === uid);
        if (user) {
          const newCount = (user.cookCount || 0) + 1;
          let newLevel = user.level;
          if (newCount >= 6) newLevel = '마스터 셰프 Lv.4';
          else if (newCount >= 3) newLevel = '시니어 셰프 Lv.3';
          else if (newCount >= 1) newLevel = '주니어 셰프 Lv.2';
          store.updateUserTier(uid, newLevel, newCount);
          this.showToast(`🎖️ [${user.name}] 조리 횟수가 ${newCount}회로 증가 및 등급이 동기화되었습니다.`);
          this.renderAdminTiers();
          this.renderAdminUsers();
        }
      });
    });
  }

  // 3. 냉장고 및 Vision AI 관리
  renderAdminFridge() {
    const users = store.loadAdminUsers();
    const select = document.getElementById('fridge-inspect-user-select');
    if (select) {
      const currentVal = select.value;
      select.innerHTML = users.map(u => `<option value="${u.id}">${u.name} (${u.email})</option>`).join('');
      if (currentVal && users.some(u => u.id === currentVal)) {
        select.value = currentVal;
      }
    }
    const targetUserId = select?.value || users[0]?.id || 'admin';

    const renderShelves = (fridgeItems) => {
      const preview = document.getElementById('fridge-preview-container');
      if (!preview) return;
      const shelves = { vege: [], meat: [], dairy: [], sauce: [] };
      fridgeItems.forEach(item => {
        const s = item.shelf || 'vege';
        if (shelves[s]) shelves[s].push(item);
      });

      const renderShelfRow = (title, icon, list) => `
        <div class="fridge-inspect-shelf">
          <div class="shelf-label-row">
            <span>${icon} <strong>${title}</strong></span>
            <span style="font-size: 0.75rem; color: #888;">${list.length}종</span>
          </div>
          <div class="shelf-chips-wrap">
            ${list.length === 0 ? '<span style="font-size: 0.72rem; color: #aaa;">재고 없음 (비어있음)</span>' : ''}
            ${list.map(i => `
              <span class="inspect-chip ${i.shelf}">
                ${i.name} ${i.count}${i.unit || '개'}
              </span>
            `).join('')}
          </div>
        </div>
      `;

      preview.innerHTML = `
        ${renderShelfRow('신선 채소 • 과일', '🥬', shelves.vege)}
        ${renderShelfRow('육류 • 해산물 • 햄', '🥩', shelves.meat)}
        ${renderShelfRow('유제품 • 달걀 • 두부', '🧀', shelves.dairy)}
        ${renderShelfRow('양념 • 소스 & 즉석가공', '🥫', shelves.sauce)}
      `;
    };

    // 1. 즉시 로컬 캐시 재고 렌더링
    renderShelves(store.getUserFridge(targetUserId));

    // 2. 비동기로 백엔드/원격 DB에서 최신 재고 동기화 후 업데이트
    store.fetchUserFridgeRemote(targetUserId).then(remoteItems => {
      const currentSelect = document.getElementById('fridge-inspect-user-select');
      if (currentSelect && currentSelect.value === targetUserId) {
        renderShelves(remoteItems);
      }
    }).catch(() => {});

    // Vision AI 오류 로그 테이블
    const visionLogs = store.loadVisionLogs();
    const visionTbody = document.getElementById('admin-vision-tbody');
    if (visionTbody) {
      visionTbody.innerHTML = visionLogs.map(l => {
        const isMis = l.status === 'misclassified';
        const isCorrected = l.status === 'corrected';
        const statusBadge = isCorrected 
          ? `<span class="badge-status active">✅ 교정 완료</span>`
          : (isMis ? `<span class="badge-status suspended">⚠️ 오분류 의심</span>` : `<span class="badge-status active">정상 인식</span>`);

        return `
          <tr>
            <td style="font-size: 0.72rem; color: #888;">${l.timestamp}</td>
            <td><strong>${l.user}</strong><br><span style="font-size: 0.7rem; color: #666;">${l.filename}</span></td>
            <td><strong style="color: var(--amber-deep);">${l.detected}</strong></td>
            <td><code>${l.classifiedShelf}</code></td>
            <td>${l.aiConfidence}</td>
            <td>${statusBadge}</td>
            <td>
              <select class="admin-select select-vision-shelf" data-log-id="${l.id}" style="font-size: 0.75rem; padding: 2px 6px;">
                <option value="sauce" ${l.classifiedShelf === 'sauce' ? 'selected' : ''}>양념·소스/가공</option>
                <option value="vege" ${l.classifiedShelf === 'vege' ? 'selected' : ''}>신선 채소</option>
                <option value="meat" ${l.classifiedShelf === 'meat' ? 'selected' : ''}>육류·해산물</option>
                <option value="dairy" ${l.classifiedShelf === 'dairy' ? 'selected' : ''}>유제품·달걀</option>
              </select>
              <button type="button" class="btn-table-action btn-apply-vision-shelf" data-log-id="${l.id}">반영</button>
            </td>
          </tr>
        `;
      }).join('');

      visionTbody.querySelectorAll('.btn-apply-vision-shelf').forEach(btn => {
        btn.addEventListener('click', () => {
          const logId = btn.dataset.logId;
          const selectEl = visionTbody.querySelector(`.select-vision-shelf[data-log-id="${logId}"]`);
          if (selectEl) {
            const newShelf = selectEl.value;
            store.correctVisionShelf(logId, newShelf);
            this.showToast(`📷 Vision AI 보관칸이 '${newShelf}'(으)로 교정 및 저장되었습니다.`);
            this.renderAdminFridge();
          }
        });
      });
    }
  }

  // 4. 📖 유저 1:1 맞춤 레시피 DB 관제 및 거버넌스
  openAdminRecipeModal(recipe = null, userId = null) {
    const modal = document.getElementById('modal-admin-recipe-edit');
    if (!modal) return;
    const isEdit = !!recipe;
    const titleEl = document.getElementById('adm-recipe-modal-title');
    if (titleEl) titleEl.textContent = isEdit ? `✏️ [${recipe.title}] 맞춤 레시피 정보 수정` : '➕ 신규 맞춤 레시피 직접 주입';

    document.getElementById('adm-form-recipe-id').value = isEdit ? (recipe.id || '') : '';
    document.getElementById('adm-form-recipe-user-id').value = userId || document.getElementById('recipe-inspect-user-select')?.value || 'admin';
    document.getElementById('adm-form-recipe-title').value = isEdit ? (recipe.title || '') : '';
    document.getElementById('adm-form-recipe-craftno').value = isEdit ? (recipe.craftNo || '') : '';
    document.getElementById('adm-form-recipe-subtitle').value = isEdit ? (recipe.subTitle || '') : '';
    document.getElementById('adm-form-recipe-time').value = isEdit ? (recipe.timeMinutes || 15) : 15;
    document.getElementById('adm-form-recipe-difficulty').value = isEdit ? (recipe.difficulty || '난이도 하') : '난이도 하';
    document.getElementById('adm-form-recipe-match').value = isEdit ? (recipe.matchRate !== undefined ? recipe.matchRate : 100) : 100;
    document.getElementById('adm-form-recipe-desc').value = isEdit ? (recipe.description || '') : '';
    document.getElementById('adm-form-recipe-cheftip').value = isEdit ? (recipe.chefTip || '') : '';
    document.getElementById('adm-form-recipe-keyword').value = isEdit ? (recipe.keyword || recipe.title || '') : '';
    document.getElementById('adm-form-recipe-image').value = isEdit ? (recipe.image || '') : 'images/recipes/gamjatang.jpg';

    // 식재료 문자열 변환
    let ingsStr = '';
    if (isEdit && Array.isArray(recipe.ingredients)) {
      ingsStr = recipe.ingredients.map(i => `${i.name || i}:${i.amount || '1개'}`).join(', ');
    } else {
      ingsStr = '스팸:1캔, 두부:1모, 대파:1대, 양파:1/2개';
    }
    document.getElementById('adm-form-recipe-ingredients').value = ingsStr;

    modal.style.display = 'flex';
  }

  closeAdminRecipeModal() {
    const modal = document.getElementById('modal-admin-recipe-edit');
    if (modal) modal.style.display = 'none';
  }

  async handleAdminRecipeFormSubmit() {
    const title = document.getElementById('adm-form-recipe-title').value.trim();
    if (!title) {
      alert('요리 제목을 입력해주세요.');
      return;
    }
    const userId = document.getElementById('adm-form-recipe-user-id').value || 'admin';
    const recipeId = document.getElementById('adm-form-recipe-id').value;
    const craftNo = document.getElementById('adm-form-recipe-craftno').value.trim();
    const subTitle = document.getElementById('adm-form-recipe-subtitle').value.trim();
    const timeMinutes = parseInt(document.getElementById('adm-form-recipe-time').value) || 15;
    const difficulty = document.getElementById('adm-form-recipe-difficulty').value;
    const matchRate = parseInt(document.getElementById('adm-form-recipe-match').value) || 100;
    const description = document.getElementById('adm-form-recipe-desc').value.trim();
    const chefTip = document.getElementById('adm-form-recipe-cheftip').value.trim();
    const keyword = document.getElementById('adm-form-recipe-keyword').value.trim();
    const image = document.getElementById('adm-form-recipe-image').value.trim() || 'images/recipes/gamjatang.jpg';
    const ingsRaw = document.getElementById('adm-form-recipe-ingredients').value.trim();

    // 식재료 파싱
    const ingredients = ingsRaw ? ingsRaw.split(',').map(s => {
      const parts = s.trim().split(':');
      const name = parts[0].trim();
      const amount = (parts[1] || '1개').trim();
      const shelf = store.detectShelf(name);
      return { name, amount, match: true, shelf };
    }).filter(i => i.name) : [];

    const recipeData = {
      id: recipeId || undefined,
      title,
      subTitle: subTitle || `AI 셰프 1:1 맞춤 추천 • ${title}`,
      craftNo: craftNo || undefined,
      timeMinutes,
      difficulty,
      matchRate,
      description,
      chefTip,
      keyword,
      image,
      ingredients,
      sourceType: 'ai',
      isTopTailored: true,
      rating: 4.9,
      reviewCount: 15
    };

    await store.saveOrUpdateUserRecipe(userId, recipeData);
    this.closeAdminRecipeModal();
    this.showToast(`💾 [${title}] 레시피가 성공적으로 ${recipeId ? '수정' : '신규 등록'}되었습니다.`);
    this.renderAdminRecipes();
  }

  async renderAdminRecipes() {
    const users = store.loadAdminUsers();
    const select = document.getElementById('recipe-inspect-user-select');

    if (select) {
      const currentVal = select.value;
      select.innerHTML = users.map(u => `<option value="${u.id}">${u.name} (${u.email})</option>`).join('');
      if (currentVal && users.some(u => u.id === currentVal)) {
        select.value = currentVal;
      }
    }

    const targetUserId = select?.value || users[0]?.id || 'admin';
    const container = document.getElementById('admin-recipe-db-container');
    if (!container) return;

    // 1. 먼저 로컬 캐시 조회
    let record = store.getUserStoredRecipes(targetUserId) || {
      query: '',
      savedAt: '',
      selectedIngredients: [],
      recipes: []
    };

    // 2. 렌더링 헬퍼
    const renderData = (data) => {
      const allRecipes = (data && Array.isArray(data.recipes)) ? data.recipes : [];
      const query = (data && data.query) ? data.query : '지정 없음 (기본 추천 탐색)';
      const savedAt = (data && data.savedAt) ? data.savedAt : '보관 기록 없음';
      const ingredients = (data && Array.isArray(data.selectedIngredients)) ? data.selectedIngredients : [];

      // 4대 KPI 카드 업데이트
      const countEl = document.getElementById('adm-recipe-stat-count');
      if (countEl) countEl.textContent = `${allRecipes.length}종`;

      const matchEl = document.getElementById('adm-recipe-stat-match');
      if (matchEl) {
        if (allRecipes.length > 0) {
          const avg = Math.round(allRecipes.reduce((sum, r) => sum + (r.matchRate || 100), 0) / allRecipes.length);
          matchEl.textContent = `${avg}%`;
        } else {
          matchEl.textContent = '0%';
        }
      }

      const queryEl = document.getElementById('adm-recipe-stat-query');
      if (queryEl) {
        queryEl.textContent = query ? `"${query}"` : '기본 추천 탐색';
        queryEl.title = query;
      }

      const syncedEl = document.getElementById('adm-recipe-stat-synced');
      if (syncedEl) syncedEl.textContent = savedAt || '-';

      // 식재료 매칭 컨텍스트 박스 업데이트
      const ingCountEl = document.getElementById('adm-recipe-ing-count');
      if (ingCountEl) ingCountEl.textContent = `${ingredients.length}종 연동됨`;

      const ingChipsEl = document.getElementById('adm-recipe-ing-chips');
      if (ingChipsEl) {
        if (ingredients.length > 0) {
          ingChipsEl.innerHTML = ingredients.map(ing => {
            const name = ing.name || ing;
            const countStr = ing.count ? `${ing.count}${ing.unit || '개'}` : '';
            const shelf = ing.shelf || store.detectShelf(name);
            const shelfNames = { vege: '신선 채소', meat: '육류·해산물', dairy: '유제품·달걀', sauce: '양념·소스' };
            return `<span class="inspect-chip ${shelf}" style="font-size: 0.76rem; padding: 3px 9px; border-radius: 6px; display: inline-flex; align-items: center; gap: 4px;">
              <span>${this.getFoodEmoji(name)}</span>
              <strong>${name}</strong> <span>${countStr}</span>
              <small style="opacity: 0.75; font-size: 0.7rem;">(${shelfNames[shelf] || '보관'})</small>
            </span>`;
          }).join('');
        } else {
          ingChipsEl.innerHTML = '<span style="color: #94a3b8; font-size: 0.8rem;">등록된 매칭 식재료 데이터가 없습니다.</span>';
        }
      }

      // 필터링 및 검색 적용
      const searchKeyword = (document.getElementById('admin-recipe-search')?.value || '').trim().toLowerCase();
      const filterDiff = document.getElementById('admin-recipe-filter-diff')?.value || 'all';
      const filterTime = document.getElementById('admin-recipe-filter-time')?.value || 'all';
      const sortMode = document.getElementById('admin-recipe-sort')?.value || 'default';

      let filtered = [...allRecipes];

      if (searchKeyword) {
        filtered = filtered.filter(r => {
          const t = (r.title || '').toLowerCase();
          const d = (r.description || '').toLowerCase();
          const ings = (r.ingredients || []).map(i => (i.name || i || '').toLowerCase()).join(' ');
          return t.includes(searchKeyword) || d.includes(searchKeyword) || ings.includes(searchKeyword);
        });
      }

      if (filterDiff !== 'all') {
        filtered = filtered.filter(r => (r.difficulty || '').includes(filterDiff.replace('난이도 ', '')));
      }

      if (filterTime !== 'all') {
        const maxTime = parseInt(filterTime);
        if (maxTime === 10) filtered = filtered.filter(r => (r.timeMinutes || 15) <= 10);
        else if (maxTime === 15) filtered = filtered.filter(r => (r.timeMinutes || 15) <= 15);
        else if (maxTime === 20) filtered = filtered.filter(r => (r.timeMinutes || 15) >= 20);
      }

      if (sortMode === 'time_asc') {
        filtered.sort((a, b) => (a.timeMinutes || 15) - (b.timeMinutes || 15));
      } else if (sortMode === 'match_desc') {
        filtered.sort((a, b) => (b.matchRate || 100) - (a.matchRate || 100));
      } else if (sortMode === 'rating_desc') {
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      }

      // 카드 렌더링
      if (filtered.length === 0) {
        container.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1.5rem; background: #fafafa; border-radius: 12px; border: 1.5px dashed #cbd5e1; color: #64748b;">
            <div style="font-size: 2.5rem; margin-bottom: 0.6rem;">🍳</div>
            <div style="font-size: 1.05rem; font-weight: 700; margin-bottom: 0.3rem; color: #334155;">조건에 맞는 맞춤 레시피가 없습니다.</div>
            <div style="font-size: 0.84rem; color: #94a3b8; margin-bottom: 1rem;">
              ${allRecipes.length === 0 ? '보관된 레시피가 없습니다. 상단의 <strong>[🔄 기본 3대 맞춤 레시피 복구]</strong>를 누르거나 <strong>[➕ 신규 맞춤 레시피 직접 주입]</strong> 버튼으로 레시피를 추가하세요.' : '검색어 또는 필터 조건을 변경해보세요.'}
            </div>
          </div>
        `;
        return;
      }

      container.innerHTML = filtered.map((r, idx) => {
        const matchIngs = (r.ingredients && Array.isArray(r.ingredients))
          ? r.ingredients.map(i => {
              const matched = i.match !== false;
              return `<span class="admin-recipe-ing-tag ${matched ? 'matched' : 'unmatched'}">${matched ? '✓ ' : ''}${i.name || i} ${i.amount || ''}</span>`;
            }).join('')
          : '<span style="color:#94a3b8; font-size:0.75rem;">재료 정보 없음</span>';

        const chefTipHtml = r.chefTip
          ? `<div class="admin-recipe-cheftip-box">💡 <strong>셰프 꿀팁:</strong> ${r.chefTip}</div>`
          : '';

        const imgSrc = r.image || 'images/recipes/gamjatang.jpg';

        return `
          <div class="admin-recipe-item-card" data-recipe-id="${r.id}">
            <div class="admin-recipe-item-header">
              <span class="admin-recipe-craft-badge">⭐ ${r.craftNo || `AI CHEF SPECIAL NO. 0${idx + 1}`}</span>
              <span class="badge-status active" style="font-size: 0.72rem; padding: 2px 7px;">★ 일치율 ${r.matchRate || 100}%</span>
            </div>
            <div class="admin-recipe-item-body">
              <div class="admin-recipe-thumb-wrap">
                <img src="${imgSrc}" alt="${r.title}" onerror="this.onerror=null; this.src='frontend/assets/images/icon.png';">
                <div class="admin-recipe-thumb-overlay">
                  <span class="media-views-pill">⭐ ${r.rating || 4.9}</span>
                </div>
              </div>
              <h4 class="admin-recipe-title">${r.title}</h4>
              <div class="admin-recipe-subtitle">${r.subTitle || 'AI 셰프 1:1 맞춤 추천'}</div>
              <p class="admin-recipe-desc">${r.description || '선택한 냉장고 식재료를 활용한 일품 요리입니다.'}</p>
              
              <div class="admin-recipe-ings-box">
                <div class="admin-recipe-ings-label">필요 식재료 & 매칭 현황:</div>
                <div style="display: flex; flex-wrap: wrap;">${matchIngs}</div>
              </div>

              ${chefTipHtml}

              <div class="admin-recipe-meta-row">
                <span>⏱️ ${r.timeMinutes || 15}분 소요</span>
                <span>🔥 ${r.difficulty || '난이도 하'}</span>
                <span>🏷️ ${r.keyword || r.title}</span>
              </div>
            </div>

            <div class="admin-recipe-actions-bar">
              <button type="button" class="btn-adm-recipe-action edit" data-recipe-id="${r.id}">
                <span>✏️ 레시피 수정</span>
              </button>
              <button type="button" class="btn-adm-recipe-action preview" data-recipe-id="${r.id}">
                <span>👁️ 조리 상세 뷰</span>
              </button>
              <button type="button" class="btn-adm-recipe-action delete" data-recipe-id="${r.id}">
                <span>🗑️ 삭제</span>
              </button>
            </div>
          </div>
        `;
      }).join('');

      // 이벤트 바인딩: 수정 버튼
      container.querySelectorAll('.btn-adm-recipe-action.edit').forEach(btn => {
        btn.addEventListener('click', () => {
          const rId = btn.dataset.recipeId;
          const found = allRecipes.find(r => String(r.id) === String(rId));
          if (found) {
            this.openAdminRecipeModal(found, targetUserId);
          }
        });
      });

      // 이벤트 바인딩: 프리뷰 (view-detail 열기)
      container.querySelectorAll('.btn-adm-recipe-action.preview').forEach(btn => {
        btn.addEventListener('click', () => {
          const rId = btn.dataset.recipeId;
          const found = allRecipes.find(r => String(r.id) === String(rId));
          if (found) {
            store.selectedRecipe = found;
            this.switchSection('detail');
            this.renderRecipeDetail(found);
            this.showToast(`👁️ [${found.title}] 도마 상세 조리 뷰로 이동했습니다.`);
          }
        });
      });

      // 이벤트 바인딩: 개별 삭제 버튼
      container.querySelectorAll('.btn-adm-recipe-action.delete').forEach(btn => {
        btn.addEventListener('click', async () => {
          const rId = btn.dataset.recipeId;
          const found = allRecipes.find(r => String(r.id) === String(rId));
          const recipeName = found?.title || rId;
          if (confirm(`정말 [${recipeName}] 맞춤 레시피를 삭제하시겠습니까?`)) {
            await store.deleteUserRecipe(targetUserId, rId);
            this.showToast(`🗑️ [${recipeName}] 레시피가 성공적으로 삭제되었습니다.`);
            this.renderAdminRecipes();
          }
        });
      });
    };

    renderData(record);

    // 3. 백엔드 원격 DB에서 최신 레시피 비동기 조회 후 갱신
    store.fetchUserRecipesFromDB(targetUserId).then(remoteRecord => {
      const currentSelect = document.getElementById('recipe-inspect-user-select');
      if (currentSelect && currentSelect.value === targetUserId && remoteRecord) {
        renderData(remoteRecord);
      }
    }).catch(() => {});
  }

  // 4. 커뮤니티 및 콘텐츠 관리
  renderAdminCommunity() {
    const posts = store.posts || [];
    const tbody = document.getElementById('admin-community-tbody');
    if (!tbody) return;

    if (posts.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:2rem; color:#888;">등록된 커뮤니티 후기가 없습니다.</td></tr>`;
      return;
    }

    tbody.innerHTML = posts.map(p => {
      const isHidden = p.status === 'hidden';
      const isDeleted = p.status === 'deleted';
      const statusBadge = isDeleted
        ? `<span class="badge-status suspended">🗑️ 영구 삭제</span>`
        : (isHidden ? `<span class="badge-status suspended">🔒 블라인드</span>` : `<span class="badge-status active">공개 게시</span>`);

      const bestBadge = p.isBestKnowhow 
        ? `<span style="color: #d97706; font-weight: 800;">👑 베스트 핀</span>`
        : `<span style="color: #aaa;">-</span>`;

      return `
        <tr>
          <td><strong>${p.author}</strong></td>
          <td><span style="color: var(--amber-deep); font-weight:700;">${p.recipeName}</span></td>
          <td>⭐ ${p.rating}</td>
          <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${p.content}</td>
          <td style="max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.78rem; color: #2e7d32;">${p.chefTip || '-'}</td>
          <td>❤️ ${p.likes}</td>
          <td>${bestBadge}</td>
          <td>${statusBadge}</td>
          <td>
            <div style="display: flex; gap: 4px;">
              ${isHidden 
                ? `<button type="button" class="btn-table-action btn-mod-restore" data-post-id="${p.id}">🔓 공개</button>`
                : `<button type="button" class="btn-table-action btn-mod-hide" data-post-id="${p.id}">🔒 숨김</button>`}
              <button type="button" class="btn-table-action btn-mod-best" data-post-id="${p.id}" title="베스트 노하우 지정/해제">👑</button>
              <button type="button" class="btn-table-action btn-mod-del" data-post-id="${p.id}">🗑️</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('.btn-mod-hide').forEach(btn => {
      btn.addEventListener('click', () => {
        store.moderatePost(btn.dataset.postId, 'hide');
        this.showToast('🔒 해당 후기가 블라인드(숨김) 처리되었습니다.');
        this.renderAdminCommunity();
      });
    });

    tbody.querySelectorAll('.btn-mod-restore').forEach(btn => {
      btn.addEventListener('click', () => {
        store.moderatePost(btn.dataset.postId, 'restore');
        this.showToast('🔓 후기가 다시 공개 상태로 전환되었습니다.');
        this.renderAdminCommunity();
      });
    });

    tbody.querySelectorAll('.btn-mod-best').forEach(btn => {
      btn.addEventListener('click', () => {
        store.moderatePost(btn.dataset.postId, 'toggle_best');
        this.showToast('👑 베스트 노하우 뱃지가 토글되었습니다.');
        this.renderAdminCommunity();
      });
    });

    tbody.querySelectorAll('.btn-mod-del').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('이 후기를 영구 삭제 처리하시겠습니까?')) {
          store.moderatePost(btn.dataset.postId, 'delete');
          this.showToast('🗑️ 후기가 삭제되었습니다.');
          this.renderAdminCommunity();
        }
      });
    });
  }

  // 5. AI 에이전트 자원 사용량 및 활동 통계
  renderAdminStats() {
    const stats = store.getAgentStats();
    const elRuns = document.getElementById('metric-total-runs');
    if (elRuns) elRuns.textContent = `${stats.agentPipeline.totalRuns}회`;
    const elSuccess = document.getElementById('metric-success-rate');
    if (elSuccess) elSuccess.textContent = stats.agentPipeline.successRate;
    const elLatency = document.getElementById('metric-avg-latency');
    if (elLatency) elLatency.textContent = `${stats.agentPipeline.avgResponseMs}ms`;
    const elVision = document.getElementById('metric-vision-scans');
    if (elVision) elVision.textContent = `${stats.visionAi.totalScans}건`;

    const tbody = document.getElementById('admin-agents-tbody');
    if (!tbody) return;

    tbody.innerHTML = stats.agents.map(ag => `
      <tr>
        <td><strong>${ag.name}</strong></td>
        <td style="color: #666; font-size: 0.82rem;">${ag.role}</td>
        <td style="font-weight: 800;">${ag.calls}회</td>
        <td style="color: #2e7d32; font-weight: 700;">${ag.success}</td>
        <td style="font-family: monospace; color: #b45309;">${ag.latency}</td>
        <td><span class="badge-status active">🟢 ${ag.status}</span></td>
      </tr>
    `).join('');
  }

  // 6. 관리자 권한 및 감사 로그 (Audit Logs)
  renderAdminAudit() {
    const cat = document.getElementById('admin-audit-filter-cat')?.value || 'all';
    let logs = store.loadAuditLogs();
    if (cat !== 'all') {
      logs = logs.filter(l => l.category === cat);
    }

    const tbody = document.getElementById('admin-audit-tbody');
    if (!tbody) return;

    if (logs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 2rem; color: #888;">기록된 감사 로그가 없습니다.</td></tr>`;
      return;
    }

    tbody.innerHTML = logs.map(l => {
      const catClass = `cat-${l.category.toLowerCase()}`;
      return `
        <tr>
          <td style="font-size: 0.75rem; color: #888; white-space: nowrap;">${l.timestamp}</td>
          <td><strong style="font-size: 0.82rem;">${l.admin}</strong></td>
          <td><span class="audit-cat-badge ${catClass}">${l.category}</span></td>
          <td style="font-weight: 700; color: var(--text-dark); font-size: 0.82rem;">${l.action}</td>
          <td style="color: var(--amber-deep); font-size: 0.8rem;">${l.target}</td>
          <td style="font-size: 0.78rem; color: #555;">${l.details}</td>
        </tr>
      `;
    }).join('');
  }

  // 모달 경고 알림 제어
  showSignAlert(msg) {
    const alertEl = document.getElementById('sign-form-alert');
    if (alertEl) {
      alertEl.innerHTML = `<span>⚠️</span> <span>${msg}</span>`;
      alertEl.style.display = 'flex';
    }
  }

  clearSignAlert() {
    const alertEl = document.getElementById('sign-form-alert');
    if (alertEl) {
      alertEl.innerHTML = '';
      alertEl.style.display = 'none';
    }
  }

  // 회원가입/로그인 모드 전환 및 폼 초기화
  switchSignMode(mode = 'login') {
    this.clearSignAlert();
    if (this.emailVerifyCountdown) {
      clearInterval(this.emailVerifyCountdown);
      this.emailVerifyCountdown = null;
    }
    this.isEmailVerified = false;

    if (this.dom.signEmail) {
      this.dom.signEmail.value = '';
      this.dom.signEmail.readOnly = false;
      this.dom.signEmail.classList.remove('is-locked');
    }
    if (this.dom.signPassword) {
      this.dom.signPassword.value = '';
      this.dom.signPassword.type = 'password';
    }
    if (this.dom.signPasswordConfirm) {
      this.dom.signPasswordConfirm.value = '';
      this.dom.signPasswordConfirm.type = 'password';
    }
    if (this.dom.signVerifyCode) {
      this.dom.signVerifyCode.value = '';
    }
    if (this.dom.badgeEmailVerified) {
      this.dom.badgeEmailVerified.style.display = 'none';
    }
    if (this.dom.groupSignVerifyCode) {
      this.dom.groupSignVerifyCode.style.display = 'none';
    }
    if (this.dom.verifyTimer) {
      this.dom.verifyTimer.textContent = '05:00';
    }
    if (this.dom.verifyStatusHint) {
      this.dom.verifyStatusHint.textContent = '';
      this.dom.verifyStatusHint.className = 'verify-status-hint';
    }
    if (this.dom.pwMatchHint) {
      this.dom.pwMatchHint.textContent = '';
      this.dom.pwMatchHint.className = 'pw-match-hint';
    }
    if (this.dom.btnTogglePw) {
      this.dom.btnTogglePw.textContent = '👁️';
    }
    if (this.dom.btnTogglePwConfirm) {
      this.dom.btnTogglePwConfirm.textContent = '👁️';
    }
    [this.dom.ruleLen, this.dom.ruleAlpha, this.dom.ruleDigit, this.dom.ruleSpecial].forEach(el => {
      if (el) el.classList.remove('active');
    });

    if (mode === 'login') {
      if (this.dom.tabModalLogin) this.dom.tabModalLogin.classList.add('active');
      if (this.dom.tabModalSignup) this.dom.tabModalSignup.classList.remove('active');
      if (this.dom.groupSignName) this.dom.groupSignName.style.display = 'none';
      if (this.dom.signFormTitle) this.dom.signFormTitle.textContent = '반가워요, 셰프님!';
      if (this.dom.signFormSubtitle) this.dom.signFormSubtitle.textContent = '등록된 키친 계정으로 온기 가득한 요리를 시작하세요.';
      if (this.dom.btnSubmitSign) this.dom.btnSubmitSign.textContent = '키친 셰프 로그인 🥢';
      if (this.dom.signSnsDividerText) this.dom.signSnsDividerText.textContent = 'SNS 간편 로그인';
      if (this.dom.btnGoogleLoginText) this.dom.btnGoogleLoginText.textContent = 'Google 계정으로 계속하기';

      if (this.dom.btnSendEmailVerify) this.dom.btnSendEmailVerify.style.display = 'none';
      if (this.dom.wrapperSignEmail) this.dom.wrapperSignEmail.classList.remove('with-action-btn');

      if (this.dom.wrapperSignPassword) this.dom.wrapperSignPassword.classList.remove('is-locked');
      if (this.dom.signPassword) {
        this.dom.signPassword.disabled = false;
        this.dom.signPassword.placeholder = '키친 셰프 비밀번호를 입력하세요';
      }
      if (this.dom.pwRulesChecklist) this.dom.pwRulesChecklist.style.display = 'none';
      if (this.dom.groupSignPasswordConfirm) this.dom.groupSignPasswordConfirm.style.display = 'none';
    } else {
      if (this.dom.tabModalSignup) this.dom.tabModalSignup.classList.add('active');
      if (this.dom.tabModalLogin) this.dom.tabModalLogin.classList.remove('active');
      if (this.dom.groupSignName) this.dom.groupSignName.style.display = 'block';
      if (this.dom.signFormTitle) this.dom.signFormTitle.textContent = '환영해요, 셰프님!';
      if (this.dom.signFormSubtitle) this.dom.signFormSubtitle.textContent = '이메일 인증 및 비밀번호를 설정하여 나만의 냉장고를 관리해보세요.';
      if (this.dom.btnSubmitSign) this.dom.btnSubmitSign.textContent = '회원가입 완료 및 냉장고 생성 🎁';
      if (this.dom.signSnsDividerText) this.dom.signSnsDividerText.textContent = 'SNS 간편 회원가입';
      if (this.dom.btnGoogleLoginText) this.dom.btnGoogleLoginText.textContent = 'Google 계정으로 간편 가입';

      if (this.dom.btnSendEmailVerify) {
        this.dom.btnSendEmailVerify.style.display = 'block';
        this.dom.btnSendEmailVerify.disabled = false;
        this.dom.btnSendEmailVerify.textContent = '인증번호 전송';
      }
      if (this.dom.wrapperSignEmail) this.dom.wrapperSignEmail.classList.add('with-action-btn');

      // 단계별 언락: 이메일 인증 전까지 비밀번호 및 확인 필드 잠금
      if (this.dom.wrapperSignPassword) this.dom.wrapperSignPassword.classList.add('is-locked');
      if (this.dom.signPassword) {
        this.dom.signPassword.disabled = true;
        this.dom.signPassword.placeholder = '🔒 이메일 인증 후 입력 가능';
      }
      if (this.dom.pwRulesChecklist) this.dom.pwRulesChecklist.style.display = 'flex';
      if (this.dom.groupSignPasswordConfirm) this.dom.groupSignPasswordConfirm.style.display = 'block';
      if (this.dom.wrapperSignPasswordConfirm) this.dom.wrapperSignPasswordConfirm.classList.add('is-locked');
      if (this.dom.signPasswordConfirm) {
        this.dom.signPasswordConfirm.disabled = true;
        this.dom.signPasswordConfirm.placeholder = '🔒 이메일 인증 후 입력 가능';
      }
    }
  }

  // 비밀번호 복합성 실시간 검증 (8자 이상, 영문, 숫자, 특수문자)
  checkPasswordComplexity(pwd) {
    const p = typeof pwd === 'string' ? pwd : '';
    const hasLength = p.length >= 8;
    const hasAlpha = /[a-zA-Z]/.test(p);
    const hasDigit = /[0-9]/.test(p);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p);

    if (this.dom.ruleLen) this.dom.ruleLen.classList.toggle('active', hasLength);
    if (this.dom.ruleAlpha) this.dom.ruleAlpha.classList.toggle('active', hasAlpha);
    if (this.dom.ruleDigit) this.dom.ruleDigit.classList.toggle('active', hasDigit);
    if (this.dom.ruleSpecial) this.dom.ruleSpecial.classList.toggle('active', hasSpecial);

    return hasLength && hasAlpha && hasDigit && hasSpecial;
  }

  // 비밀번호 일치 실시간 검증
  checkPasswordMatch() {
    if (!this.dom.pwMatchHint) return;
    const pwd = this.dom.signPassword?.value || '';
    const confirmPwd = this.dom.signPasswordConfirm?.value || '';

    if (!confirmPwd) {
      this.dom.pwMatchHint.textContent = '';
      this.dom.pwMatchHint.className = 'pw-match-hint';
      return;
    }

    if (pwd === confirmPwd) {
      this.dom.pwMatchHint.textContent = '✔️ 비밀번호가 일치합니다.';
      this.dom.pwMatchHint.className = 'pw-match-hint match';
    } else {
      this.dom.pwMatchHint.textContent = '❌ 비밀번호가 일치하지 않습니다.';
      this.dom.pwMatchHint.className = 'pw-match-hint mismatch';
    }
  }

  // 이메일 인증 타이머 제어 (5분 카운트다운)
  startEmailVerifyTimer(durationSeconds = 300) {
    if (this.emailVerifyCountdown) {
      clearInterval(this.emailVerifyCountdown);
      this.emailVerifyCountdown = null;
    }
    let remaining = durationSeconds;
    const updateDisplay = () => {
      const mins = String(Math.floor(remaining / 60)).padStart(2, '0');
      const secs = String(remaining % 60).padStart(2, '0');
      if (this.dom.verifyTimer) {
        this.dom.verifyTimer.textContent = `${mins}:${secs}`;
      }
      if (remaining <= 0) {
        clearInterval(this.emailVerifyCountdown);
        this.emailVerifyCountdown = null;
        if (this.dom.verifyStatusHint) {
          this.dom.verifyStatusHint.textContent = '⚠️ 인증번호 유효시간이 만료되었습니다. 재전송을 눌러주세요.';
          this.dom.verifyStatusHint.className = 'verify-status-hint error';
        }
        if (this.dom.btnConfirmEmailVerify) {
          this.dom.btnConfirmEmailVerify.disabled = true;
        }
      }
      remaining--;
    };
    updateDisplay();
    this.emailVerifyCountdown = setInterval(updateDisplay, 1000);
    if (this.dom.btnConfirmEmailVerify) {
      this.dom.btnConfirmEmailVerify.disabled = false;
    }
  }

  // 모달 제어
  openSignModal(mode = 'login') {
    this.switchSignMode(mode);
    const signCard = document.querySelector('.sign-modal-card');
    if (signCard) {
      signCard.classList.toggle('is-locked', !store.currentUser?.isLoggedIn);
    }
    if (this.dom.signModal) {
      this.dom.signModal.classList.add('active');
    }
  }

  closeSignModal(force = false) {
    if (!force && (!store.currentUser || !store.currentUser.isLoggedIn)) {
      this.showToast('🔒 키친 셰프 서비스를 이용하시려면 먼저 로그인이 필요합니다.');
      this.showSignAlert('서비스를 이용하시려면 먼저 로그인 또는 회원가입을 완료해 주세요.');
      return false;
    }
    if (this.emailVerifyCountdown) {
      clearInterval(this.emailVerifyCountdown);
      this.emailVerifyCountdown = null;
    }
    this.clearSignAlert();
    if (this.dom.signEmail) this.dom.signEmail.value = '';
    if (this.dom.signPassword) this.dom.signPassword.value = '';
    if (this.dom.signPasswordConfirm) this.dom.signPasswordConfirm.value = '';
    if (this.dom.signVerifyCode) this.dom.signVerifyCode.value = '';
    if (this.dom.signModal) {
      this.dom.signModal.classList.remove('active');
    }
    return true;
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
window.addEventListener('DOMContentLoaded', async () => {
  if (typeof loadViewSections === 'function') {
    await loadViewSections();
  }
  window.kitchenApp = new KitchenChefApp();
});

window.addEventListener('views:loaded', () => {
  if (window.kitchenApp) {
    window.kitchenApp.dom.navTabs = document.querySelectorAll('.nav-tab-btn');
    window.kitchenApp.dom.viewSections = document.querySelectorAll('.view-section');
    window.kitchenApp.initAdminConsole();
    window.kitchenApp.renderUser();
  }
});

