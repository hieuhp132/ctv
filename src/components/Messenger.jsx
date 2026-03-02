import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import {
  getUsersListL,
  fetchConversations,
  fetchMessages,
  deleteConversation,
  sendMessage,
  markMessagesAsRead,
} from "../services/api.js";
import "./Messenger.css";
import {
  IoSend,
  IoClose,
  IoArrowBack,
  IoEllipsisVertical,
  IoTrash,
} from "react-icons/io5";
import { FiSearch } from "react-icons/fi";
import { MdAdd } from "react-icons/md";
import StartConversation from "./StartConversation";

/**
 * Code cho giao diện hiển thị và quản lý hệ thống nhắn tin giữa các người dùng.
 * Các tính năng chính bao gồm:
 * - Hiển thị danh sách các cuộc trò chuyện hiện có.
 * - Tìm kiếm và chọn cuộc trò chuyện.
 * - Hiển thị tin nhắn trong cuộc trò chuyện đã chọn.
 * - Gửi tin nhắn mới.
 * - Bắt đầu cuộc trò chuyện mới với người dùng khác.
 * - Xoá cuộc trò chuyện.
 * Các thành phần giao diện được tổ chức rõ ràng với các phần dành cho danh sách cuộc trò chuyện và khung hiển thị tin nhắn.
 * Các trạng thái và hành động được quản lý thông qua context MessagingContext và AuthContext.
 * @param {boolean} isOpen - Trạng thái mở/đóng của giao diện Messenger.
 * @param {function} onClose - Hàm callback khi đóng giao diện Messenger.
 *
 *
 * @returns
 */

export default function Messenger({ isOpen, onClose }) {
  const { user } = useAuth();
  const [inputValue, setInputValue] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [startConvOpen, setStartConvOpen] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [menuOpen, setMenuOpen] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const messagesEndRef = useRef(null);

  const loadConversations = async () => {
    const res = await fetchConversations();
    setConversations(res.data || res);
  };

  const loadUsers = async () => {
    const res = await getUsersListL();
    setAllUsers(res.data || res);
  };

  const loadMessages = async (conversationId) => {
    const res = await fetchMessages(conversationId);
    setMessages(res.data || res);
  };

  useEffect(() => {
    if (isOpen) {
      loadConversations();
      loadUsers(); // ✅ BỔ SUNG
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /**Opem selected Conversation, and mark it as read. */
  const handleSelectConversation = async (conversation) => {
    setCurrentConversation(conversation);

    const res = await fetchMessages(conversation.id);
    const msgs = res.data || res;

    setMessages(msgs);

    if (msgs.length) {
      markMessagesAsRead(msgs.map(m => m.id));
    }
  };


  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const currentUserId = user.id || user._id;
    const recipientId = currentConversation.participants.find(
      (id) => id !== currentUserId,
    );

    await sendMessage(currentConversation.id, inputValue, recipientId);

    setInputValue("");
    loadMessages(currentConversation.id); // ✅ BỔ SUNG
    loadConversations(); // cập nhật lastMessage
  };

  const filteredConversations = conversations
    .filter((conv) =>
      conv.lastMessage?.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));

  // Show matching users when search is active
  const filteredUsers = searchTerm.trim()
    ? allUsers.filter(
        (u) =>
          (u.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
          (u.email?.toLowerCase() || "").includes(searchTerm.toLowerCase()),
      )
    : [];

  const handleDeleteConversation = async (convId) => {
    if (window.confirm("Delete this conversation?")) {
      await deleteConversation(convId);
      setMenuOpen(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="messenger-overlay" onClick={onClose}>
      <div className="messenger-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="messenger-header">
          <h2>Messages</h2>
          <button className="close-btn" onClick={onClose}>
            <IoClose size={24} />
          </button>
        </div>

        <div className="messenger-body">
          {/* Conversations List */}
          <div className="conversations-list">
            <div className="search-box">
              <FiSearch size={18} />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button
                className="new-conversation-btn"
                onClick={() => setStartConvOpen(true)}
                title="Start new conversation"
              >
                <MdAdd size={20} /> +
              </button>
            </div>

            {filteredConversations.length === 0 ? (
              <div className="empty-state">No conversations yet</div>
            ) : (
              filteredConversations.map((conv) => (
                console.log(conv),
                <div
                  key={conv.id}
                  className={`conversation-item ${currentConversation?.id === conv.id ? "active" : ""}`}
                  onClick={() => handleSelectConversation(conv)}
                >
                  <div className="conv-avatar">
                    {conv.participants[0]?.charAt(0).toUpperCase()}
                  </div>
                  <div className="conv-info">
                    <h4>{conv.displayName}</h4>
                    <p className="last-message">{conv.lastMessage}</p>
                  </div>
                  <div className="conv-actions">
                    {menuOpen === conv.id && (
                      <div className="context-menu">
                        <button
                          className="menu-item delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteConversation(conv.id);
                          }}
                        >
                          <IoTrash size={14} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                  <span className="timestamp">
                    {new Date(conv.lastMessageAt).toLocaleDateString()}
                  </span>
                  <button
                    className="menu-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(menuOpen === conv.id ? null : conv.id);
                    }}
                    title="More options"
                  >
                    <IoEllipsisVertical size={16} />
                  </button>
                </div>
              ))
            )}

            {/* Show users when searching */}
            {searchTerm.trim() && filteredUsers.length > 0 && (
              <div className="users-section">
                <div className="section-title">Start a conversation with:</div>
                {filteredUsers.map((u) => (
                  <div
                    key={u.id}
                    className="user-item"
                    onClick={() => {
                      setSelectedUser(u);
                      setStartConvOpen(true);
                    }}
                  >
                    <div className="conv-avatar">
                      {u.name?.charAt(0).toUpperCase() ||
                        u.email?.charAt(0).toUpperCase()}
                    </div>
                    <div className="conv-info">
                      <h4>{u.name || u.email}</h4>
                      <p className="user-role">{u.role || "User"}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Messages View */}
          <div
            className={`messages-view ${currentConversation ? "active" : ""}`}
          >
            {currentConversation ? (
              <>
                <div className="messages-header">
                  <button
                    className="back-btn"
                    onClick={() => setCurrentConversation(null)}
                    title="Back to conversations"
                  >
                    <IoArrowBack size={20} />
                  </button>
                  <h3>{currentConversation.displayName}</h3>
                </div>

                <div className="messages-list">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`message ${msg.senderId === (user?.id || user?._id) ? "sent" : "received"}`}
                    >
                      <div className="message-bubble">
                        <p>{msg.content}</p>
                        <span className="message-time">
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                <div className="message-input">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  />
                  <button
                    className="send-btn"
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim()}
                  >
                    <IoSend size={20} />
                  </button>
                </div>
              </>
            ) : (
              <div className="empty-state">
                Select a conversation to start messaging
              </div>
            )}
          </div>
        </div>
      </div>

      {/* START CONVERSATION MODAL */}
      <StartConversation
        isOpen={startConvOpen}
        onClose={() => {
          setStartConvOpen(false);
          setSelectedUser(null);
        }}
        recipientId={selectedUser?.id}
        recipientName={selectedUser?.name || selectedUser?.email}
        onConversationCreated={() => {
          setStartConvOpen(false);
          setSelectedUser(null);
          loadConversations();
        }}
      />
    </div>
  );
}
