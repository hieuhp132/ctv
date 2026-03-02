import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { getUsersListL, sendMessage } from "../services/api.js";
import "./StartConversation.css";
import { IoClose, IoSend } from "react-icons/io5";

export default function StartConversation({
  recipientId: propRecipientId,
  recipientName: propRecipientName,
  isOpen,
  onClose,
  onConversationCreated,
}) {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // State for user search
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [searching, setSearching] = useState(false);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setMessage("");
      setSearchTerm("");
      setSearchResults([]);
      setSelectedRecipient(null);
    }
  }, [isOpen]);

  // Determine actual recipient
  const finalRecipientId = propRecipientId || selectedRecipient?.id;
  const finalRecipientName =
    propRecipientName || selectedRecipient?.name || selectedRecipient?.email;

  // Search users
  useEffect(() => {
    if (!propRecipientId && searchTerm.trim()) {
      const delayDebounce = setTimeout(async () => {
        try {
          setSearching(true);
          const res = await getUsersListL();
          if (res) {
            const filtered = res
              .filter((u) => (u._id || u.id) !== (user?.id || user?._id)) // Exclude self
              .filter(
                (u) =>
                  u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  u.email?.toLowerCase().includes(searchTerm.toLowerCase()),
              )
              .map((u) => ({ ...u, id: u._id || u.id })); // Normalize ID
            setSearchResults(filtered);
          }
        } catch (error) {
          console.error("Search failed:", error);
        } finally {
          setSearching(false);
        }
      }, 500);

      return () => clearTimeout(delayDebounce);
    } else {
      setSearchResults([]);
    }
  }, [searchTerm, propRecipientId, user]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const senderId = user?.id || user?._id;
    if (!senderId) {
      console.error("User ID missing from auth context", user);
      alert("Authentication error. Please try logging in again.");
      return;
    }

    if (!finalRecipientId) {
      alert("Please select a recipient");
      return;
    }

    try {
      setLoading(true);
      const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await sendMessage(conversationId, message, finalRecipientId);
      setMessage("");
      if (onConversationCreated) {
        onConversationCreated();
      } else {
        onClose();
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="start-conv-overlay" onClick={onClose}>
      <div
        className="start-conv-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="start-conv-header">
          <h3>
            {finalRecipientId
              ? `Message to ${finalRecipientName}`
              : "New Conversation"}
          </h3>
          <button className="close-btn" onClick={onClose}>
            <IoClose size={24} />
          </button>
        </div>

        <div className="start-conv-body">
          {/* User Search Section - Only show if no recipient provided via props and none selected */}
          {!propRecipientId && !selectedRecipient && (
            <div className="recipient-search">
              <label>To:</label>
              <input
                type="text"
                placeholder="Search user by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
              {searchResults.length > 0 && (
                <div className="search-results">
                  {searchResults.map((u) => (
                    <div
                      key={u.id}
                      className="search-result-item"
                      onClick={() => setSelectedRecipient(u)}
                    >
                      <div className="user-avatar">
                        {u.name?.charAt(0).toUpperCase() ||
                          u.email?.charAt(0).toUpperCase()}
                      </div>
                      <div className="user-info">
                        <div className="user-name">{u.name || u.email}</div>
                        <div className="user-role">{u.role}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {searchTerm && !searching && searchResults.length === 0 && (
                <div className="no-results">No users found</div>
              )}
            </div>
          )}

          {/* Selected User Display */}
          {!propRecipientId && selectedRecipient && (
            <div className="selected-recipient">
              <span className="to-label">To:</span>
              <span className="recipient-chip">
                {selectedRecipient.name || selectedRecipient.email}
                <button onClick={() => setSelectedRecipient(null)}>
                  <IoClose size={14} />
                </button>
              </span>
            </div>
          )}

          {/* Message Input - Only show if recipient is determined */}
          {finalRecipientId && (
            <>
              <p className="helper-text">Send a message to start chatting</p>
              <textarea
                placeholder="Type your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="message-textarea"
                rows={4}
                autoFocus={!!selectedRecipient || !!propRecipientId}
              />
            </>
          )}
        </div>

        <div className="start-conv-footer">
          <button className="btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-send"
            onClick={handleSendMessage}
            disabled={!message.trim() || loading || !finalRecipientId}
          >
            <IoSend size={16} />
            Send Message
          </button>
        </div>
      </div>
    </div>
  );
}
