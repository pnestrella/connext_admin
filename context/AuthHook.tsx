"use client";

import { useContext } from "react";
import { AuthContext } from "./AuthContext";
import { AuthTypes } from "./AuthTypes"; 

export const useAuth = (): AuthTypes => {
    const context = useContext(AuthContext)

    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }

    return context;
}