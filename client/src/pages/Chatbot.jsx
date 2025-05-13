/*import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'

function Chatbot() {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { sender: 'bot', text: 'Hello! I\'m your Scheme Mapper assistant. How can I help you today?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  // Check if we can connect to the backend
  useEffect(() => {
    // Make a simple GET request to verify the connection
    fetch('/chat')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        console.log('Connected to chat backend:', data);
      })
      .catch(error => {
        console.error('Error connecting to chat backend:', error);
        setChatHistory(prev => [
          ...prev,
          { 
            sender: 'bot', 
            text: 'I\'m having trouble connecting to the server. Some features might not work correctly.' 
          }
        ]);
      });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    // Add user message to chat
    const userMessage = { sender: 'user', text: message };
    setChatHistory(prev => [...prev, userMessage]);
    
    // Clear input field
    setMessage('');
    
    // Show loading state
    setIsLoading(true);
    
    try {
      // Send message to backend
      const response = await fetch('/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage.text }),
      });
      
      const data = await response.json();
      
      // Add bot response to chat
      setChatHistory(prev => [...prev, { sender: 'bot', text: data.response }]);
    } catch (error) {
      console.error('Error sending message:', error);
      setChatHistory(prev => [...prev, { 
        sender: 'bot', 
        text: 'Sorry, I encountered an error. Please try again later.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chatbot-container">
      <div className="chat-header">
        <h2>Scheme Mapper Assistant</h2>
        <nav>
          <Link to="/user">User Dashboard</Link>
          <Link to="/chat" className="active">Chat with Assistant</Link>
        </nav>
      </div>
      
      <div className="chat-messages">
        {chatHistory.map((chat, index) => (
          <div key={index} className={`message ${chat.sender}`}>
            <div className="message-bubble">
              {chat.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message bot">
            <div className="message-bubble loading">
              Typing...
            </div>
          </div>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="chat-input-form">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message here..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>
          Send
        </button>
      </form>
    </div>
  );
}

export default Chatbot;
*/

import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

function Chatbot() {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { sender: 'bot', text: 'Hello! I\'m your Scheme Mapper assistant. How can I help you today?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  // Check backend connection
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch('/chat');
        if (!response.ok) {
          throw new Error('Connection failed');
        }
        const data = await response.json();
        console.log('Connected to chat backend:', data);
      } catch (error) {
        console.error('Error connecting to chat backend:', error);
        setChatHistory(prev => [
          ...prev,
          { 
            sender: 'bot', 
            text: 'I\'m having temporary connection issues. Some features might not work correctly.' 
          }
        ]);
      }
    };
    checkConnection();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    // Add user message to chat
    const userMessage = { sender: 'user', text: message };
    setChatHistory(prev => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);
    
    try {
      const response = await fetch('/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: userMessage.text,
          // You can add user profile data here if available
          // profile: { age: 30, income: 50000, ... }
        }),
      });
      
      const data = await response.json();
      
      // Format response with line breaks
      const formattedResponse = data.response.replace(/\n/g, '<br />');
      
      setChatHistory(prev => [
        ...prev, 
        { 
          sender: 'bot', 
          text: formattedResponse,
          isHTML: true 
        }
      ]);
    } catch (error) {
      console.error('Error sending message:', error);
      setChatHistory(prev => [...prev, { 
        sender: 'bot', 
        text: 'Sorry, I encountered an error. Please try again later.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chatbot-container">
      <div className="chat-header">
        <h2>Scheme Mapper Assistant</h2>
        <nav>
          <Link to="/user">User Dashboard</Link>
          <Link to="/chat" className="active">Chat with Assistant</Link>
        </nav>
      </div>
      
      <div className="chat-messages">
        {chatHistory.map((chat, index) => (
          <div key={index} className={`message ${chat.sender}`}>
            <div className="message-bubble">
              {chat.isHTML ? (
                <div dangerouslySetInnerHTML={{ __html: chat.text }} />
              ) : (
                chat.text
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message bot">
            <div className="message-bubble loading">
              <span className="typing-dots">
                <span>.</span><span>.</span><span>.</span>
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSubmit} className="chat-input-form">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask about government schemes (eligibility, benefits, etc.)..."
          disabled={isLoading}
          autoFocus
        />
        <button type="submit" disabled={isLoading || !message.trim()}>
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
}

export default Chatbot;