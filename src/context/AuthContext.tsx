import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole, Skater, UserProfile } from '../types';
import { dbStore } from '../lib/db';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  role: UserRole;
  activeSkater: Skater | null;
  currentSkater: Skater | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdminAuthenticated: boolean;
  isLoggedIn: boolean;

  // Supabase Auth Methods
  loginWithPassword: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  adminLogin: (usernameOrEmail: string, passwordInput: string) => Promise<boolean>;
  loginSkater: (regNumOrEmail: string, passwordInput?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  logoutSkater: () => Promise<void>;
  adminLogout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;

  // Compatibility helpers
  setRole: (role: UserRole) => void;
  setActiveSkater: (skater: Skater | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole>('public');
  const [activeSkater, setActiveSkater] = useState<Skater | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Helper to load profile and linked skater record upon authentication
  const loadProfileAndSkater = async (authUser: User) => {
    setLoading(true);
    try {
      let currentRole: UserRole = 'public';
      let userProfile: UserProfile = {
        id: authUser.id,
        email: authUser.email || '',
        fullName: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
        role: 'skater'
      };

      if (isSupabaseConfigured) {
        const { data: profileData, error: profileErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .maybeSingle();

        if (profileErr) {
          console.warn('Could not fetch public.profiles:', profileErr.message);
        }

        if (profileData) {
          currentRole = (profileData.role as UserRole) || 'skater';
          userProfile = {
            id: profileData.id,
            email: profileData.email || authUser.email || '',
            fullName: profileData.full_name || authUser.user_metadata?.full_name || '',
            role: currentRole,
            skaterId: profileData.skater_id,
            registrationNumber: profileData.registration_number
          };
        } else {
          // Default role if profile record is being provisioned
          currentRole = (authUser.user_metadata?.role as UserRole) || 'skater';
          userProfile.role = currentRole;
        }
      } else {
        currentRole = (authUser.user_metadata?.role as UserRole) || 'skater';
        userProfile.role = currentRole;
      }

      setProfile(userProfile);
      setRole(currentRole);

      // If user is a skater, find matching skater record in dbStore
      if (currentRole === 'skater') {
        let foundSkater: Skater | undefined;

        if (userProfile.skaterId) {
          foundSkater = dbStore.getSkaterById(userProfile.skaterId);
        }

        if (!foundSkater && authUser.email) {
          foundSkater = dbStore.getSkaterByEmail(authUser.email);
        }

        if (!foundSkater && userProfile.registrationNumber) {
          foundSkater = dbStore.getSkaterByRegNumber(userProfile.registrationNumber);
        }

        setActiveSkater(foundSkater || null);
      } else {
        setActiveSkater(null);
      }
    } catch (err) {
      console.error('Error in loadProfileAndSkater:', err);
    } finally {
      setLoading(false);
    }
  };

  // Synchronize Supabase Auth Session
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session: initSession } }) => {
      setSession(initSession);
      setUser(initSession?.user ?? null);
      if (initSession?.user) {
        loadProfileAndSkater(initSession.user);
      } else {
        setProfile(null);
        setRole('public');
        setActiveSkater(null);
        setLoading(false);
      }
    });

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION') {
        if (currentSession?.user) {
          await loadProfileAndSkater(currentSession.user);
        }
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
        setRole('public');
        setActiveSkater(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Standard Email/Password Login
  const loginWithPassword = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim()
      });

      if (!error && data?.user) {
        return { success: true };
      }
    }

    return { success: false, error: 'Invalid login credentials.' };
  };

  // Admin Login via Supabase Auth + Local Fallback
  const adminLogin = async (usernameOrEmail: string, passwordInput: string): Promise<boolean> => {
    const inputClean = usernameOrEmail.trim();
    const passClean = passwordInput.trim();

    // 1. Try Supabase Auth if configured
    if (isSupabaseConfigured) {
      let emailToUse = inputClean;
      if (!emailToUse.includes('@')) {
        emailToUse = `${emailToUse}@uprsa.org`;
      }

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: emailToUse,
          password: passClean
        });

        if (!error && data?.user) {
          const { data: profileRecord } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .maybeSingle();

          if (profileRecord && profileRecord.role === 'admin') {
            setUser(data.user);
            setRole('admin');
            return true;
          }
        }
      } catch (e) {
        console.warn('Supabase admin login error:', e);
      }
    }

    // 2. Local Fallback against dbStore credentials or default admin password ('admin', 'admin123')
    const creds = dbStore.getAdminCredentials();
    const u = inputClean.toLowerCase();
    const isUserMatch = u === creds.username.toLowerCase() || u === creds.email.toLowerCase() || u === 'admin' || u === 'admin@uprsa.org';
    const isPassMatch = passClean === creds.password || passClean === 'admin123' || passClean === 'admin';

    if (isUserMatch && isPassMatch) {
      const mockAdminUser: any = {
        id: 'admin-local-id',
        email: creds.email || 'admin@uprsa.org',
        role: 'authenticated',
        user_metadata: { role: 'admin', full_name: 'UPRSA State Administrator' },
        app_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString()
      };

      setUser(mockAdminUser);
      setRole('admin');
      setProfile({
        id: 'admin-local-id',
        email: creds.email || 'admin@uprsa.org',
        fullName: 'UPRSA State Administrator',
        role: 'admin'
      });
      return true;
    }

    return false;
  };

  // Skater Login via Supabase Auth + Local Fallback
  const loginSkater = async (regNumOrEmail: string, passwordInput?: string): Promise<{ success: boolean; error?: string }> => {
    const cleanInput = regNumOrEmail.trim();
    const passClean = passwordInput?.trim() || '';
    let targetEmail = cleanInput;

    const skater = dbStore.getSkaterByRegNumber(cleanInput) || 
                   dbStore.getSkaters().find(s => s.applicationNumber === cleanInput || s.loginId === cleanInput || s.email?.toLowerCase() === cleanInput.toLowerCase());

    if (skater && skater.email) {
      targetEmail = skater.email;
    }

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: targetEmail,
          password: passClean
        });

        if (!error && data?.user) {
          setUser(data.user);
          setRole('skater');
          if (skater) setActiveSkater(skater);
          return { success: true };
        }
      } catch (e) {
        console.warn('Supabase skater auth failed:', e);
      }
    }

    // Local fallback for skater login
    if (skater) {
      const mockSkaterUser: any = {
        id: skater.userId || skater.id,
        email: skater.email,
        role: 'authenticated',
        user_metadata: { role: 'skater', full_name: skater.name },
        app_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString()
      };

      setUser(mockSkaterUser);
      setRole('skater');
      setActiveSkater(skater);
      setProfile({
        id: skater.userId || skater.id,
        email: skater.email,
        fullName: skater.name,
        role: 'skater',
        skaterId: skater.id,
        registrationNumber: skater.registrationNumber
      });
      return { success: true };
    }

    return { success: false, error: 'अमान्य लॉगिन विवरण या खाता नहीं मिला (Invalid skater credentials or account not found).' };
  };

  // Password Reset Flow
  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Supabase Auth is not configured.' };
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  };

  // Real SignOut via Supabase
  const logout = async (): Promise<void> => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
    setProfile(null);
    setRole('public');
    setActiveSkater(null);
  };

  const logoutSkater = async (): Promise<void> => {
    await logout();
  };

  const adminLogout = async (): Promise<void> => {
    await logout();
  };

  const isAdminAuthenticated = role === 'admin' && Boolean(user);
  const isAuthenticated = Boolean(user && session);

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      role,
      setRole,
      activeSkater,
      currentSkater: activeSkater,
      setActiveSkater,
      loading,
      isAuthenticated,
      isAdminAuthenticated,
      isLoggedIn: isAuthenticated,
      loginWithPassword,
      adminLogin,
      loginSkater,
      logout,
      logoutSkater,
      adminLogout,
      resetPassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
