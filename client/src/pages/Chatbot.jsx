
  import React, { useState, useEffect, useRef } from 'react';
  import { Link } from 'react-router-dom';
  import '../styles/chatbot.css'

  function Chatbot() {
    const [message, setMessage] = useState('');
    const [chatHistory, setChatHistory] = useState([
      { sender: 'bot', text: 'Hello! I\'m your Scheme Mapper assistant. How can I help you today?' }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
      scrollToBottom();
    }, [chatHistory]);
    
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
            
          }),
        });
        
        const data = await response.json();               
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