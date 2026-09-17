// js/view-loader.js
/**
 * 키친 셰프 (Kitchen Chef) 뷰 섹션 비동기 모듈 로더
 * 분리된 개별 HTML 뷰 섹션(view-main, view-animation, view-recipes, view-detail, view-community)을
 * 동적으로 페치하여 메인 index.html의 DOM 플레이스홀더에 주입합니다.
 */

export async function loadViewSections() {
  const placeholders = document.querySelectorAll('[data-include-section]');
  if (placeholders.length === 0) {
    // 이미 서버사이드 또는 사전에 로드된 상태
    return true;
  }

  const loadPromises = Array.from(placeholders).map(async (placeholder) => {
    const sectionPath = placeholder.getAttribute('data-include-section');
    if (!sectionPath) return;

    // 경로 후보: 지정 경로 -> frontend/html/ 경로 -> views/ 경로
    const candidatePaths = [
      sectionPath,
      `frontend/html/${sectionPath}`,
      `views/${sectionPath.split('/').pop()}`
    ];

    let loadedHtml = null;

    for (const url of candidatePaths) {
      try {
        const resp = await fetch(url);
        if (resp.ok) {
          loadedHtml = await resp.text();
          break;
        }
      } catch (e) {
        // 다음 후보 경로 시도
      }
    }

    if (loadedHtml) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = loadedHtml.trim();
      const newSection = tempDiv.firstElementChild;
      if (newSection) {
        placeholder.replaceWith(newSection);
      } else {
        placeholder.outerHTML = loadedHtml;
      }
    } else {
      console.error(`[ViewLoader] Failed to load section: ${sectionPath}`);
    }
  });

  await Promise.all(loadPromises);

  // 로드 완료 커스텀 이벤트 발송
  window.dispatchEvent(new CustomEvent('views:loaded'));
  return true;
}

// 글로벌 윈도우 스코프 등록
if (typeof window !== 'undefined') {
  window.loadViewSections = loadViewSections;
}
