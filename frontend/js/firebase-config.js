// frontend/js/firebase-config.js
// 파이어베이스(Firebase) 연동 및 하이브리드 데이터베이스 어댑터

export const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyMockKitchenChefKey1234567890",
  authDomain: "kitchen-chef-recipe.firebaseapp.com",
  projectId: "kitchen-chef-recipe",
  storageBucket: "kitchen-chef-recipe.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456789"
};

class FirebaseAdapter {
  constructor() {
    this.config = this.loadConfig();
    this.isInitialized = false;
    this.useMock = true; // 기본 키 없을 시 안전한 스마트 모의 DB 구동
    this.init();
  }

  loadConfig() {
    const raw = localStorage.getItem('kitchen_chef_firebase_config');
    if (raw) {
      try { return JSON.parse(raw); } catch { return DEFAULT_FIREBASE_CONFIG; }
    }
    return DEFAULT_FIREBASE_CONFIG;
  }

  saveConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    localStorage.setItem('kitchen_chef_firebase_config', JSON.stringify(this.config));
    this.init();
  }

  init() {
    // 실제 Firebase SDK가 window에 로드되어 있고 유효한 키가 있을 경우 실제 Firebase 초기화 가능
    if (typeof window !== 'undefined' && window.firebase && this.config.apiKey && !this.config.apiKey.includes('Mock')) {
      try {
        if (!window.firebase.apps.length) {
          window.firebase.initializeApp(this.config);
        }
        this.auth = window.firebase.auth();
        this.firestore = window.firebase.firestore();
        this.useMock = false;
        console.log("🔥 [Firebase] Connected to real Firebase cloud project:", this.config.projectId);
      } catch (err) {
        console.warn("⚠️ [Firebase] Real init failed, falling back to Local Hybrid DB:", err);
        this.useMock = true;
      }
    } else {
      this.useMock = true;
      console.log("🔥 [Firebase Adapter] Hybrid Local Firestore DB Mode Active.");
    }
    this.isInitialized = true;
  }

  // 1. 회원가입 (Firebase Auth)
  async signUp(email, password, displayName = '신규 셰프') {
    if (!this.useMock && this.auth) {
      const cred = await this.auth.createUserWithEmailAndPassword(email, password);
      await cred.user.updateProfile({ displayName });
      return { uid: cred.user.uid, email: cred.user.email, name: displayName };
    }
    // 하이브리드 로컬 DB 시뮬레이션
    const uid = 'user_' + Date.now();
    const user = { uid, email, name: displayName, createdAt: new Date().toISOString() };
    localStorage.setItem('firebase_mock_user_' + email, JSON.stringify(user));
    return user;
  }

  // 2. 로그인 (Firebase Auth)
  async signIn(email, password) {
    if (!this.useMock && this.auth) {
      const cred = await this.auth.signInWithEmailAndPassword(email, password);
      return { uid: cred.user.uid, email: cred.user.email, name: cred.user.displayName || '요리하는 소라' };
    }
    // 로컬 하이브리드 로그인
    const uid = 'user_' + (email.split('@')[0] || 'sora');
    return { uid, email, name: email.includes('sora') ? '요리하는 소라' : '열정 셰프', level: '조리 마스터 Lv.2' };
  }

  // 3. 구글 SNS 로그인 (Firebase Auth + prompt: select_account)
  async signInWithGoogle(selectedAccount = null) {
    if (!this.useMock && this.auth && window.firebase) {
      try {
        const provider = new window.firebase.auth.GoogleAuthProvider();
        provider.setCustomParameters({
          prompt: 'select_account' // 구글 계정 선택 강제
        });
        const cred = await this.auth.signInWithPopup(provider);
        return {
          uid: cred.user.uid,
          email: cred.user.email,
          name: cred.user.displayName || (selectedAccount && selectedAccount.name) || '구글 셰프',
          avatar: cred.user.photoURL || 'frontend/assets/images/icon.png',
          provider: 'google'
        };
      } catch (err) {
        console.warn("⚠️ [Firebase] Google popup error or cancelled:", err);
        if (err.code === 'auth/popup-closed-by-user') {
          throw err;
        }
      }
    }
    // 하이브리드/모의 구글 계정 선택 로그인
    const email = selectedAccount?.email || 'yujinham12@gmail.com';
    const name = selectedAccount?.name || 'YUJIN H';
    let avatar = selectedAccount?.avatar;
    if (!avatar) {
      if (email.includes('songpa')) {
        avatar = 'frontend/assets/images/songpa22_avatar.png';
      } else {
        avatar = 'frontend/assets/images/yujin_avatar.png';
      }
    }
    const uid = 'google_' + (email.split('@')[0] || Date.now());
    const user = {
      uid,
      email,
      name,
      avatar,
      provider: 'google',
      level: '조리 마스터 Lv.2'
    };
    localStorage.setItem('firebase_mock_user_' + email, JSON.stringify(user));
    return user;
  }

  // 4. 로그아웃
  async signOut() {
    if (!this.useMock && this.auth) {
      try {
        await this.auth.signOut();
      } catch (err) {
        console.warn("⚠️ [Firebase] SignOut warning:", err);
      }
    }
    return true;
  }

  // 3. 냉장고 재료 DB 저장 (Firestore 'fridges/{uid}')
  async syncFridgeToCloud(uid, ingredients) {
    if (!this.useMock && this.firestore) {
      await this.firestore.collection('fridges').doc(uid).set({
        ingredients,
        updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      return true;
    }
    localStorage.setItem('firebase_cloud_fridge_' + uid, JSON.stringify(ingredients));
    return true;
  }

  // 4. 냉장고 재료 DB 불러오기
  async fetchFridgeFromCloud(uid) {
    if (!this.useMock && this.firestore) {
      const doc = await this.firestore.collection('fridges').doc(uid).get();
      if (doc.exists) {
        return doc.data().ingredients || [];
      }
    }
    const raw = localStorage.getItem('firebase_cloud_fridge_' + uid);
    return raw ? JSON.parse(raw) : null;
  }
}

export const firebaseAdapter = new FirebaseAdapter();
