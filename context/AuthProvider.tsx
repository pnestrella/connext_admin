"use client";

import { AuthContext } from "./AuthContext";
import React, { ReactNode, useEffect, useMemo, useState } from "react";
import { AuthTypes } from "./AuthTypes";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/config";
import { getAdmin } from "../api/admin";
import { userSignOut } from "../firebase/firebaseAuth";
import { useRouter } from "next/navigation";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthTypes | undefined>(undefined);
  const [userMDB, setUserMDB] = useState<AuthTypes | undefined>(undefined)
  const [loading, setLoading] = useState<boolean>(false)

  const router = useRouter()

  useEffect(() => {

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser as unknown as AuthTypes);
        getAdmin(firebaseUser.uid)
          .then((res) => setUserMDB(res.payload))
          .catch((err) => console.log(err))

      } else {
        setUser(undefined);
        setUserMDB(undefined);
        setLoading(false);
        router.push("/"); 
      }
    });
    return unsubscribe;
  }, []);


  const clearAuthState = () => {
    setUser(undefined);
    setUserMDB(undefined);
    setLoading(false);
  };

  const logout = async () => {
    try {
      await userSignOut();
      clearAuthState();
    } catch (err) {
      console.error("Error signing out:", err);
    }
  };


  const value = useMemo(
    () => ({ user, setUser, userMDB, setUserMDB, loading, setLoading, logout }),
    [user, userMDB, loading]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
