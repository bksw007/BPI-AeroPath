import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  updateProfile, 
  onAuthStateChanged, 
  User,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';

// Custom Error Type
export interface AuthError {
  code: string;
  message: string;
}

export const AuthService = {
  
  // ✅ 1. Sign In (Email/Password)
  signIn: async (email: string, pass: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, pass);
      return { user: result.user, error: null };
    } catch (error: any) {
      return { user: null, error: mapAuthError(error) };
    }
  },

  // ✅ 2. Sign Up (Email/Password) -> Auto create Firestore Doc
  signUp: async (email: string, pass: string, name: string) => {
    try {
      // 1. Create Auth User
      const result = await createUserWithEmailAndPassword(auth, email, pass);
      
      // 2. Update Display Name
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: name });
      }

      // 3. Create User Document in Firestore
      await createUserDocument(result.user, name);

      return { user: result.user, error: null };
    } catch (error: any) {
      return { user: null, error: mapAuthError(error) };
    }
  },

  // ✅ 3. Sign In with Google (New Feature)
  signInWithGoogle: async () => {
    try {
      const provider = new GoogleAuthProvider();
      // Force account selection prompt (optional)
      provider.setCustomParameters({ prompt: 'select_account' });
      
      const result = await signInWithPopup(auth, provider);
      
      // 4. Check & Create Firestore Doc if not exists
      // สำคัญ: ต้องเช็คทุกครั้งเพราะ Google Login ข้ามขั้นตอน Register ปกติ
      await checkAndCreateUserDoc(result.user);

      return { user: result.user, error: null };
    } catch (error: any) {
      return { user: null, error: mapAuthError(error) };
    }
  },

  // ✅ 4. Sign Out
  signOut: async () => {
    try {
      await firebaseSignOut(auth);
      return { error: null };
    } catch (error: any) {
      return { error: mapAuthError(error) };
    }
  },

  // ✅ 5. Reset Password
  resetPassword: async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true, error: null };
    } catch (error: any) {
      return { success: false, error: mapAuthError(error) };
    }
  },

  // ✅ 6. Get Current User (Synchronous check from memory)
  getCurrentUser: () => {
    return auth.currentUser;
  },

  // ✅ 7. Auth State Listener (For React Context/Hooks)
  onAuthStateChange: (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, callback);
  }
};

// ------------------------------------------------------------------
// 🔧 Private Helpers (ฟังก์ชันช่วยทำงานเบื้องหลัง)
// ------------------------------------------------------------------

// สร้างข้อมูล User ลง Firestore (สำหรับ Email Signup)
async function createUserDocument(user: User, displayName?: string) {
  const userRef = doc(db, 'users', user.uid);
  
  await setDoc(userRef, {
    uid: user.uid,
    email: user.email,
    displayName: displayName || user.displayName || 'No Name',
    role: 'staff', // Default role
    department: 'Unassigned', // รอ Admin มาแก้
    photoURL: user.photoURL || null,
    createdAt: serverTimestamp(),
    lastLogin: serverTimestamp(),
    status: 'active'
  });
}

// ตรวจสอบและสร้าง User Doc ถ้ายังไม่มี (สำหรับ Google Login)
async function checkAndCreateUserDoc(user: User) {
  const userRef = doc(db, 'users', user.uid);
  const docSnap = await getDoc(userRef);

  if (!docSnap.exists()) {
    // ถ้าเป็น user ใหม่ที่เพิ่ง login ผ่าน Google ครั้งแรก
    await createUserDocument(user);
  } else {
    // ถ้ามีอยู่แล้ว ให้อัพเดทเวลา login ล่าสุด
    await setDoc(userRef, { 
      lastLogin: serverTimestamp() 
    }, { merge: true });
  }
}

// แปลง Error Code เป็นภาษาอังกฤษ (English)
function mapAuthError(error: any): AuthError {
  console.error("Auth Error:", error.code, error.message);
  
  let message = "An unexpected error occurred. Please try again.";
  
  switch (error.code) {
    case 'auth/invalid-email':
      message = "Invalid email format.";
      break;
    case 'auth/user-not-found':
      message = "User not found.";
      break;
    case 'auth/wrong-password':
      message = "Incorrect password.";
      break;
    case 'auth/email-already-in-use':
      message = "Email is already in use.";
      break;
    case 'auth/weak-password':
      message = "Password must be at least 6 characters.";
      break;
    case 'auth/popup-closed-by-user':
      message = "Sign-in was cancelled by user.";
      break;
    case 'auth/too-many-requests':
      message = "Too many failed login attempts. Please try again later.";
      break;
    case 'auth/network-request-failed':
      message = "Network error. Please check your connection.";
      break;
  }
  
  return { code: error.code, message };
}
