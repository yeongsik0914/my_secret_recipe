// js/harness/agent-core.js
// 하네스(Harness) 멀티 에이전트 오케스트레이션 코어 & 이벤트 버스

export class AgentHarness {
  constructor() {
    this.agents = new Map();
    this.listeners = new Map();
    this.logs = [];
    this.logListeners = [];
    this.pipelineState = 'IDLE'; // IDLE, INGESTING, SEARCHING, VERIFYING, ANIMATING, READY, COOKING, DEDUCTING
    this.addLog('SYSTEM', 'Harness Core Initialized', '멀티 에이전트 하네스 엔진이 성공적으로 가동되었습니다.', 'ready');
  }

  // 에이전트 등록
  registerAgent(name, agentInstance) {
    this.agents.set(name, agentInstance);
    if (agentInstance && typeof agentInstance.init === 'function') {
      agentInstance.init(this);
    }
    this.addLog('HARNESS', `Agent Registered: [${name}]`, `에이전트가 하네스 파이프라인에 바인딩되었습니다.`, 'info');
  }

  getAgent(name) {
    return this.agents.get(name);
  }

  // 이벤트 발행/구독
  on(eventType, handler) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType).push(handler);
    return () => {
      const arr = this.listeners.get(eventType) || [];
      this.listeners.set(eventType, arr.filter(h => h !== handler));
    };
  }

  emit(eventType, payload = {}) {
    const handlers = this.listeners.get(eventType) || [];
    handlers.forEach(handler => {
      try {
        handler(payload);
      } catch (err) {
        console.error(`Error in event handler for ${eventType}:`, err);
        this.addLog('ERROR', `Handler Error [${eventType}]`, err.message, 'error');
      }
    });
  }

  // 상태 관리
  setPipelineState(state, meta = {}) {
    this.pipelineState = state;
    this.emit('PIPELINE_STATE_CHANGED', { state, meta });
    this.addLog('PIPELINE', `State Changed -> ${state}`, JSON.stringify(meta), 'pipeline');
  }

  getPipelineState() {
    return this.pipelineState;
  }

  // 로깅 시스템 (화면 하네스 모니터 패널에 실시간 렌더링)
  addLog(source, title, detail = '', level = 'info') {
    const entry = {
      id: 'log_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      time: new Date().toLocaleTimeString('ko-KR', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      source,
      title,
      detail,
      level
    };
    this.logs.unshift(entry);
    if (this.logs.length > 50) this.logs.pop();

    this.logListeners.forEach(listener => {
      try {
        listener(entry, this.logs);
      } catch (e) {
        console.error('Log listener error:', e);
      }
    });
  }

  onLog(listener) {
    this.logListeners.push(listener);
    return () => {
      this.logListeners = this.logListeners.filter(l => l !== listener);
    };
  }

  getLogs() {
    return this.logs;
  }
}

export const harness = new AgentHarness();
