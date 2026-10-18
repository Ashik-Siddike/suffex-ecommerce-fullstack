import { createContext, useContext, useState, useEffect, useCallback } from "react";
import axiosClient from "../api/axiosClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("userInfo");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    try {
      const savedToken = localStorage.getItem("token");
      if (!savedToken) return null;
      return savedToken.startsWith('"') && savedToken.endsWith('"')
        ? JSON.parse(savedToken)
        : savedToken;
    } catch (e) {
      return null;
    }
  });

  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Background verification of token with /api/auth/me
  const refreshUser = useCallback(async () => {
    const storedToken = localStorage.getItem("token");
    if (!storedToken) {
      setLoading(false);
      return { success: false };
    }

    try {
      const response = await axiosClient.get("/auth/me");
      if (response.data?.user) {
        setUser(response.data.user);
        localStorage.setItem("userInfo", JSON.stringify(response.data.user));
        return { success: true, user: response.data.user };
      }
      return { success: false };
    } catch (err) {
      console.warn("Session verification expired or invalid:", err?.message);
      setUser(null);
      setToken(null);
      localStorage.removeItem("token");
      localStorage.removeItem("userInfo");
      return { success: false, error: err?.message };
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    if (isMounted) {
      refreshUser();
    }
    return () => {
      isMounted = false;
    };
  }, [refreshUser]);

  // Register new customer
  const register = useCallback(async ({ name, email, phone, password }) => {
    setAuthError(null);
    try {
      const response = await axiosClient.post("/auth/register", {
        name,
        email,
        phone,
        password,
      });

      const { token: newToken, user: newUser } = response.data;

      localStorage.setItem("token", newToken);
      localStorage.setItem("userInfo", JSON.stringify(newUser));

      setToken(newToken);
      setUser(newUser);

      return { success: true, user: newUser };
    } catch (err) {
      const msg = err.message || "Registration failed. Please try again.";
      setAuthError(msg);
      return { success: false, error: msg };
    }
  }, []);

  // Login existing user (customer or admin)
  const login = useCallback(async (email, password) => {
    setAuthError(null);
    try {
      const response = await axiosClient.post("/auth/login", {
        email,
        password,
      });

      const { token: newToken, user: loggedUser } = response.data;

      localStorage.setItem("token", newToken);
      localStorage.setItem("userInfo", JSON.stringify(loggedUser));

      setToken(newToken);
      setUser(loggedUser);

      return { success: true, user: loggedUser };
    } catch (err) {
      const msg = err.message || "Invalid email or password.";
      setAuthError(msg);
      return { success: false, error: msg };
    }
  }, []);

  // Logout customer/admin
  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("userInfo");
    setUser(null);
    setToken(null);
    setAuthError(null);
  }, []);

  const value = {
    user,
    token,
    isAuthenticated: Boolean(token && user),
    loading,
    authError,
    setAuthError,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthContext;
