import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import api from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const initializeAuth = async () => {
      const token = localStorage.getItem("fintrack_token");

      if (!token) {
        if (active) setLoading(false);
        return;
      }

      try {
        const response = await api.get("/auth/me");

        if (active) {
          setUser(response.data);
        }
      } catch {
        localStorage.removeItem("fintrack_token");

        if (active) {
          setUser(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      active = false;
    };
  }, []);

  const login = async (email, password) => {
    const response = await api.post("/auth/login", {
      email: email.trim(),
      password,
    });

    const token = response.data.access_token;

    if (!token) {
      throw new Error("Authentication token was not returned.");
    }

    localStorage.setItem("fintrack_token", token);

    try {
      const userResponse = await api.get("/auth/me");
      setUser(userResponse.data);
      return userResponse.data;
    } catch (error) {
      localStorage.removeItem("fintrack_token");
      setUser(null);
      throw error;
    }
  };

  const register = async (fullName, email, password) => {
    const cleanName = fullName.trim();

    if (cleanName.length < 2 || cleanName.length > 100) {
      throw new Error("Name must contain between 2 and 100 characters.");
    }

    if (password.length < 8 || password.length > 128) {
      throw new Error("Password must contain between 8 and 128 characters.");
    }

    const response = await api.post("/auth/register", {
      full_name: cleanName,
      email: email.trim(),
      password,
    });

    return response.data;
  };

  const logout = () => {
    localStorage.removeItem("fintrack_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: Boolean(user),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}