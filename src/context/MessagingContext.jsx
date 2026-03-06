import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { API_BASE } from "../api";

const MessagingContext = createContext();

export function MessagingProvider({ children }) {
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      const session = JSON.parse(sessionStorage.getItem("authSession") || "{}");
      const token = session?.token;
      if (!token) return; // No token available
      const res = await fetch(`${API_BASE}/api/messaging/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch messages for conversation
  const fetchMessages = useCallback(async (conversationId, silent = false) => {
    try {
      if (!silent) setLoading(true);
      const session = JSON.parse(sessionStorage.getItem("authSession") || "{}");
      const token = session?.token;
      if (!token) return; // No token available
      const res = await fetch(
        `${API_BASE}/api/messaging/conversations/${conversationId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // Poll for messages in current conversation
  useEffect(() => {
    if (!currentConversation) return;

    const interval = setInterval(() => {
      fetchMessages(currentConversation.id, true);
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [currentConversation, fetchMessages]);

  // Send message
  const sendMessage = useCallback(async (conversationId, content, recipientId) => {
    try {
      const session = JSON.parse(sessionStorage.getItem("authSession") || "{}");
      const token = session?.token;
      if (!token) throw new Error("No auth token found");
      const res = await fetch(`${API_BASE}/api/messaging/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ conversationId, content, recipientId }),
      });
      if (res.ok) {
        const message = await res.json();
        setMessages((prev) => [...prev, message]);
        return message;
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  }, []);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const session = JSON.parse(sessionStorage.getItem("authSession") || "{}");
      const token = session?.token;
      if (!token) return; // No token available
      const res = await fetch(`${API_BASE}/api/messaging/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  }, []);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const session = JSON.parse(sessionStorage.getItem("authSession") || "{}");
      const token = session?.token;
      if (!token) return; // No token available
      const res = await fetch(`${API_BASE}/api/messaging/unread-count`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  }, []);

  // Mark notification as read
  const markNotificationAsRead = useCallback(async (notificationId) => {
    try {
      const session = JSON.parse(sessionStorage.getItem("authSession") || "{}");
      const token = session?.token;
      if (!token) throw new Error("No auth token found");
      await fetch(`${API_BASE}/api/messaging/notifications/${notificationId}/read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  }, []);

  // Delete a conversation
  const deleteConversation = useCallback(async (conversationId) => {
    try {
      const session = JSON.parse(sessionStorage.getItem("authSession") || "{}");
      const token = session?.token;
      if (!token) throw new Error("No auth token found");
      const res = await fetch(`${API_BASE}/api/messaging/conversations/${conversationId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // If success (200) or not found (404 - already deleted), remove from local state
      if (res.ok || res.status === 404) {
        setConversations((prev) => prev.filter((c) => c.id !== conversationId));
        if (currentConversation?.id === conversationId) {
            setCurrentConversation(null);
            setMessages([]);
        }
        return true;
      } else {
        console.error("Failed to delete conversation:", res.statusText);
        return false;
      }
    } catch (error) {
      console.error("Failed to delete conversation:", error);
      return false;
    }
  }, [currentConversation]);

  // Initial load
  useEffect(() => {
    const session = JSON.parse(sessionStorage.getItem("authSession") || "{}");
    const token = session?.token;
    if (token) {
      fetchConversations();
      fetchNotifications();
      fetchUnreadCount();
      
      // Refresh every 30 seconds
      const interval = setInterval(() => {
        fetchUnreadCount();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [fetchConversations, fetchNotifications, fetchUnreadCount]);

  const value = {
    conversations,
    currentConversation,
    setCurrentConversation,
    messages,
    notifications,
    unreadCount,
    loading,
    fetchConversations,
    fetchMessages,
    sendMessage,
    fetchNotifications,
    markNotificationAsRead,
    fetchUnreadCount,
    deleteConversation,
  };

  return (
    <MessagingContext.Provider value={value}>
      {children}
    </MessagingContext.Provider>
  );
}

export function useMessaging() {
  const context = useContext(MessagingContext);
  if (!context) {
    throw new Error("useMessaging must be used within MessagingProvider");
  }
  return context;
}
