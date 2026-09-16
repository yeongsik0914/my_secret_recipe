// js/harness/search-agent.js
// Recipe Discovery & Search Agent: 한국 인기 레시피 및 유튜브 영상 탐색

import { RECIPES_DATA } from '../recipes-data.js';

export class SearchAgent {
  constructor() {
    this.name = 'Recipe Search & Discovery Agent';
    this.harness = null;
  }

  init(harness) {
    this.harness = harness;
  }

  async searchRecipes({ selectedIngredients = [], theme = 'all' }) {
    this.harness.setPipelineState('SEARCHING', {
      selectedCount: selectedIngredients.length,
      theme
    });

    this.harness.addLog(
      'SEARCH',
      '한국 요리 빅데이터 & 유튜브 인기 영상 탐색 시작',
      `선택 식재료: [${selectedIngredients.map(i => i.name).join(', ')}] / 테마: ${theme}`,
      'info'
    );

    // 탐색 지연 효과 (하네스 비동기 처리)
    await new Promise(r => setTimeout(r, 400));

    const ingredientNames = selectedIngredients.map(i => i.name);

    // 레시피 후보군 필터링 및 일치도 사전 평가
    const candidates = RECIPES_DATA.map(recipe => {
      // 필요 재료 중 냉장고 재료 매칭 개수
      let matchCount = 0;
      const updatedIngredients = recipe.ingredients.map(req => {
        const has = ingredientNames.some(name => name.includes(req.name) || req.name.includes(name));
        if (has) matchCount++;
        return { ...req, match: has };
      });

      const totalReq = recipe.ingredients.length;
      const matchRate = Math.min(100, Math.round((matchCount / totalReq) * 100));

      return {
        ...recipe,
        ingredients: updatedIngredients,
        calculatedMatchRate: matchRate,
        matchedCount: matchCount
      };
    });

    // 테마 필터 (테마가 전체가 아닌 경우 가중치)
    let filtered = candidates;
    if (theme && theme !== 'all') {
      filtered = candidates.filter(r => r.theme === theme || r.calculatedMatchRate >= 80);
    }

    this.harness.addLog(
      'SEARCH',
      `후보 레시피 ${filtered.length}건 발굴`,
      `Quality Gate 에이전트로 데이터 전송 및 규격 검증 요청`,
      'info'
    );

    return filtered;
  }
}

export const searchAgent = new SearchAgent();
