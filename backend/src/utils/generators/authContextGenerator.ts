// src/utils/generators/authContextGenerator.ts

import fs from "fs";
import path from "path";

const getBaseDir = () => path.resolve(process.cwd(), "..", "frontend");

export function generateAuthContextSetup(): void {
  const contextDir = path.join(getBaseDir(), "src", "context");
  const typesDir = path.join(getBaseDir(), "src", "types");

  if (!fs.existsSync(contextDir)) {
    fs.mkdirSync(contextDir, { recursive: true });
  }
  if (!fs.existsSync(typesDir)) {
    fs.mkdirSync(typesDir, { recursive: true });
  }

  // ✅ Generate User type in src/types/User.ts
  const userTypeContent = `export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}
`;
  fs.writeFileSync(path.join(typesDir, "User.ts"), userTypeContent, "utf8");
  console.log("✅ Generated types/User.ts");

  // ✅ Auth Context using imported User type
  const authContextContent = `import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User } from '@/types/User';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  checkAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const userData = localStorage.getItem('userData');
      
      if (token && userData) {
        const parsedUser: User = JSON.parse(userData);
        setUser(parsedUser);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    
    try {
      const response = await new Promise<{ success: boolean; user?: User; token?: string; error?: string }>((resolve) => {
        setTimeout(() => {
          if (username === 'admin' && password === 'password') {
            resolve({
              success: true,
              user: {
                id: '1',
                username: 'admin',
                email: 'admin@example.com',
                role: 'administrator'
              },
              token: 'fake-jwt-token-' + Date.now()
            });
          } else {
            resolve({
              success: false,
              error: 'Invalid username or password'
            });
          }
        }, 1000);
      });

      if (response.success && response.user && response.token) {
        setUser(response.user);
        setIsAuthenticated(true);
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('userData', JSON.stringify(response.user));
        return { success: true };
      } else {
        return { success: false, error: response.error || 'Login failed' };
      }
    } catch (error) {
      return { success: false, error: 'Network error occurred' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      user, 
      isLoading, 
      login, 
      logout, 
      checkAuth 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
`;

  fs.writeFileSync(path.join(contextDir, "authContext.tsx"), authContextContent, "utf8");
  console.log("✅ Generated AuthContext (using types/User.ts)");
}
