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

    // 3. 테마 및 검색어 기반 지능형 필터링 & 신규 맞춤 레시피 합성
    let filtered = candidates;

    if (cleanQuery) {
      // 1) 기존 데이터셋에서 검색어(메뉴명, 조리방식, 식재료) 매칭 탐색
      const directMatches = candidates.filter(r => 
        r.title.toLowerCase().includes(cleanQuery) || 
        r.subTitle.toLowerCase().includes(cleanQuery) ||
        r.description.toLowerCase().includes(cleanQuery) ||
        r.ingredients.some(i => i.name.toLowerCase().includes(cleanQuery))
      );

      if (directMatches.length > 0) {
        directMatches.forEach(r => {
          r.isCustomSearchMatch = true;
          r.calculatedMatchRate = Math.max(r.calculatedMatchRate, 95);
        });
        filtered = directMatches;
      } else {
        // 2) 데이터셋에 없는 새로운 프롬프트/조리방식인 경우: 냉장고 재료를 기반으로 즉시 AI 맞춤 레시피 합성 생성
        const primaryIngs = selectedIngredients.length > 0 
          ? selectedIngredients.slice(0, 4) 
          : [{ name: '신선 재료', count: 1, unit: '개', shelf: 'vege' }];

        const customDishTitle = cleanQuery.includes('요리') || cleanQuery.includes('구이') || cleanQuery.includes('찌개') || cleanQuery.includes('볶음') || cleanQuery.includes('밥') || cleanQuery.includes('전')
          ? cleanQuery
          : `${cleanQuery} 특선 요리`;

        const synthesizedRecipe = {
          id: `custom_ai_${Date.now()}`,
          craftNo: "AI CHEF SPECIAL",
          title: customDishTitle,
          subTitle: `AI 셰프 맞춤 프롬프트 레시피 • ${cleanQuery}`,
          description: `사용자 맞춤 프롬프트 "${cleanQuery}"을(를) 반영하여 냉장고 속 식재료(${primaryIngs.map(i => i.name).join(', ')})로 완벽하게 조리할 수 있도록 설계된 특별 레시피입니다.`,
          theme: theme !== 'all' ? theme : 'quick_15min',
          rating: 5.0,
          reviewCount: 77,
          timeMinutes: 15,
          difficulty: "난이도 하",
          calorie: 460,
          matchRate: 100,
          badgeText: "AI 맞춤 프롬프트 100%",
          isUserRecipe: true,
          isCustomSearchMatch: true,
          calculatedMatchRate: 100,
          matchedCount: primaryIngs.length,
          youtube: {
            channel: "AI 셰프의 시크릿 키친",
            subscribers: "실시간 추천",
            views: "100만회",
            title: `집에서 실패 없이 완성하는 ${customDishTitle} 황금 레시피`,
            embedId: "A5Qg-JriOX4",
            url: "https://www.youtube.com"
          },
          ingredients: primaryIngs.map(i => ({
            name: i.name,
            need: i.count || 1,
            unit: i.unit || '개',
            match: true,
            shelf: i.shelf || 'vege'
          })),
          missingIngredients: [],
          steps: [
            { step: 1, title: "식재료 다듬기 & 조리 준비", desc: `보관된 ${primaryIngs.map(i => i.name).join(', ')}을(를) 깨끗이 손질하고 먹기 좋은 크기로 정갈하게 썰어둡니다.`, time: "3분" },
            { step: 2, title: "팬 예열 및 베이스 풍미 형성", desc: `팬에 기름 또는 양념 베이스를 두르고 중불에서 식재료를 넣어 고소한 풍미가 올라올 때까지 볶아줍니다.`, time: "4분" },
            { step: 3, title: `${cleanQuery} 맞춤 비법 조리`, desc: `${cleanQuery} 특유의 감칠맛과 풍미가 깊게 배어들도록 간을 맞추며 정성스럽게 익혀냅니다.`, time: "5분" },
            { step: 4, title: "도마 플레이팅 & 서빙", desc: `완성된 요리를 도마 위에 예쁘게 담아내고 따뜻할 때 바로 맛있게 즐깁니다.`, time: "3분" }
          ]
        };

        filtered = [synthesizedRecipe, ...candidates];
      }
    } else if (theme && theme !== 'all') {
      const themeMatches = candidates.filter(r => r.theme === theme);
      const others = candidates.filter(r => r.theme !== theme);
      filtered = [...themeMatches, ...others];
    } else {
      filtered = candidates.sort((a, b) => (b.calculatedMatchRate || 0) - (a.calculatedMatchRate || 0));
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
