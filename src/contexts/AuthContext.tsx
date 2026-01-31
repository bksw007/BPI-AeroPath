"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User as FirebaseUser } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { AuthService, AuthError } from "@/lib/firebase/services";
import { User } from "@/types/user";

// ------------------------------------------------------------------
// 🔧 Types
// ------------------------------------------------------------------

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  error: AuthError | null;
  // Auth Actions
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: AuthError }>;
  signUp: (email: string, password: string, displayName: string) => Promise<{ success: boolean; error?: AuthError }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: AuthError }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: AuthError }>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ------------------------------------------------------------------
// 🔥 Auth Provider
// ------------------------------------------------------------------

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribeAuth = AuthService.onAuthStateChange(async (fbUser) => {
      setFirebaseUser(fbUser);
      
      if (fbUser) {
        // Get additional user data from Firestore with real-time updates
        const userDocRef = doc(db, "users", fbUser.uid);
        
        const unsubscribeDoc = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data();
            setUser({
              uid: fbUser.uid,
              email: fbUser.email || "",
              displayName: userData.displayName || fbUser.displayName || "",
              role: userData.role || "staff",
              department: userData.department || "",
              photoURL: userData.photoURL || fbUser.photoURL || undefined,
              createdAt: userData.createdAt?.toDate() || new Date(),
              lastLogin: userData.lastLogin?.toDate() || new Date(),
              status: userData.status || "pending",
            });
          } else {
            // User doc not yet created (edge case)
            setUser(null);
          }
          setLoading(false);
        });

        return () => unsubscribeDoc();
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // ✅ Sign In (Email/Password)
  const signIn = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    const result = await AuthService.signIn(email, password);
    
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return { success: false, error: result.error };
    }
    
    return { success: true };
  };

  // ✅ Sign Up (Email/Password)
  const signUp = async (email: string, password: string, displayName: string) => {
    setLoading(true);
    setError(null);
    
    const result = await AuthService.signUp(email, password, displayName);
    
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return { success: false, error: result.error };
    }
    
    return { success: true };
  };

  // ✅ Sign In with Google
  const signInWithGoogle = async () => {
    setLoading(true);
    setError(null);
    
    const result = await AuthService.signInWithGoogle();
    
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return { success: false, error: result.error };
    }
    
    return { success: true };
  };

  // ✅ Sign Out
  const signOut = async () => {
    setError(null);
    const result = await AuthService.signOut();
    
    if (result.error) {
      setError(result.error);
    }
  };

  // ✅ Reset Password
  const resetPassword = async (email: string) => {
    setError(null);
    
    const result = await AuthService.resetPassword(email);
    
    if (result.error) {
      setError(result.error);
      return { success: false, error: result.error };
    }
    
    return { success: true };
  };

  // ✅ Clear Error
  const clearError = () => setError(null);

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        firebaseUser,
        loading, 
        error,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        resetPassword,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ------------------------------------------------------------------
// 🪝 useAuth Hook
// ------------------------------------------------------------------

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
