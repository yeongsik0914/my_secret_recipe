// js/app.js
// 키친 셰프 (Kitchen Chef) 메인 애플리케이션 컨트롤러

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

    this.initAgents();
    this.initDOM();
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

  // 2. DOM 요소 캐싱
  initDOM() {
    this.dom = {
      // 탭 네비게이션
      navTabs: document.querySelectorAll('.nav-tab-btn'),
      viewSections: document.querySelectorAll('.view-section'),
      brandHomeBtn: document.getElementById('brand-home-btn'),

      // 유저 프로필
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

      // 도마 위 상세 조리 뷰
      detailCraftNo: document.getElementById('detail-craft-no'),
      detailRecipeTitle: document.getElementById('detail-recipe-title'),
      youtubeIframe: document.getElementById('youtube-iframe'),
      detailChannelName: document.getElementById('detail-channel-name'),
      detailChannelStats: document.getElementById('detail-channel-stats'),
      detailMatchRatio: document.getElementById('detail-ingredient-match-ratio'),
      detailIngredientsList: document.getElementById('detail-ingredients-list'),
      detailStepsList: document.getElementById('detail-steps-list'),
      btnConfirmCooking: document.getElementById('btn-confirm-cooking-deduct'),
      btnBackToRecipes: document.getElementById('btn-back-to-recipes'),

      // 완료 커뮤니티 뷰
      certRecipeTitle: document.getElementById('cert-recipe-title'),
      certRecipeThumb: document.getElementById('cert-recipe-thumb'),
      certTime: document.getElementById('cert-time'),
      certCalorie: document.getElementById('cert-calorie'),
      communityReviewForm: document.getElementById('community-review-form'),
      reviewContent: document.getElementById('review-content'),
      reviewChefTip: document.getElementById('review-chef-tip'),
      communityPostsList: document.getElementById('community-posts-list'),
      communityPostCount: document.getElementById('community-post-count'),

      // 모달 & 하네스 독
      signModal: document.getElementById('sign-modal-backdrop'),
      btnCloseSignModal: document.getElementById('btn-close-sign-modal'),
      tabModalLogin: document.getElementById('tab-modal-login'),
      tabModalSignup: document.getElementById('tab-modal-signup'),
      btnSubmitSign: document.getElementById('btn-submit-sign'),
      signEmail: document.getElementById('sign-email'),
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
        if (targetView === 'view-animation') {
          this.switchTab('view-animation');
          this.runForced2SecondAnimation();
        } else {
          this.switchTab(targetView);
        }
      });
    });

    this.dom.brandHomeBtn.addEventListener('click', () => {
      this.switchTab('view-main');
    });

    // 개인 냉장고 모드 토글
    this.dom.btnModeMyFridge.addEventListener('click', () => {
      this.dom.btnModeMyFridge.classList.add('active');
      this.dom.btnModeEmptyFridge.classList.remove('active');
      store.restoreDefaultFridge();
      this.showToast('내 냉장고 재고 모드가 활성화되었습니다.');
    });

    this.dom.btnModeEmptyFridge.addEventListener('click', () => {
      this.dom.btnModeEmptyFridge.classList.add('active');
      this.dom.btnModeMyFridge.classList.remove('active');
      store.resetToEmptyFridge();
      this.showToast('빈 냉장고 모드로 전환되었습니다. 사진이나 텍스트로 채워보세요!');
    });

    this.dom.btnRestoreDefaultFridge.addEventListener('click', () => {
      store.restoreDefaultFridge();
      this.showToast('기본 식재료 프리셋이 복원되었습니다.');
    });

    this.dom.btnToggleSelectAll.addEventListener('click', () => {
      const selected = store.getSelectedIngredients();
      const allSelected = selected.length === store.getIngredients().filter(i => i.count > 0).length;
      store.toggleSelectAll(!allSelected);
    });

    // 비전 이미지 업로드
    this.dom.btnUploadCamera.addEventListener('click', () => {
      this.dom.visionFileInput.click();
    });

    this.dom.visionFileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        this.showToast('📷 Vision Agent가 냉장고/영수증 이미지를 분석 중입니다...');
        await visionAgent.analyzeImage(file, store);
        this.showToast('✨ 식재료가 인식되어 개인 냉장고에 자동 등록되었습니다!');
      }
    });

    // 드래그앤드롭 지원
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

    // 직접 텍스트 입력
    this.dom.manualForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = this.dom.manualName.value.trim();
      const count = this.dom.manualCount.value.trim() || '1';
      const shelf = this.dom.manualShelf.value;

      if (!name) return;

      visionAgent.parseNaturalText(`${name} ${count}`, store);
      this.dom.manualName.value = '';
      this.dom.manualCount.value = '';
      this.showToast(`✨ '${name}'이(가) 냉장고에 저장되었습니다.`);
    });

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
    this.dom.toggleAutoDeduct.addEventListener('change', (e) => {
      store.setAutoDeduct(e.target.checked);
      this.showToast(e.target.checked ? '식재료 실시간 자동 차감이 켜졌습니다.' : '식재료 자동 차감이 꺼졌습니다.');
    });

    // 🚪 메인 CTA: [냉장고 문 열고 요리 찾기 ➔]
    this.dom.btnTriggerSearch.addEventListener('click', () => {
      const selected = store.getSelectedIngredients();
      if (selected.length === 0) {
        this.showToast('⚠️ 냉장고에서 최소 1개 이상의 식재료를 선택해주세요!');
        return;
      }
      this.switchTab('view-animation');
      this.runForced2SecondAnimation();
    });

    // 애니메이션 뷰 컨트롤
    this.dom.btnReplayAni.addEventListener('click', () => {
      this.runForced2SecondAnimation();
    });

    this.dom.btnGoRecipesNow.addEventListener('click', () => {
      this.switchTab('view-recipes');
    });

    this.dom.btnSoundToggle.addEventListener('click', () => {
      this.soundEnabled = !this.soundEnabled;
      this.dom.soundStatusText.textContent = this.soundEnabled ? '사운드 효과 ON' : '사운드 효과 OFF';
      this.showToast(this.soundEnabled ? '사운드 효과가 켜졌습니다.' : '사운드 효과가 음소거되었습니다.');
    });

    // 도마 레시피 뷰 필터 및 수정
    this.dom.btnEditIngredients.addEventListener('click', () => {
      this.switchTab('view-main');
    });

    this.dom.btnBannerMore.addEventListener('click', () => {
      this.switchTab('view-main');
    });

    this.dom.btnSubFilters.forEach(btn => {
      btn.addEventListener('click', () => {
        this.dom.btnSubFilters.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.matchFilter = btn.dataset.match;
        this.renderRecipeCards();
      });
    });

    // 상세 조리 뷰 컨트롤
    this.dom.btnBackToRecipes.addEventListener('click', () => {
      this.switchTab('view-recipes');
    });

    // 🍽️ 핵심: [조리 완료 및 냉장고 재료 소진하기]
    this.dom.btnConfirmCooking.addEventListener('click', () => {
      this.completeCookingAndDeduct();
    });

    // 커뮤니티 후기 등록
    this.dom.communityReviewForm.addEventListener('submit', (e) => {
      e.preventDefault();
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

    // 회원가입/로그인 모달
    this.dom.userProfileBtn.addEventListener('click', () => {
      this.openSignModal();
    });

    this.dom.btnCloseSignModal.addEventListener('click', () => {
      this.closeSignModal();
    });

    this.dom.signModal.addEventListener('click', (e) => {
      if (e.target === this.dom.signModal) {
        this.closeSignModal();
      }
    });

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

    this.dom.btnSubmitSign.addEventListener('click', () => {
      const email = this.dom.signEmail.value.trim();
      store.login(email, '요리하는 소라');
      this.closeSignModal();
      this.showToast('셰프 계정으로 로그인되어 개인 냉장고가 연결되었습니다!');
    });

    // 하네스 독 토글
    this.dom.harnessDockHeader.addEventListener('click', () => {
      this.dom.harnessDock.classList.toggle('collapsed');
      const isCollapsed = this.dom.harnessDock.classList.contains('collapsed');
      this.dom.harnessDockToggleIcon.textContent = isCollapsed ? '▲ 확장' : '▼ 축소';
    });

    // 스토어 이벤트 구독
    store.subscribe((event, payload) => {
      this.renderFridge();
      this.renderUser();
      if (event === 'POST_ADDED') {
        this.renderCommunityPosts();
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

    // 비동기 레시피 검색 및 품질 검증 에이전트 병렬 가동
    const theme = store.getActiveTheme();
    const searchPromise = searchAgent.searchRecipes({ selectedIngredients: selected, theme });
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

          // 부드러운 화면 전환 (200ms 지연)
          setTimeout(() => {
            this.switchTab('view-recipes');
          }, 350);
        });
      }
    };

    requestAnimationFrame(updateTimer);
  }

  // 6. 도마 레시피 목록 렌더링
  renderRecipeCards() {
    let list = this.currentRecipesList;

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
      ? (list.reduce((acc, r) => acc + r.matchRate, 0) / list.length).toFixed(1)
      : 0;
    this.dom.recipesAvgMatch.textContent = avg;

    // 상단 선택된 재료 칩 렌더링
    const selected = store.getSelectedIngredients();
    this.dom.recipeSelectedChips.innerHTML = selected.map(item => `
      <span class="filter-chip">${this.getFoodEmoji(item.name)} ${item.name}</span>
    `).join('');

    // 레시피 카드 그리드 HTML 렌더링
    this.dom.recipesGrid.innerHTML = list.map(recipe => {
      return `
        <article class="recipe-card" data-id="${recipe.id}">
          <div class="craft-badge-bar">
            <span>${recipe.craftNo}</span>
            <span>★</span>
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
    this.dom.youtubeIframe.src = `https://www.youtube-nocookie.com/embed/${recipe.youtube.embedId}?autoplay=0`;
    this.dom.detailMatchRatio.textContent = `일치율 ${recipe.matchRate}%`;

    // 식재료 태그 목록
    this.dom.detailIngredientsList.innerHTML = recipe.ingredients.map(ing => `
      <span class="tag-ingredient ${ing.match ? 'matched' : ''}">
        ${ing.match ? '✓ ' : ''}${ing.name} (${ing.need}${ing.unit})
      </span>
    `).join('');

    // 스텝 바이 스텝 리스트
    this.dom.detailStepsList.innerHTML = recipe.steps.map(s => `
      <div class="step-item">
        <div class="step-num">${s.step}</div>
        <div class="step-body">
          <div class="step-title-row">
            <span class="step-title">${s.title}</span>
            <span class="step-time">⏱ ${s.time}</span>
          </div>
          <p class="step-desc">${s.desc}</p>
        </div>
      </div>
    `).join('');

    this.switchTab('view-detail');
  }

  // 8. ⭐ 조리 완료 및 냉장고 식재료 실시간 자동 소진 (Deduction)
  completeCookingAndDeduct() {
    harness.setPipelineState('DEDUCTING', { recipe: this.activeRecipe.title });
    harness.addLog('DEDUCTION', `조리 완료: [${this.activeRecipe.title}]`, '냉장고 재고 실시간 차감 파이프라인 가동', 'info');

    // 스토어에서 식재료 실시간 차감 실행
    const result = store.deductRecipeIngredients(this.activeRecipe);

    let toastMsg = `🍽️ [${this.activeRecipe.title}] 조리 완료! `;
    if (result.deducted.length > 0) {
      toastMsg += `${result.deducted.map(d => `${d.name} -${d.deducted}${d.unit}`).join(', ')} 소진되었습니다.`;
    }
    if (result.depleted.length > 0) {
      toastMsg += ` (⚠️ ${result.depleted.join(', ')} 완전 소진)`;
    }

    this.showToast(toastMsg);
    harness.addLog('DEDUCTION', '냉장고 재고 차감 완료', JSON.stringify(result.deducted), 'success');

    // 커뮤니티 완료 뷰 준비
    this.dom.certRecipeTitle.textContent = this.activeRecipe.title;
    this.dom.certTime.textContent = `소요 시간 ${this.activeRecipe.timeMinutes}분`;
    this.dom.certCalorie.textContent = `약 ${this.activeRecipe.calorie} kcal`;

    this.switchTab('view-community');
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
      chip.addEventListener('click', (e) => {
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

  // 10. 커뮤니티 후기 렌더링
  renderCommunityPosts() {
    const posts = store.posts;
    this.dom.communityPostCount.textContent = posts.length;

    this.dom.communityPostsList.innerHTML = posts.map(post => `
      <div class="post-card">
        <div class="post-header">
          <div class="post-author-row">
            <span class="post-author-name">${post.author}</span>
            <span class="badge-ai" style="background: #f1f5f9; color: #475569;">${post.authorBadge}</span>
            <span class="badge-ai" style="background: #fef3c7; color: #b45309;">${post.tag}</span>
          </div>
          <span class="post-time">${post.timeAgo} • ★★★★★</span>
        </div>

        <p class="post-body-text">${post.content}</p>

        ${post.chefTip ? `<div class="post-chef-tip">👨‍🍳 셰프 추가 팁: ${post.chefTip}</div>` : ''}

        <div class="post-footer-actions">
          <div style="display: flex; gap: 1rem;">
            <span>👍 좋아요 ${post.likes}</span>
            <span>💬 댓글 ${post.comments}</span>
          </div>
          <span style="color: var(--green-accent); font-weight: 700;">✓ 완식 인증 완료</span>
        </div>
      </div>
    `).join('');
  }

  // 11. 유저 정보 렌더링
  renderUser() {
    const user = store.currentUser;
    this.dom.userNameDisplay.textContent = user.name;
    this.dom.userLvlDisplay.textContent = user.level;
  }

  renderAll() {
    this.renderUser();
    this.renderFridge();
    this.renderRecipeCards();
    this.renderCommunityPosts();
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
