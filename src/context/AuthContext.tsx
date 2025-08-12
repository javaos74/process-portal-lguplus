import React, { useState, createContext, useContext, useEffect } from 'react';
import { useUiPath } from './UiPathContext';

// JWT decoding utility
const decodeJWT = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

// Generate initials from name
const generateInitials = (firstName?: string, lastName?: string) => {
  if (firstName && lastName) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }
  if (firstName) {
    return firstName.charAt(0).toUpperCase();
  }
  return 'DU'; // Default User
};
type UserRole = 'business_user' | 'process_owner' | 'viewer';
interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
  initials: string;
}
interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}
const rolePermissions = {
  business_user: ['read', 'act_on_hitl'],
  process_owner: ['read', 'write', 'act_on_hitl', 'manage_processes'],
  viewer: ['read']
};
const AuthContext = createContext<AuthContextType | undefined>(undefined);
export const AuthProvider: React.FC<{
  children: React.ReactNode;
}> = ({
  children
}) => {
  const [user, setUser] = useState<User | null>(null);
  const login = (userData: User) => {
    setUser(userData);
  };
  const logout = () => {
    setUser(null);
  };
  
  const { sdk } = useUiPath();

  // Initialize user from SDK token
  useEffect(() => {
    const initializeUser = () => {
      try {
        // Get the JWT token from environment variables with fallback (Vite uses import.meta.env)
        const tokenFromEnv = import.meta.env.VITE_UIPATH_SECRET || 'eyJhbGciOiJSUzI1NiIsImtpZCI6Ijg1Njk5RDIwNzA4RkE0RTU5REU3QkQ1RjYzNzhDOTM5MDJFQ0QwMDMiLCJ4NXQiOiJoV21kSUhDUHBPV2Q1NzFmWTNqSk9RTHMwQU0iLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3N0YWdpbmcudWlwYXRoLmNvbS9pZGVudGl0eV8iLCJuYmYiOjE3NTQ5OTQ4MzMsImlhdCI6MTc1NDk5NTEzMywiZXhwIjoxNzU0OTk4NzMzLCJhdWQiOlsiT3JjaGVzdHJhdG9yQXBpVXNlckFjY2VzcyIsIkNvbm5lY3Rpb25TZXJ2aWNlIiwiRGF0YVNlcnZpY2UiLCJEb2N1bWVudFVuZGVyc3RhbmRpbmciLCJFbnRlcnByaXNlQ29udGV4dFNlcnZpY2UiLCJJZGVudGl0eVNlcnZlckFwaSIsIkphbUphbUFwaSIsIkxMTUdhdGV3YXkiLCJMTE1PcHMiLCJPTVMiLCJSZXNvdXJjZUNhdGFsb2dTZXJ2aWNlQXBpIl0sInNjb3BlIjpbIk9yY2hlc3RyYXRvckFwaVVzZXJBY2Nlc3MiLCJDb25uZWN0aW9uU2VydmljZSIsIkRhdGFTZXJ2aWNlIiwiRG9jdW1lbnRVbmRlcnN0YW5kaW5nIiwiRW50ZXJwcmlzZUNvbnRleHRTZXJ2aWNlIiwiRGlyZWN0b3J5IiwiSmFtSmFtQXBpIiwiTExNR2F0ZXdheSIsIkxMTU9wcyIsIk9NUyIsIlJDUy5Gb2xkZXJBdXRob3JpemF0aW9uIiwib2ZmbGluZV9hY2Nlc3MiXSwiYW1yIjpbImV4dGVybmFsIl0sInN1Yl90eXBlIjoidXNlciIsImNsaWVudF9pZCI6IjM2ZGVhNWI4LWU4YmItNDIzZC04ZTdiLWM4MDhkZjhmMWMwMCIsInN1YiI6Ijc3ZWQ1NDk0LTA1MGUtNDYwZS04MjkwLWE1YTI5OWU4MjJiZCIsImF1dGhfdGltZSI6MTc1NDk5NTExNiwiaWRwIjoib2lkYyIsImVtYWlsIjoiY2hhcmxlcy5rQGtha2FvLmNvbSIsIkFzcE5ldC5JZGVudGl0eS5TZWN1cml0eVN0YW1wIjoiNVJLTlI3RVI0STdWQ1FYQzNIQ0UzU0dLWjNPU0NBRloiLCJhdXRoMF9jb24iOiJVc2VybmFtZS1QYXNzd29yZC1BdXRoZW50aWNhdGlvbiIsImNvdW50cnkiOiIiLCJleHRfc3ViIjoiYXV0aDB8NjdhZWE0NzIwNGE4OGY0M2MyMzdiZDhkIiwibWFya2V0aW5nQ29uZGl0aW9uQWNjZXB0ZWQiOiJUcnVlIiwicGljdHVyZSI6Imh0dHBzOi8vcy5ncmF2YXRhci5jb20vYXZhdGFyLzM5ZWM1MTczYjc5YWFhNDU0ZGViZTllY2Y2ZjRhZDc0P3M9NDgwXHUwMDI2cj1wZ1x1MDAyNmQ9aHR0cHMlM0ElMkYlMkZjZG4uYXV0aDAuY29tJTJGYXZhdGFycyUyRmNoLnBuZyIsInBydF9pZCI6IjE4MzM3ZjhlLTlkZWEtNGNkZC05NTk2LTNhZDQ0ODMwOGJjNSIsImhvc3QiOiJGYWxzZSIsImZpcnN0X25hbWUiOiJDaGFybGVzIiwibGFzdF9uYW1lIjoiS2ltIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInByZWZlcnJlZF91c2VybmFtZSI6ImNoYXJsZXMua0BrYWthby5jb20iLCJuYW1lIjoiY2hhcmxlcy5rQGtha2FvLmNvbSIsImV4dF9pZHBfaWQiOiIxIiwiZXh0X2lkcF9kaXNwX25hbWUiOiJHbG9iYWxJZHAiLCJzaWQiOiJDNDA5NEQwNzgxMDdBQkMwNDE0QjZENTc5RTdBQjQ3NiJ9.luyYFO9Vef1cxkktB5XonKV32Fth_HgRgED2C_plUFlXRuPvs61YX_mpHGYcYlzdPP_wQrhzUYjVpN9Xxcgf9398lRHYiGIfFGm7RERH3R_Ni2tMD_ZQNFqpkq8hXWkFjDyil1xWQ2GlMLrnO-YQFp1iY-zaJx-D-7U24014kwNpe9TbsC5NKk-CoDd5W3-vF2JYmnP9M5IsUpLYbIBGA_hyPOSr3YK-hvU5hdbkP3uYK9XHiOzoDGbogU2bOffkzDzLO0TArNph7Cphgq8jZSegCPhaJf__XwOuPtYP43qhqiuyaBiMmOBgkXhtaPXUd3mGzWQBXLHSgxdp6BA80w';

        console.log('Decoding JWT token for user info...');
        const decodedToken = decodeJWT(tokenFromEnv);
        console.log('Decoded token:', decodedToken);
        
        if (decodedToken) {
          // JWT 토큰에서 사용자 정보 추출
          const firstName = decodedToken.first_name || '';
          const lastName = decodedToken.last_name || '';
          const email = decodedToken.email || decodedToken.preferred_username || '';
          const fullName = decodedToken.name || `${firstName} ${lastName}`.trim() || email || 'Unknown User';
          
          // 이니셜 생성 - 한글 이름도 고려
          let initials = '';
          if (firstName && lastName) {
            initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
          } else if (fullName && fullName !== email) {
            // 이름이 있는 경우 첫 글자들 사용
            const nameParts = fullName.split(' ');
            if (nameParts.length >= 2) {
              initials = `${nameParts[0].charAt(0)}${nameParts[1].charAt(0)}`.toUpperCase();
            } else {
              initials = fullName.substring(0, 2).toUpperCase();
            }
          } else if (email) {
            // 이메일에서 이니셜 생성
            initials = email.substring(0, 2).toUpperCase();
          } else {
            initials = 'UK'; // Unknown
          }
          
          console.log('Setting user info:', { 
            firstName, 
            lastName, 
            email, 
            fullName, 
            initials,
            picture: decodedToken.picture 
          });
          
          setUser({
            id: decodedToken.sub || '1',
            name: fullName,
            role: 'process_owner', // Default role - could be determined from token claims
            avatar: decodedToken.picture || '', // Keep the picture URL for fallback
            initials: initials
          });
        } else {
          console.log('Failed to decode token, using fallback user');
          // Fallback to demo user
          setUser({
            id: '1',
            name: 'Demo User',
            role: 'process_owner',
            avatar: '',
            initials: 'DU'
          });
        }
      } catch (error) {
        console.error('Error initializing user from token:', error);
        // Fallback to demo user
        setUser({
          id: '1',
          name: 'Demo User',
          role: 'process_owner',
          avatar: '',
          initials: 'DU'
        });
      }
    };
    
    initializeUser();
  }, [sdk]);
  
  const hasPermission = (permission: string) => {
    if (!user) return false;
    return rolePermissions[user.role].includes(permission);
  };
  return <AuthContext.Provider value={{
    user,
    login,
    logout,
    hasPermission
  }}>
      {children}
    </AuthContext.Provider>;
};
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};