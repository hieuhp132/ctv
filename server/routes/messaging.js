const express = require("express");
const router = express.Router();
const authMiddleWare = require("../middlewares/auth");
const { readFile, writeFile } = require("../utils/fileStore");
const { get } = require("mongoose");

// Helper to get data
const getMessages = () => readFile("messages.json") || [];
const saveMessages = (data) => writeFile("messages.json", data);

const getConversations = () => readFile("conversations.json") || [];
const saveConversations = (data) => writeFile("conversations.json", data);

const getUsers = () => readFile("users.json") || [];

// Get all conversations for a user
router.get("/conversations", authMiddleWare, (req, res) => {
  const userId = req.user.id;
  const conversations = getConversations();
  const users = getUsers();

  const result = conversations
    .filter(c => c.participants.includes(userId))
    .map(c => {
      const otherUserId = c.participants.find(p => p !== userId);
      const otherUser = users.find(u => (u.id || u._id) === otherUserId);

      return {
        ...c,
        displayName: otherUser?.name || otherUser?.email || "Unknown",
        avatar: otherUser?.avatar || null,
      };
    })
    .sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));

  res.json(result);
});


// Get messages for a conversation
router.get("/conversations/:conversationId", authMiddleWare, (req, res) => {
  try {
    const { conversationId } = req.params;
    const messages = getMessages();
    const conversationMessages = messages.filter(
      (msg) => msg.conversationId === conversationId
    );
    res.json(conversationMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send a message
router.post("/send-message", authMiddleWare, (req, res) => {
  try {
    const { conversationId, content, recipientId } = req.body;
    const senderId = req.user.id;

    let conversations = getConversations();
    let conversation = conversations.find(c => c.id === conversationId);

    // 1️⃣ Create conversation if not exists
    if (!conversation) {
      conversation = {
        id: conversationId,
        participants: [senderId, recipientId],
        createdAt: new Date().toISOString(),
        lastMessage: content,
        lastMessageAt: new Date().toISOString(),
      };
      conversations.push(conversation);
    } else {
      // 2️⃣ Update existing conversation
      conversation.lastMessage = content;
      conversation.lastMessageAt = new Date().toISOString();
    }

    saveConversations(conversations);

    // 3️⃣ Save message
    const newMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      conversationId,
      senderId,
      recipientId,
      content,
      timestamp: new Date().toISOString(),
      read: false,
    };

    const messages = getMessages();
    messages.push(newMessage);
    saveMessages(messages);

    res.status(201).json(newMessage);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark messages as read
router.put("/messages/read/:messageId", authMiddleWare, (req, res) => {
  try {
    
    // Get conversationId from params and find all messages in that conversation to mark as read, messagesId are in body
    const { messageId } = req.params;
    const userId = req.user.id;
    const messages = getMessages();
    console.log(`Marking messages as read for user ${userId} based on message ${messageId}`);
    const messageToMark = messages.find(m => m.id === messageId); 
    if (!messageToMark) {
      return res.status(404).json({ error: "Message not found" });
    }
    const conversationId = messageToMark.conversationId;
    let updatedCount = 0;

    messages.forEach(m => {
      if (m.conversationId === conversationId && m.recipientId === userId && !m.read) {
        m.read = true;
        updatedCount++;
      }
    });
    saveMessages(messages);

    console.log(`Marked ${updatedCount} messages as read in conversation ${conversationId} for user ${userId}`);
    res.json({ success: true, updatedCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get unread message count
router.get("/unread-count", authMiddleWare, (req, res) => {
  try {
    const userId = req.user.id;
    const conversations = getConversations();
    const userConversations = conversations.filter((conv) =>
      conv.participants.includes(userId)
    );
    const conversationIds = userConversations.map((c) => c.id);
    
    const messages = getMessages();
    const unreadCount = messages.filter(
      (msg) => conversationIds.includes(msg.conversationId) && !msg.read && msg.senderId !== userId
    ).length;
    console.log(`User ${userId} has ${unreadCount} unread messages.`);
    res.json({ unreadCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get notifications (announcements, job updates, etc)
router.get("/notifications", authMiddleWare, (req, res) => {
  try {
    // In a real app, notifications should also be persisted. 
    // For now, keeping the mock data but ideally this should be in notifications.json
    const notifications = [
      {
        id: "notif_1",
        type: "announcement",
        title: "LIFE AI vừa ráp rếng chốt 1 headcount Marketing",
        message: "Vị trí Senior .NET Dev đang tuyển nhân. Experience working with international clients (US, UK, Sing, Japan, Korea...)",
        timestamp: new Date(Date.now() - 3600000),
        read: false,
        icon: "🔥",
      },
      {
        id: "notif_2",
        type: "job_update",
        title: "New Job Posted: Back End Developer (Java)",
        message: "A new job matching your profile has been posted",
        timestamp: new Date(Date.now() - 7200000),
        read: false,
        icon: "💼",
      },
      {
        id: "notif_3",
        type: "job_update",
        title: "New Job Posted: FrontEnd Publishing",
        message: "Your saved job search criteria matched a new position",
        timestamp: new Date(Date.now() - 86400000),
        read: true,
        icon: "✨",
      },
    ];
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark notification as read
router.put("/notifications/:notificationId/read", authMiddleWare, (req, res) => {
  try {
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a conversation
router.delete("/conversations/:conversationId", authMiddleWare, (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    
    let conversations = getConversations();
    
    // Find and remove conversation
    const convIndex = conversations.findIndex(c => c.id === conversationId);
    if (convIndex === -1) {
      return res.status(404).json({ error: "Conversation not found" });
    }
    
    const conversation = conversations[convIndex];
    
    // Check if user is participant
    if (!conversation.participants.includes(userId)) {
      return res.status(403).json({ error: "Not authorized to delete this conversation" });
    }
    
    // Remove conversation
    conversations.splice(convIndex, 1);
    saveConversations(conversations);
    console.log(`Deleted conversation ${conversationId}. Remaining: ${conversations.length}`);
    
    // Remove messages
    let messages = getMessages();
    const newMessages = messages.filter(m => m.conversationId !== conversationId);
    saveMessages(newMessages);
    
    res.json({ success: true, message: "Conversation deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
