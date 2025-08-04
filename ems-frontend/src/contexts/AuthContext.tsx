import React, { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import type { User as FirebaseUser } from "firebase/auth";
import { auth, googleProvider } from "../config/firebase";
import type { User, UserClaims, AuthContextType } from "../types";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userClaims, setUserClaims] = useState<UserClaims | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser) {
          const tokenResult = await firebaseUser.getIdTokenResult();

          const userData: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
          };

          const permissions = typeof tokenResult.claims.permissions === "object" && tokenResult.claims.permissions !== null
            ? tokenResult.claims.permissions as Record<string, any>
            : {};

          const claims: UserClaims = {
            role: (tokenResult.claims.role as "admin" | "patient") || "patient",
            permissions: {
              read: permissions.read ?? true,
              write: permissions.write ?? false,
              ai_query: permissions.ai_query ?? true,
              user_management: permissions.user_management ?? false,
            },
          };

          setUser(userData);
          setUserClaims(claims);
        } else {
          setUser(null);
          setUserClaims(null);
        }
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const signInWithGoogle = async (): Promise<User> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const userData: User = {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
      };
      return userData;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  const getAuthToken = async (): Promise<string | null> => {
    if (auth.currentUser) {
      return await auth.currentUser.getIdToken();
    }
    return null;
  };

  const isAdmin = (): boolean => {
    return userClaims?.role === "admin";
  };

  const canWrite = (): boolean => {
    return userClaims?.permissions?.write === true;
  };

  const value: AuthContextType = {
    user,
    userClaims,
    loading,
    signInWithGoogle,
    logout,
    getAuthToken,
    isAdmin,
    canWrite,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
