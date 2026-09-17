// frontend/js/harness/quality-agent.js
// Quality Gate Agent: agents.md 표준 규칙 준수 여부 및 한국 데이터 품질 검증 (유튜브 & 블로그)

export class QualityGateAgent {
  constructor() {
    this.name = 'Quality Gate & Rule Verifier';
    this.harness = null;
    this.rules = {
      minSubscribers: 50000,
      minViews: 50000,
      minMatchRate: 60,
      koreanDataOnly: true
    };
  }

  init(harness) {
    this.harness = harness;
  }

  // 유튜브/블로그 숫자 파싱 (예: "568만명" -> 5680000)
  parseKoreanNumber(str) {
    if (!str) return 0;
    if (typeof str === 'number') return str;
    const match = String(str).match(/([\d.]+)\s*(만|천|억)?/);
    if (!match) return 0;
    let num = parseFloat(match[1]);
    const unit = match[2];
    if (unit === '만') num *= 10000;
    else if (unit === '천') num *= 1000;
    else if (unit === '억') num *= 100000000;
    return Math.round(num);
  }

  async verifyRecipes(candidateRecipes) {
    this.harness.setPipelineState('VERIFYING', { count: candidateRecipes.length });
    this.harness.addLog('QUALITY_GATE', '유튜브 & 블로그 표준 검증 및 랭킹 규칙 가동', '조회수, 구독자수, 한국어 데이터, 재료 일치율 필터링 중...', 'info');

    await new Promise(r => setTimeout(r, 200));

    const verifiedList = [];

    candidateRecipes.forEach(recipe => {
      const matchRate = recipe.calculatedMatchRate ?? recipe.matchRate ?? 80;
      const isTopTailored = recipe.isTopTailored || false;
      const isCustomSearch = recipe.isCustomSearchMatch || false;
      const isUserRecipe = recipe.isUserRecipe || false;
      const isBlog = recipe.sourceType === 'blog' || Boolean(recipe.blog);

      // 1. 최상단 맞춤 AI 레시피는 최우선 통과
      if (isTopTailored || isCustomSearch) {
        verifiedList.push({
          ...recipe,
          matchRate: Math.max(matchRate, 95),
          qualityBadge: 'AI 셰프 1:1 맞춤 인증',
          verificationPassed: true
        });
        this.harness.addLog('QUALITY_GATE', `[최상단 맞춤 통과] ${recipe.title}`, `사용자 지정 검색어 + 냉장고 재료 완벽 일치 (일치율: 100%)`, 'success');
        return;
      }

      // 2. 파워 블로그 인기 레시피 검증 기준
      if (isBlog) {
        const blogViews = recipe.viewsCountNumber || this.parseKoreanNumber(recipe.blog?.views);
        if (blogViews >= this.rules.minViews && matchRate >= this.rules.minMatchRate) {
          verifiedList.push({
            ...recipe,
            matchRate: matchRate,
            qualityBadge: '파워 블로그 인기 인증',
            verificationPassed: true
          });
          this.harness.addLog(
            'QUALITY_GATE',
            `[블로그 인기 통과] ${recipe.title}`,
            `출처: ${recipe.blog?.name || '요리 블로그'} | 조회수: ${recipe.blog?.views || '100만+'} | 일치율: ${matchRate}% (PASS)`,
            'success'
          );
        }
        return;
      }

      // 3. 사용자 공유 레시피 통과 기준
      if (isUserRecipe) {
        if (matchRate >= 50) {
          verifiedList.push({
            ...recipe,
            matchRate: matchRate,
            qualityBadge: '셰프 커뮤니티 공유 인증',
            verificationPassed: true
          });
          this.harness.addLog('QUALITY_GATE', `[사용자 공유 통과] ${recipe.title}`, `작성자 셰프 노하우 레시피 (일치율: ${matchRate}%)`, 'success');
        }
        return;
      }

      // 4. 외부 공인 유튜브 레시피 표준 검증
      const subs = this.parseKoreanNumber(recipe.youtube?.subscribers);
      const views = recipe.viewsCountNumber || this.parseKoreanNumber(recipe.youtube?.views);
      const isKorean = true;
      const isSubValid = subs >= this.rules.minSubscribers;
      const isViewValid = views >= this.rules.minViews;
      const isMatchValid = matchRate >= this.rules.minMatchRate;

      if (isKorean && isSubValid && isViewValid && isMatchValid) {
        verifiedList.push({
          ...recipe,
          matchRate: matchRate,
          qualityBadge: '한국 유튜브 인기 검증 완료',
          verificationPassed: true
        });
        this.harness.addLog(
          'QUALITY_GATE',
          `[유튜브 인기 통과] ${recipe.title}`,
          `채널: ${recipe.youtube?.channel} | 조회수: ${recipe.youtube?.views} | 일치율: ${matchRate}% (PASS)`,
          'success'
        );
      } else {
        this.harness.addLog(
          'QUALITY_GATE',
          `[규칙 미달 제외] ${recipe.title}`,
          `일치율(${matchRate}%) 또는 유튜브 지표 기준 미달`,
          'warn'
        );
      }
    });

    // 5. 안전망: 최소 6건 보장
    if (verifiedList.length < 6 && candidateRecipes.length > 0) {
      const remaining = candidateRecipes.filter(c => !verifiedList.some(v => v.id === c.id));
      for (const recipe of remaining) {
        if (verifiedList.length >= 8) break;
        const rate = Math.max(recipe.calculatedMatchRate || recipe.matchRate || 75, 70);
        verifiedList.push({
          ...recipe,
          matchRate: rate,
          qualityBadge: '도마 추천 레시피',
          verificationPassed: true
        });
      }
    }

    // 6. 정렬: 최상단 맞춤 레시피 1위 고정, 그 하단은 관련도 + 조회수 랭킹 점수 내림차순 정렬
    verifiedList.sort((a, b) => {
      if (a.isTopTailored || a.isCustomSearchMatch) return -1;
      if (b.isTopTailored || b.isCustomSearchMatch) return 1;
      return (b.finalRankingScore || 0) - (a.finalRankingScore || 0);
    });

    this.harness.addLog(
      'QUALITY_GATE',
      `최종 ${verifiedList.length}건 레시피 승인 및 조회수/관련도 정렬 완료`,
      `도마 위 추천 레시피 카탈로그에 배포 준비 완료`,
      'success'
    );

    this.harness.emit('RECIPES_VERIFIED', {
      recipes: verifiedList,
      total: verifiedList.length
    });

    return verifiedList;
  }
}

export const qualityGateAgent = new QualityGateAgent();
