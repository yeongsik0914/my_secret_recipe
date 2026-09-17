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
    this.initDefaultSeeds();
  }

  // 0. 초기 필수 계정(Seed) 자동 등록 (관리자 및 기본 유저)
  initDefaultSeeds() {
    const seedUsers = [
      {
        id: 'admin',
        uid: 'admin',
        name: '총괄 관리자 (Chef Admin)',
        email: 'admin@kitchenchef.com',
        password: 'admin1234!',
        role: 'admin',
        status: 'active',
        level: '마스터 셰프 Lv.4',
        tier: '미슐랭 홈파티 장인',
        avatar: 'frontend/assets/images/icon.png',
        cookCount: 12,
        createdAt: '2026-09-01 10:00',
        sessionValid: true
      },
      {
        id: 'user_default',
        uid: 'user_default',
        name: '송파 미식가 (기본 유저)',
        email: 'user@kitchenchef.com',
        password: 'user1234!',
        role: 'user',
        status: 'active',
        level: '시니어 셰프 Lv.3',
        tier: '냉파 마스터',
        avatar: 'frontend/assets/images/songpa22_avatar.png',
        cookCount: 4,
        createdAt: '2026-09-10 12:00',
        sessionValid: true
      },
      {
        id: 'user_songpa22',
        uid: 'user_songpa22',
        name: '22 songpa',
        email: 'songpa22@gmail.com',
        password: 'google_oauth',
        role: 'user',
        status: 'active',
        level: '시니어 셰프 Lv.3',
        tier: '냉파 마스터',
        avatar: 'frontend/assets/images/songpa22_avatar.png',
        cookCount: 5,
        createdAt: '2026-09-10 14:20',
        sessionValid: true
      },
      {
        id: 'user_yujin',
        uid: 'user_yujin',
        name: 'YUJIN H',
        email: 'yujinham12@gmail.com',
        password: 'google_oauth',
        role: 'user',
        status: 'active',
        level: '주니어 셰프 Lv.2',
        tier: '신선 재고 구출자',
        avatar: 'frontend/assets/images/yujin_avatar.png',
        cookCount: 2,
        createdAt: '2026-09-12 09:15',
        sessionValid: true
      },
      {
        id: 'user_sora',
        uid: 'user_sora',
        name: '요리하는 소라',
        email: 'sora@kitchenchef.com',
        password: 'sora1234!',
        role: 'user',
        status: 'active',
        level: '주니어 셰프 Lv.2',
        tier: '신선 재고 구출자',
        avatar: 'frontend/assets/images/icon.png',
        cookCount: 1,
        createdAt: '2026-09-15 16:40',
        sessionValid: false
      }
    ];

    try {
      let currentAdminUsers = JSON.parse(localStorage.getItem('kitchen_chef_admin_users') || '[]');
      let updated = false;
      seedUsers.forEach(seed => {
        const found = currentAdminUsers.find(u => (u.email && u.email.toLowerCase() === seed.email.toLowerCase()) || u.id === seed.id);
        if (!found) {
          currentAdminUsers.push(seed);
          updated = true;
        } else {
          if (!found.password) {
            found.password = seed.password;
            updated = true;
          }
        }
        if (!localStorage.getItem('firebase_user_' + seed.uid)) {
          localStorage.setItem('firebase_user_' + seed.uid, JSON.stringify(seed));
        }
      });
      if (updated || currentAdminUsers.length === 0) {
        localStorage.setItem('kitchen_chef_admin_users', JSON.stringify(currentAdminUsers));
      }

      let registry = JSON.parse(localStorage.getItem('firebase_registered_users_registry') || '[]');
      seedUsers.forEach(seed => {
        if (!registry.some(r => r.uid === seed.uid || (r.email && r.email.toLowerCase() === seed.email.toLowerCase()))) {
          registry.push(seed);
        }
      });
      localStorage.setItem('firebase_registered_users_registry', JSON.stringify(registry));
    } catch (e) {
      console.warn("initDefaultSeeds error:", e);
    }
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

  // 1. 회원가입 (Firebase Auth & Firestore users/{uid} 도큐먼트 생성)
  async signUp(email, password, displayName = '신규 셰프') {
    if (!email) {
      throw new Error("이메일 주소를 입력해주세요.");
    }
    const cleanEmail = email.trim().toLowerCase();

    // 중복 가입 검증
    const localUsers = JSON.parse(localStorage.getItem('kitchen_chef_admin_users') || '[]');
    const exists = localUsers.find(u => u.email && u.email.trim().toLowerCase() === cleanEmail);
    if (exists) {
      throw new Error("이미 등록된 이메일 주소입니다. 로그인을 진행해주세요.");
    }

    let uid;
    if (!this.useMock && this.auth) {
      const cred = await this.auth.createUserWithEmailAndPassword(cleanEmail, password);
      await cred.user.updateProfile({ displayName });
      uid = cred.user.uid;
    } else {
      uid = 'user_' + Date.now();
    }
    const user = {
      uid,
      id: uid,
      email: cleanEmail,
      password: password || 'kitchen1234',
      name: displayName,
      role: cleanEmail === 'admin@kitchenchef.com' ? 'admin' : 'user',
      status: 'active',
      level: '초보 셰프 Lv.1',
      tier: '주방의 호기심쟁이',
      avatar: 'frontend/assets/images/icon.png',
      cookCount: 0,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      lastLogin: new Date().toISOString().replace('T', ' ').substring(0, 16),
      sessionValid: true
    };
    await this.createUserDocument(user);

    try {
      let registry = JSON.parse(localStorage.getItem('firebase_registered_users_registry') || '[]');
      registry.push(user);
      localStorage.setItem('firebase_registered_users_registry', JSON.stringify(registry));
    } catch {}

    fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    }).catch(() => {});

    return user;
  }

  // 2. 로그인 (회원 DB 등록 검증 & 미등록 계정 차단)
  async signIn(email, password) {
    if (!email) {
      throw new Error("이메일 주소를 입력해주세요.");
    }
    const cleanEmail = email.trim().toLowerCase();

    // 1) 백엔드 REST API(/api/auth/login) 검증 우선 시도
    try {
      const resp = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password })
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.status === 'success' && data.user) {
          await this.createUserDocument(data.user);
          return data.user;
        }
      } else {
        const errData = await resp.json().catch(() => ({}));
        if (errData.message) {
          throw new Error(errData.message);
        }
      }
    } catch (fetchErr) {
      if (fetchErr.message && (fetchErr.message.includes('등록되지 않은 회원') || fetchErr.message.includes('비밀번호') || fetchErr.message.includes('활동이 정지'))) {
        throw fetchErr;
      }
    }

    // 2) 로컬 회원 DB 및 레지스트리 대조 검증 (오프라인/Fallback)
    const localUsers = JSON.parse(localStorage.getItem('kitchen_chef_admin_users') || '[]');
    const registryUsers = JSON.parse(localStorage.getItem('firebase_registered_users_registry') || '[]');
    const allUsers = [...localUsers, ...registryUsers];

    const matchedUser = allUsers.find(u => 
      (u.email && u.email.trim().toLowerCase() === cleanEmail) || 
      (u.id && u.id.trim().toLowerCase() === cleanEmail) ||
      (u.uid && u.uid.trim().toLowerCase() === cleanEmail)
    );

    if (!matchedUser) {
      throw new Error("등록되지 않은 회원입니다. 회원가입을 먼저 진행해주세요.");
    }

    if (matchedUser.status === 'suspended') {
      throw new Error("활동이 정지된 계정입니다. 관리자에게 문의하세요.");
    }

    // 비밀번호 검증 (등록된 비밀번호가 있는 경우)
    if (matchedUser.password && password) {
      if (matchedUser.password !== password) {
        throw new Error("비밀번호가 일치하지 않습니다. 다시 확인해주세요.");
      }
    }

    matchedUser.lastLogin = new Date().toISOString().replace('T', ' ').substring(0, 16);
    matchedUser.sessionValid = true;
    await this.createUserDocument(matchedUser);
    return matchedUser;
  }

  // 2-1. 관리자(Admin) 전용 원클릭 로그인 (시드 관리자 검증)
  async signInAsAdmin() {
    return this.signIn('admin@kitchenchef.com', 'admin1234!');
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

    if (!this.useMock && this.auth && window.firebase) {
      try {
        const provider = new window.firebase.auth.GoogleAuthProvider();
        provider.setCustomParameters({
          prompt: 'select_account' // 구글 계정 선택 강제
        });
        const cred = await this.auth.signInWithPopup(provider);
        uid = cred.user.uid;
        email = cred.user.email || email;
        name = cred.user.displayName || name;
        avatar = cred.user.photoURL || avatar;
      } catch (err) {
        console.warn("⚠️ [Firebase] Google popup error or cancelled:", err);
        if (err.code === 'auth/popup-closed-by-user') {
          throw err;
        }
      }
    }

    if (!uid) {
      uid = 'google_' + (email.split('@')[0] || Date.now());
    }

    const role = (email === 'admin@kitchenchef.com' || selectedAccount?.role === 'admin') ? 'admin' : 'user';
    const mockIdToken = 'g_token_' + btoa(encodeURIComponent(`${uid}:${email}:${Date.now()}`));

    return {
      uid,
      id: uid,
      email,
      name,
      avatar,
      provider: 'google.com',
      authSource: 'google_identity_api',
      googleVerified: true,
      idToken: mockIdToken,
      level: role === 'admin' ? '마스터 셰프 Lv.4' : (selectedAccount?.level || '조리 마스터 Lv.2'),
      tier: role === 'admin' ? '미슐랭 홈파티 장인' : '신선 재고 구출자',
      role,
      status: 'active',
      cookCount: selectedAccount?.cookCount || (role === 'admin' ? 12 : 2),
      createdAt: selectedAccount?.createdAt || new Date().toISOString().replace('T', ' ').substring(0, 16),
      sessionValid: true,
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

  // 3-1. Firestore 'users/{uid}' 도큐먼트 생성 및 영속화
  async createUserDocument(userData) {
    const uid = userData.uid || userData.id;
    if (!uid) return userData;
    const docData = {
      id: uid,
      uid,
      name: userData.name || '신규 셰프',
      email: userData.email || '',
      avatar: userData.avatar || 'frontend/assets/images/icon.png',
      level: userData.level || '초보 셰프 Lv.1',
      tier: userData.tier || '주방의 호기심쟁이',
      role: userData.role || (userData.email === 'admin@kitchenchef.com' ? 'admin' : 'user'),
      status: userData.status || 'active',
      cookCount: userData.cookCount || 0,
      createdAt: userData.createdAt || new Date().toISOString().replace('T', ' ').substring(0, 16),
      lastLogin: new Date().toISOString().replace('T', ' ').substring(0, 16),
      sessionValid: true
    };

    if (!this.useMock && this.firestore && window.firebase) {
      try {
        await this.firestore.collection('users').doc(uid).set(docData, { merge: true });
        console.log("🔥 [Firebase] Firestore user document created:", uid);
      } catch (err) {
        console.warn("⚠️ [Firebase] Firestore set user failed, fallback to local:", err);
      }
    }
    // 하이브리드 로컬 DB 영속화
    localStorage.setItem('firebase_cloud_user_' + uid, JSON.stringify(docData));
    localStorage.setItem('firebase_mock_user_' + (userData.email || uid), JSON.stringify(docData));
    return docData;
  }

  // 3-2. Firestore 전체 회원 도큐먼트 목록 조회 (관리자용)
  async fetchAllUsersFromCloud() {
    const cloudUsers = [];
    if (!this.useMock && this.firestore && window.firebase) {
      try {
        const snapshot = await this.firestore.collection('users').get();
        snapshot.forEach(doc => {
          cloudUsers.push(doc.data());
        });
        if (cloudUsers.length > 0) return cloudUsers;
      } catch (err) {
        console.warn("⚠️ [Firebase] Error fetching users from Firestore:", err);
      }
    }
    // 로컬 스토리지에 저장된 모든 firebase_cloud_user_* 스캔
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('firebase_cloud_user_')) {
        try {
          const user = JSON.parse(localStorage.getItem(key));
          if (user && (user.id || user.uid)) cloudUsers.push(user);
        } catch {}
      }
    }
    return cloudUsers;
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
