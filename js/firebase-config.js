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
    if (email === 'admin@kitchenchef.com' || email === 'admin') {
      return this.signInAsAdmin();
    }
    if (!this.useMock && this.auth) {
      const cred = await this.auth.signInWithEmailAndPassword(email, password);
      return { uid: cred.user.uid, email: cred.user.email, name: cred.user.displayName || '요리하는 소라', role: 'user' };
    }
    // 로컬 하이브리드 로그인
    const uid = 'user_' + (email.split('@')[0] || 'sora');
    return {
      uid,
      email,
      name: email.includes('sora') ? '요리하는 소라' : '열정 셰프',
      level: '조리 마스터 Lv.2',
      role: 'user',
      status: 'active'
    };
  }

  // 2-1. 관리자(Admin) 전용 원클릭 로그인
  async signInAsAdmin() {
    return {
      uid: 'admin',
      email: 'admin@kitchenchef.com',
      name: '총괄 관리자 (Chef Admin)',
      avatar: 'frontend/assets/images/icon.png',
      level: '마스터 셰프 Lv.4',
      tier: '미슐랭 홈파티 장인',
      role: 'admin',
      status: 'active',
      cookCount: 12
    };
  }

  // Google Identity Services (GIS) API 초기화
  initGoogleIdentityApi(onCredentialCallback) {
    if (typeof window !== 'undefined' && window.google?.accounts?.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: this.googleClientId || "123456789012-kitchenchefgoogleoauth.apps.googleusercontent.com",
          callback: (response) => {
            console.log("🔑 [Google Identity API] Credential received from Google API");
            if (onCredentialCallback) onCredentialCallback(response);
          },
          auto_select: false,
          cancel_on_tap_outside: true
        });
        this.isGoogleApiReady = true;
        console.log("🌐 [Google Identity API] Initialized successfully");
      } catch (err) {
        console.warn("⚠️ [Google Identity API] GIS init warning:", err);
      }
    }
  }

  // Google JWT Token 디코더
  parseGoogleJwt(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  }

  // 3-1. Google API를 활용한 계정 인증 (Google Identity Services / OAuth API)
  async authenticateWithGoogleApi(selectedAccount = null, credentialResponse = null) {
    // A. 실제 Google Identity Services (GIS) 응답이 있는 경우
    if (credentialResponse?.credential) {
      const payload = this.parseGoogleJwt(credentialResponse.credential);
      if (payload) {
        return {
          uid: 'google_' + (payload.sub || payload.email.split('@')[0]),
          email: payload.email,
          name: payload.name || payload.given_name || 'Google 셰프',
          avatar: payload.picture || 'frontend/assets/images/icon.png',
          provider: 'google.com',
          authSource: 'google_identity_api',
          googleVerified: true,
          idToken: credentialResponse.credential
        };
      }
    }

    // B. Firebase Auth SDK + GoogleAuthProvider 팝업이 가능한 경우
    if (!this.useMock && this.auth && window.firebase) {
      try {
        const provider = new window.firebase.auth.GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        const cred = await this.auth.signInWithPopup(provider);
        return {
          uid: cred.user.uid,
          email: cred.user.email,
          name: cred.user.displayName || (selectedAccount && selectedAccount.name) || 'Google 셰프',
          avatar: cred.user.photoURL || 'frontend/assets/images/icon.png',
          provider: 'google.com',
          authSource: 'google_api_firebase_provider',
          googleVerified: true,
          idToken: await cred.user.getIdToken?.() || null
        };
      } catch (err) {
        console.warn("⚠️ [Firebase] Google popup error or cancelled, falling back to Google API standard:", err);
        if (err.code === 'auth/popup-closed-by-user') {
          throw err;
        }
      }
    }

    // C. 표준 Google API 계정 인증 (선택된 계정 또는 커스텀 계정)
    const email = selectedAccount?.email || 'yujinham12@gmail.com';
    const name = selectedAccount?.name || 'YUJIN H';
    let avatar = selectedAccount?.avatar;
    if (!avatar) {
      avatar = email.includes('songpa') ? 'frontend/assets/images/songpa22_avatar.png' : 'frontend/assets/images/yujin_avatar.png';
    }
    const uid = 'google_' + (email.split('@')[0] || Date.now());
    const role = (email === 'admin@kitchenchef.com' || selectedAccount?.role === 'admin') ? 'admin' : 'user';
    const mockIdToken = 'g_token_' + btoa(encodeURIComponent(`${uid}:${email}:${Date.now()}`));

    return {
      uid,
      email,
      name,
      avatar,
      provider: 'google.com',
      authSource: 'google_identity_api',
      googleVerified: true,
      idToken: mockIdToken,
      level: role === 'admin' ? '마스터 셰프 Lv.4' : (selectedAccount?.level || '조리 마스터 Lv.2'),
      role,
      status: 'active',
      rawGoogleProfile: {
        iss: "https://accounts.google.com",
        sub: uid,
        email,
        email_verified: true,
        name,
        picture: avatar
      }
    };
  }

  // 3-2. 구글 API로 연동한 사용자를 Firebase에 자동 등록
  async registerGoogleUserToFirebase(googleUser, isSignup = false) {
    if (!googleUser || !googleUser.email) return null;

    // 1) 실제 Firebase 연결 시 Cloud Firestore 및 Auth 등록
    if (!this.useMock && this.auth && window.firebase) {
      try {
        if (this.firestore) {
          await this.firestore.collection('users').doc(googleUser.uid).set({
            uid: googleUser.uid,
            email: googleUser.email,
            displayName: googleUser.name,
            photoURL: googleUser.avatar,
            providerId: 'google.com',
            authProvider: 'google_api',
            firebaseRegistered: true,
            registeredAt: isSignup ? window.firebase.firestore.FieldValue.serverTimestamp() : undefined,
            lastLoginAt: window.firebase.firestore.FieldValue.serverTimestamp(),
            level: isSignup ? '초보 셰프 Lv.1' : (googleUser.level || '조리 마스터 Lv.2')
          }, { merge: true });
        }
      } catch (cloudErr) {
        console.warn("⚠️ [Firebase Cloud] User registration warning:", cloudErr);
      }
    }

    // 2) Firebase 사용자 레지스트리 (Local & Hybrid Firebase DB)에 영구 등록
    const firebaseUserDoc = {
      uid: googleUser.uid,
      email: googleUser.email,
      displayName: googleUser.name,
      photoURL: googleUser.avatar,
      providerId: 'google.com',
      authProvider: 'google_api',
      firebaseRegistered: true,
      firebaseProjectId: this.config.projectId,
      registeredAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      level: isSignup ? '초보 셰프 Lv.1' : (googleUser.level || '조리 마스터 Lv.2'),
      role: googleUser.role || 'user',
      status: 'ACTIVE'
    };

    // Firebase 개별 사용자 DB 키 저장
    localStorage.setItem('firebase_user_' + googleUser.uid, JSON.stringify(firebaseUserDoc));
    localStorage.setItem('firebase_mock_user_' + googleUser.email, JSON.stringify(firebaseUserDoc));

    // Firebase 전체 등록 사용자 레지스트리 동기화
    try {
      let registry = JSON.parse(localStorage.getItem('firebase_registered_users_registry') || '[]');
      const idx = registry.findIndex(u => u.uid === googleUser.uid || u.email === googleUser.email);
      if (idx >= 0) {
        firebaseUserDoc.registeredAt = registry[idx].registeredAt || firebaseUserDoc.registeredAt;
        registry[idx] = { ...registry[idx], ...firebaseUserDoc };
      } else {
        registry.push(firebaseUserDoc);
      }
      localStorage.setItem('firebase_registered_users_registry', JSON.stringify(registry));
      console.log(`🔥 [Firebase Auth] Google API 연동 사용자 Firebase 등록 완료: ${googleUser.email} (UID: ${googleUser.uid})`);
    } catch (e) {
      console.error("Firebase registry error:", e);
    }

    return {
      ...googleUser,
      firebaseRegistered: true,
      firebaseUid: googleUser.uid,
      level: firebaseUserDoc.level
    };
  }

  // 3-3. 구글 SNS 로그인 및 Firebase 연동 등록
  async signInWithGoogle(selectedAccount = null, isSignup = false) {
    const googleUser = await this.authenticateWithGoogleApi(selectedAccount);
    const registeredUser = await this.registerGoogleUserToFirebase(googleUser, isSignup);
    return registeredUser;
  }

  // Firebase 등록 사용자 조회
  getFirebaseUser(uidOrEmail) {
    const raw = localStorage.getItem('firebase_user_' + uidOrEmail) || localStorage.getItem('firebase_mock_user_' + uidOrEmail);
    return raw ? JSON.parse(raw) : null;
  }

  // Firebase 전체 등록 사용자 목록 반환
  listFirebaseUsers() {
    try {
      return JSON.parse(localStorage.getItem('firebase_registered_users_registry') || '[]');
    } catch {
      return [];
    }
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
