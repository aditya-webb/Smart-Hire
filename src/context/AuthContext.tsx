/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import { User, Notification, Message } from "../types";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, name?: string, role?: 'candidate' | 'recruiter' | 'admin') => Promise<void>;
  logout: () => void;
  notifications: Notification[];
  fetchNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  messages: Message[];
  addMessage: (receiverId: string, content: string) => Promise<void>;
  fetchMessages: (receiverId: string) => Promise<void>;
  allUsers: User[];
  fetchAllUsers: () => Promise<void>;
  updateUserStatus: (id: string, status: 'active' | 'suspended') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  useEffect(() => {
    // Restore session from localStorage
    const saved = localStorage.getItem("smarthire_user");
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to restore auth session", e);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
      const interval = setInterval(() => {
        fetchNotifications();
      }, 5000); // Poll notifications every 5 seconds for real-time responsiveness
      return () => clearInterval(interval);
    }
  }, [user?.id]);

  const login = async (email: string, name?: string, role?: 'candidate' | 'recruiter' | 'admin') => {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, role }),
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        localStorage.setItem("smarthire_user", JSON.stringify(data.user));
      } else {
        throw new Error("Unable to authenticate");
      }
    } catch (error) {
      console.error("Login failed", error);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setNotifications([]);
    setMessages([]);
    localStorage.removeItem("smarthire_user");
  };

  const fetchNotifications = async () => {
    if (!user?.id) return;
    try {
      const response = await fetch(`/api/notifications/${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (e) {
      console.error("Failed fetching notifications", e);
    }
  };

  const markNotificationRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: "PUT",
      });
      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => n.id === id ? { ...n, isRead: true } : n)
        );
      }
    } catch (e) {
      console.error("Failed marking notification read", e);
    }
  };

  const fetchMessages = async (receiverId: string) => {
    if (!user?.id) return;
    try {
      const response = await fetch(`/api/messages?senderId=${user.id}&receiverId=${receiverId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (e) {
      console.error("Failed fetching messages", e);
    }
  };

  const addMessage = async (receiverId: string, content: string) => {
    if (!user?.id) return;
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderId: user.id, receiverId, content }),
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, data]);
        fetchNotifications();
      }
    } catch (e) {
      console.error("Failed posting message", e);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const response = await fetch("/api/admin/users");
      if (response.ok) {
        const data = await response.json();
        setAllUsers(data);
      }
    } catch (e) {
      console.error("Error loading user administration index", e);
    }
  };

  const updateUserStatus = async (id: string, status: 'active' | 'suspended') => {
    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (response.ok) {
        const data = await response.json();
        setAllUsers(prev => prev.map(u => u.id === id ? data : u));
        if (user?.id === id) {
          setUser(data);
          localStorage.setItem("smarthire_user", JSON.stringify(data));
        }
      }
    } catch (e) {
      console.error("Failed changing user profile status", e);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      notifications,
      fetchNotifications,
      markNotificationRead,
      messages,
      addMessage,
      fetchMessages,
      allUsers,
      fetchAllUsers,
      updateUserStatus
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be called inside AuthProvider");
  }
  return context;
};
