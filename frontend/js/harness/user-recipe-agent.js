// frontend/js/harness/user-recipe-agent.js
// User Recipe & Personal DB Agent
// 개인 계정별 1:1 맞춤 AI 레시피 및 매칭 식재료 DB 영구 보관, 계정별 취향 프로파일링 및 하네스 파이프라인 연동

import { store } from '../store.js';

export class UserRecipeAgent {
  constructor() {
    this.name = 'User Recipe & Personal DB Agent';
    this.harness = null;
    this.isPersisting = false;
  }

  init(harness) {
    this.harness = harness;
    if (this.harness) {
      this.harness.on('PERSIST_USER_RECIPES', async (payload) => {
        await this.persistUserRecipes(payload);
      });
    }
  }

  /**
   * 사용자 맞춤 레시피 및 매칭 식재료를 개인 DB에 영구 보존
   * @param {Object} params
   * @param {string} params.userId 사용자 고유 ID
   * @param {Array} params.recipes 생성된 맞춤 레시피 배열
   * @param {string} [params.customQuery] 사용자 입력 프롬프트
   * @param {Array} [params.selectedIngredients] 선택된 냉장고 식재료
   * @param {string} [params.adminName] 작업자 이름
   */
  async persistUserRecipes({ userId, recipes, customQuery = '', selectedIngredients = [], adminName = null } = {}) {
    if (!recipes || recipes.length === 0) return null;

    const targetUserId = userId || ((store.getCurrentUserId && typeof store.getCurrentUserId === 'function') ? store.getCurrentUserId() : (store.currentUser?.id || store.currentUser?.uid || 'guest'));

    if (this.harness) {
      this.harness.setPipelineState('PERSISTING', { userId: targetUserId, count: recipes.length });
      this.harness.addLog(
        'USER_RECIPE_AGENT',
        '개인 계정 DB 맞춤 레시피 영구 저장 가동',
        `계정 [${targetUserId}] 맞춤 레시피 ${recipes.length}종 및 매칭 식재료 ${selectedIngredients.length}개 동기화 시작`,
        'info'
      );
    }

    this.isPersisting = true;

    try {
      // 스토어를 통해 백엔드 REST API(/api/user-recipes) 및 로컬스토리지 동시 영속화
      const result = await store.saveUserRecipesToDB(recipes, customQuery, selectedIngredients);

      if (this.harness) {
        this.harness.addLog(
          'USER_RECIPE_AGENT',
          '개인 계정 DB 레시피 영구 저장 완료',
          `성공: 1:1 맞춤 레시피 ${recipes.length}종이 사용자 전용 DB(admin_store.json)에 안전하게 보관되었습니다.`,
          'success'
        );
        this.harness.emit('USER_RECIPES_PERSISTED', {
          userId: targetUserId,
          recipes,
          customQuery,
          selectedIngredients,
          result
        });
      }

      return result;
    } catch (err) {
      console.error('[UserRecipeAgent] 레시피 DB 영구 저장 중 오류:', err);
      if (this.harness) {
        this.harness.addLog('ERROR', 'UserRecipeAgent DB 저장 실패', err.message, 'error');
      }
      return null;
    } finally {
      this.isPersisting = false;
    }
  }

  /**
   * 사용자 개인 DB에서 보관된 맞춤 레시피 목록 복원 로드
   * @param {string} [userId]
   */
  async fetchUserRecipes(userId) {
    const targetUserId = userId || ((store.getCurrentUserId && typeof store.getCurrentUserId === 'function') ? store.getCurrentUserId() : (store.currentUser?.id || store.currentUser?.uid || 'guest'));
    const data = await store.fetchUserRecipesFromDB(targetUserId);

    if (this.harness && data && data.recipes && data.recipes.length > 0) {
      this.harness.addLog(
        'USER_RECIPE_AGENT',
        '개인 계정 DB 레시피 복원 완료',
        `계정 [${targetUserId}]의 저장된 맞춤 레시피 ${data.recipes.length}종을 성공적으로 로드했습니다.`,
        'info'
      );
    }

    return data;
  }
}

export const userRecipeAgent = new UserRecipeAgent();
