// frontend/js/harness/search-agent.js
// Recipe Discovery & Search Agent: 외부 유튜브/웹 데이터 + 사용자 등록 공유 레시피 종합 수집 및 검색

import { RECIPES_DATA } from '../recipes-data.js';

export class SearchAgent {
  constructor() {
    this.name = 'Recipe Search & Discovery Agent';
    this.harness = null;
  }

  init(harness) {
    this.harness = harness;
  }

  // 🌟 요구사항 3, 10 & agents.md 지침 반영: 외부 자료 + 사용자 공유 레시피 종합 수집
  async searchRecipes({ selectedIngredients = [], theme = 'all', customQuery = '', userRecipes = [] }) {
    this.harness.setPipelineState('SEARCHING', {
      selectedCount: selectedIngredients.length,
      theme,
      customQuery,
      userRecipesCount: userRecipes.length
    });

    this.harness.addLog(
      'SEARCH',
      '외부 인터넷 빅데이터 + 사용자 등록 레시피 종합 수집 시작',
      `조회수/인기순 기준 탐색 | 검색어: "${customQuery || '전체'}" | 공유 레시피 ${userRecipes.length}건 포함`,
      'info'
    );

    await new Promise(r => setTimeout(r, 400));

    const ingredientNames = selectedIngredients.map(i => i.name);
    const cleanQuery = (customQuery || '').trim().toLowerCase();

    // 1. 외부 공인 레시피 데이터셋 + 사용자 직접 등록 레시피 종합 결합 (중복 메뉴 허용)
    const combinedDataset = [...RECIPES_DATA, ...userRecipes];

    // 2. 재료 일치율 및 키워드/조리방식 적합도 가중치 산출
    const candidates = combinedDataset.map(recipe => {
      let matchCount = 0;
      const totalReq = recipe.ingredients.length;

      const updatedIngredients = recipe.ingredients.map(req => {
        const has = ingredientNames.some(name => name.includes(req.name) || req.name.includes(name));
        if (has) matchCount++;
        return { ...req, match: has };
      });

      let matchRate = totalReq > 0 ? Math.min(100, Math.round((matchCount / totalReq) * 100)) : 0;

      // 원하는 메뉴/조리방식 검색어 가중치 적용
      let queryBonus = 0;
      if (cleanQuery) {
        const titleMatch = recipe.title.toLowerCase().includes(cleanQuery);
        const descMatch = recipe.description.toLowerCase().includes(cleanQuery);
        const subMatch = recipe.subTitle.toLowerCase().includes(cleanQuery);
        if (titleMatch) queryBonus += 15;
        else if (descMatch || subMatch) queryBonus += 10;
      }

      const finalMatchRate = Math.min(100, matchRate + queryBonus);

      return {
        ...recipe,
        ingredients: updatedIngredients,
        calculatedMatchRate: finalMatchRate,
        matchedCount: matchCount,
        isCustomSearchMatch: queryBonus > 0
      };
    });

    // 3. 테마 및 검색어 기반 필터링
    let filtered = candidates;
    if (cleanQuery) {
      // 검색어가 있으면 제목/설명/부제에 검색어가 포함되거나 일치율 높은 레시피 우선
      filtered = candidates.filter(r => 
        r.isCustomSearchMatch || 
        r.title.includes(cleanQuery) || 
        r.description.includes(cleanQuery) ||
        r.calculatedMatchRate >= 70
      );
    } else if (theme && theme !== 'all') {
      filtered = candidates.filter(r => r.theme === theme || r.calculatedMatchRate >= 80);
    }

    this.harness.addLog(
      'SEARCH',
      `종합 수집 결과 ${filtered.length}건 후보 발굴 (외부 + 사용자 공유)`,
      `Quality Gate 에이전트로 데이터 전송 및 agents.md 표준 규격 검증 요청`,
      'info'
    );

    return filtered;
  }
}

export const searchAgent = new SearchAgent();
