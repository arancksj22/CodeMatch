import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FaPaperPlane, FaChevronLeft } from 'react-icons/fa';
import '../styles/ChatPage.css';

const ChatPage = () => {
  const { currentUser, getAuthHeader } = useAuth();
  
  // Chat state
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messageEndRef = useRef(null);

  // Check for selected match from MatchesPage or ProfilePage immediately when component mounts
  useEffect(() => {
    const selectedMatchData = sessionStorage.getItem('selectedMatch');
    
    if (selectedMatchData) {
      try {
        const selectedMatch = JSON.parse(selectedMatchData);
        console.log("Found selected match on initial load:", selectedMatch.name, "ID:", selectedMatch.id);
        
        // Create a new conversation for this match first thing
        const newConversation = {
          id: `temp-${selectedMatch.id}`,
          matchId: selectedMatch.id,
          user: {
            id: selectedMatch.id,
            name: selectedMatch.name,
            isOnline: true,
            lastSeen: new Date()
          },
          messages: [],
          unreadCount: 0
        };
        
        // Set as active conversation immediately
        setConversations([newConversation]);
        setActiveConversation(newConversation);
        
        // Clear the selected match data since we've handled it
        sessionStorage.removeItem('selectedMatch');
        
        // Set loading to false since we have our conversation
        setLoading(false);
      } catch (error) {
        console.error('Error parsing initial selected match:', error);
      }
    }
  }, []);
  
  // Load user's matches and conversations on component mount
  useEffect(() => {
    if (currentUser && currentUser.id) {
      // Don't fetch matches again if we already have an active conversation
      // from the selectedMatch data (to avoid selecting the wrong conversation)
      if (!activeConversation) {
        fetchUserMatches();
      }
    }
  }, [currentUser, activeConversation]);
  
  // Scroll to bottom of messages when new messages are added
  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeConversation?.messages]);
  
  // Separate function to directly set active conversation
  const setSelectedMatchAsActive = (selectedMatch) => {
    // Create a new conversation for this match
    const newConversation = {
      id: `temp-${selectedMatch.id}`,
      matchId: selectedMatch.id,
      user: {
        id: selectedMatch.id,
        name: selectedMatch.name,
        isOnline: true,
        lastSeen: new Date()
      },
      messages: [],
      unreadCount: 0
    };
    
    setConversations([newConversation]);
    setActiveConversation(newConversation);
    
    // Clear selectedMatch from sessionStorage after processing
    sessionStorage.removeItem('selectedMatch');
  };
  
  // Fetch user's matches to create conversations
  const fetchUserMatches = async () => {
    setLoading(true);
    try {
      // Check first if we have a selected match before loading all conversations
      const selectedMatchData = sessionStorage.getItem('selectedMatch');
      if (selectedMatchData) {
        const selectedMatch = JSON.parse(selectedMatchData);
        console.log("Found selected match before loading conversations:", selectedMatch);
        
        // If we have a selected match, directly set up a conversation with this match
        setSelectedMatchAsActive(selectedMatch);
        setLoading(false);
        return;
      }
      
      const response = await fetch(`http://localhost:5000/api/user-matches/${currentUser.id}`, {
        headers: getAuthHeader()
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch your matches');
      }
      
      const matches = await response.json();
      
      // Convert matches to conversations
      const matchConversations = matches.map(match => ({
        id: match.id,
        matchId: match.id,
        user: {
          id: match.id,
          name: match.username || match.name || 'User',
          isOnline: Math.random() > 0.5, // Randomize online status for demo
          lastSeen: new Date(Date.now() - Math.floor(Math.random() * 24 * 60 * 60 * 1000)), // Random last seen
        },
        messages: [], // Empty messages initially
        unreadCount: 0
      }));
      
      // Add example message to first conversation if it exists and no specific match selected
      if (matchConversations.length > 0 && !selectedMatchData) {
        // Don't automatically add a message to the first conversation
        // This way only conversations the user explicitly clicks on will have messages
      }
      
      // Check if we have a selected match from sessionStorage
      if (selectedMatchData) {
        try {
          const selectedMatch = JSON.parse(selectedMatchData);
          console.log("Processing selectedMatch in fetchUserMatches:", selectedMatch);
          
          // Check if this match already exists in conversations
          const existingConversationIndex = matchConversations.findIndex(
            conv => conv.user.id.toString() === selectedMatch.id.toString()
          );
          
          if (existingConversationIndex >= 0) {
            console.log("Found existing conversation at index:", existingConversationIndex);
            // Set this conversation as active
            const conversation = matchConversations[existingConversationIndex];
            setActiveConversation(conversation);
          } else {
            console.log("Creating new conversation from selected match");
            // Create a new conversation for this match
            const newConversation = {
              id: `temp-${selectedMatch.id}`,
              matchId: selectedMatch.id,
              user: {
                id: selectedMatch.id,
                name: selectedMatch.name,
                isOnline: true,
                lastSeen: new Date()
              },
              messages: [],
              unreadCount: 0
            };
            
            matchConversations.push(newConversation);
            setActiveConversation(newConversation);
          }
          
          // Clear the selected match after processing
          sessionStorage.removeItem('selectedMatch');
        } catch (error) {
          console.error('Error parsing selected match:', error);
        }
      }
      
      setConversations(matchConversations);
      
      // DON'T set the first conversation as active if no match is selected
      // This ensures only explicitly selected conversations are shown
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle sending a message
  const handleSendMessage = () => {
    if (!newMessage.trim() || !activeConversation) return;
    
    const updatedConversations = [...conversations];
    const conversationIndex = updatedConversations.findIndex(
      c => c.id === activeConversation.id
    );
    
    if (conversationIndex >= 0) {
      const newMessageObj = {
        id: Date.now(), // Use timestamp as ID for demo
        text: newMessage,
        sender: 'me',
        timestamp: new Date().toISOString()
      };
      
      updatedConversations[conversationIndex].messages.push(newMessageObj);
      setConversations(updatedConversations);
      setActiveConversation(updatedConversations[conversationIndex]);
      setNewMessage('');
      
      // Simulate receiving a reply after a delay
      setTimeout(() => {
        const replyMessages = [
          "Thanks for reaching out! I'd be interested in collaborating.",
          "Sounds interesting! What kind of project are you working on?",
          "I'm currently looking for new opportunities. Tell me more!",
          "Nice to connect with you! I'd love to discuss this further."
        ];
        
        const randomReply = replyMessages[Math.floor(Math.random() * replyMessages.length)];
        
        const replyMessage = {
          id: Date.now(),
          text: randomReply,
          sender: 'them',
          timestamp: new Date().toISOString()
        };
        
        const updatedWithReply = [...conversations];
        updatedWithReply[conversationIndex].messages.push(replyMessage);
        setConversations(updatedWithReply);
        setActiveConversation(updatedWithReply[conversationIndex]);
      }, 2000);
    }
  };
  
  // Handle pressing Enter to send message
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Select a conversation
  const handleSelectConversation = (conversation) => {
    setActiveConversation(conversation);
    
    // Mark conversation as read
    const updatedConversations = conversations.map(conv => {
      if (conv.id === conversation.id) {
        return { ...conv, unreadCount: 0 };
      }
      return conv;
    });
    
    setConversations(updatedConversations);
  };
  
  return (
    <div className="chat-page">
      <div className="chat-container">
        <div className="chat-sidebar">
          <div className="sidebar-header">
            <h3>Messages</h3>
          </div>
          
          <div className="conversation-list">
            {loading ? (
              <div className="loading-chats">Loading conversations...</div>
            ) : conversations.length === 0 ? (
              <div className="no-conversations">
                <p>No connections yet.</p>
                <p>Connect with developers to start chatting!</p>
              </div>
            ) : (
              conversations.map(conversation => (
                <div 
                  key={conversation.id} 
                  className={`conversation-item ${activeConversation?.id === conversation.id ? 'active' : ''}`}
                  onClick={() => handleSelectConversation(conversation)}
                >
                  <div className="conversation-avatar">
                    <div className="avatar-initial">
                      {conversation.user.name.charAt(0).toUpperCase()}
                    </div>
                    {conversation.user.isOnline && <span className="online-indicator"></span>}
                  </div>
                  
                  <div className="conversation-info">
                    <div className="conversation-name">
                      {conversation.user.name}
                      {conversation.unreadCount > 0 && (
                        <span className="unread-count">{conversation.unreadCount}</span>
                      )}
                    </div>
                    
                    <div className="conversation-preview">
                      {conversation.messages.length > 0 
                        ? conversation.messages[conversation.messages.length - 1].text.substring(0, 30) + 
                          (conversation.messages[conversation.messages.length - 1].text.length > 30 ? '...' : '')
                        : 'No messages yet. Start the conversation!'
                      }
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="chat-main">
          {activeConversation ? (
            <>
              <div className="chat-header">
                <button className="back-to-list-mobile">
                  <FaChevronLeft />
                </button>
                <div className="header-avatar">
                  <div className="avatar-initial">
                    {activeConversation.user.name.charAt(0).toUpperCase()}
                  </div>
                  {activeConversation.user.isOnline && <span className="online-indicator"></span>}
                </div>
                <div className="header-info">
                  <h3>{activeConversation.user.name}</h3>
                  <p className="user-status">
                    {activeConversation.user.isOnline 
                      ? 'Online' 
                      : `Last seen ${new Date(activeConversation.user.lastSeen).toLocaleString()}`
                    }
                  </p>
                </div>
              </div>
              
              <div className="messages-container">
                <div className="chat-date-divider">
                  <span>Today</span>
                </div>
                
                {activeConversation.messages.length > 0 ? (
                  activeConversation.messages.map(message => (
                    <div 
                      key={message.id} 
                      className={`message ${message.sender === 'me' ? 'sent' : 'received'}`}
                    >
                      <div className="message-bubble">
                        <div className="message-text">{message.text}</div>
                        <div className="message-time">
                          {new Date(message.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-messages">
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                )}
                
                <div ref={messageEndRef} />
              </div>
              
              <div className="message-input-container">
                <textarea 
                  className="message-input" 
                  placeholder="Type a message..." 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                ></textarea>
                <button 
                  className="send-button"
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                >
                  <FaPaperPlane />
                </button>
              </div>
            </>
          ) : (
            <div className="no-conversation-selected">
              <p>Select a conversation or connect with teammates to start chatting.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage; 