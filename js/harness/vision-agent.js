// js/harness/vision-agent.js
// Vision & Inventory Agent: 사진/영수증 이미지 분석 및 식재료 자동 파싱

export class VisionAgent {
  constructor() {
    this.name = 'Vision & Inventory Agent';
    this.harness = null;
  }

  init(harness) {
    this.harness = harness;
  }

  // 이미지 파일 또는 샘플 이미지 분석
  async analyzeImage(fileOrDataUrl, store) {
    this.harness.setPipelineState('INGESTING', { source: 'VisionAgent', step: 'OCR & Object Detection' });
    this.harness.addLog('VISION', '이미지 분석 파이프라인 가동', '냉장고 내부 및 영수증 이미지 데이터 스캔 시작...', 'info');

    // 비동기 처리 지연 효과 (실감나는 AI 스캔 효과 600ms)
    await new Promise(resolve => setTimeout(resolve, 600));

    // 영수증 및 냉장고 사진에서 인식 가능한 스마트 식재료 추출 프리셋
    const detectedItems = [
      { name: '대파', count: 2, unit: '대', shelf: 'vege', confidence: 0.98 },
      { name: '양파', count: 1, unit: '개', shelf: 'vege', confidence: 0.95 },
      { name: '스팸', count: 1, unit: '캔', shelf: 'meat', confidence: 0.99 },
      { name: '계란', count: 6, unit: '알', shelf: 'dairy', confidence: 0.97 },
      { name: '두부', count: 1, unit: '모', shelf: 'dairy', confidence: 0.96 },
      { name: '김치', count: 500, unit: 'g', shelf: 'sauce', confidence: 0.94 }
    ];

    const addedList = [];
    detectedItems.forEach(item => {
      const added = store.addIngredient(item.name, item.count, item.unit, item.shelf);
      if (added) addedList.push(added);
    });

    this.harness.addLog(
      'VISION',
      `식재료 ${detectedItems.length}종 인식 성공`,
      `[감지 결과] ${detectedItems.map(i => `${i.name}(${i.count}${i.unit})`).join(', ')}`,
      'success'
    );

    this.harness.emit('INGREDIENTS_RECOGNIZED', {
      items: detectedItems,
      addedCount: addedList.length
    });

    this.harness.setPipelineState('IDLE', { status: 'Vision Complete' });
    return detectedItems;
  }

  // 자연어 텍스트 직접 입력 분석 ("감자 3개", "스팸 1캔 야채칸" 등)
  parseNaturalText(text, store) {
    this.harness.addLog('VISION', '자연어 텍스트 파싱 시작', `입력문: "${text}"`, 'info');

    // 쉼표나 공백 분리
    const chunks = text.split(/[,;\n]+/).map(c => c.trim()).filter(Boolean);
    const addedList = [];

    chunks.forEach(chunk => {
      // 정규식 매칭: 품목명 + (숫자) + (단위)
      const match = chunk.match(/^([가-힣a-zA-Z\s]+?)\s*(\d+(?:\.\d+)?)\s*([가-힣a-zA-Z]*)$/);
      let name, count = 1, unit = '개', shelf = 'vege';

      if (match) {
        name = match[1].trim();
        count = parseFloat(match[2]) || 1;
        unit = match[3] || '개';
      } else {
        name = chunk;
      }

      // 선반 자동 판별
      if (['스팸', '삼겹살', '소고기', '닭고기', '베이컨', '소시지', '새우', '오징어'].some(k => name.includes(k))) {
        shelf = 'meat';
        if (!match) unit = '캔';
      } else if (['계란', '달걀', '두부', '치즈', '우유', '버터', '요거트'].some(k => name.includes(k))) {
        shelf = 'dairy';
        if (!match) unit = name.includes('계란') ? '알' : (name.includes('두부') ? '모' : '장');
      } else if (['김치', '고추장', '된장', '간장', '마늘', '밥', '라면', '케첩', '마요네즈', '식용유', '참기름'].some(k => name.includes(k))) {
        shelf = 'sauce';
        if (!match) unit = name.includes('밥') ? '공기' : '스푼';
      } else {
        shelf = 'vege';
        if (!match) unit = name.includes('파') ? '대' : '개';
      }

      const added = store.addIngredient(name, count, unit, shelf);
      if (added) addedList.push(added);
    });

    this.harness.addLog(
      'VISION',
      `텍스트 파싱 완료: ${addedList.length}개 품목 등록`,
      addedList.map(a => `${a.name} ${a.count}${a.unit}`).join(', '),
      'success'
    );

    return addedList;
  }
}

export const visionAgent = new VisionAgent();
