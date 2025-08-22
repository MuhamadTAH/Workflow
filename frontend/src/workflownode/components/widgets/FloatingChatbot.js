/*
=================================================================
FILE: FloatingChatbot.js - FLOATING CHATBOT WIDGET
=================================================================
This component creates a floating chatbot widget that appears at
the bottom center of the screen when a Chatbot Trigger is enabled.
*/
import React, { useState, useEffect, useRef } from 'react';
import './FloatingChatbot.css';

const FloatingChatbot = ({ 
    isVisible = false, 
    nodeId, 
    title = "Customer Support",
    subtitle = "How can we help you?",
    themeColor = "#667eea",
    onClose 
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    // Initial welcome message
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([{
                id: 1,
                text: subtitle,
                sender: 'bot',
                timestamp: new Date()
            }]);
        }
    }, [isOpen, subtitle, messages.length]);

    // Auto scroll to bottom
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleSendMessage = async () => {
        if (!inputMessage.trim()) return;

        const userMessage = {
            id: Date.now(),
            text: inputMessage,
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setIsTyping(true);

        // Send message to backend
        try {
            const response = await fetch(`/api/v1/chatbot/${nodeId}/message`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: inputMessage,
                    sessionId: `chatbot_${nodeId}_${Date.now()}`
                })
            });

            console.log('📤 Message sent, response status:', response.status);
            
            if (response.ok) {
                const responseText = await response.text();
                console.log('📥 Raw response:', responseText);
                
                const data = responseText ? JSON.parse(responseText) : {};
                console.log('📋 Parsed response:', data);
                
                // Just stop typing indicator, no automatic response
                setIsTyping(false);
            } else {
                console.error('❌ Response not ok:', response.status, response.statusText);
                setIsTyping(false);
            }
        } catch (error) {
            console.error('Error sending message:', error);
            setIsTyping(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    console.log('🤖 FloatingChatbot render:', { isVisible, nodeId, title });

    if (!isVisible) {
        console.log('🚫 FloatingChatbot not visible, returning null');
        return null;
    }

    console.log('✅ FloatingChatbot rendering widget');
    return (
        <div className="floating-chatbot">
            {/* Chat Button */}
            {!isOpen && (
                <div 
                    className="chatbot-button"
                    style={{ backgroundColor: themeColor }}
                    onClick={() => setIsOpen(true)}
                >
                    <i className="fas fa-comment"></i>
                </div>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="chatbot-window">
                    {/* Header */}
                    <div 
                        className="chatbot-header"
                        style={{ backgroundColor: themeColor }}
                    >
                        <div className="chatbot-info">
                            <div className="chatbot-title">{title}</div>
                            <div className="chatbot-status">
                                <span className="status-dot"></span>
                                Online
                            </div>
                        </div>
                        <div className="chatbot-controls">
                            <button 
                                className="minimize-btn"
                                onClick={() => setIsOpen(false)}
                            >
                                <i className="fas fa-minus"></i>
                            </button>
                            {onClose && (
                                <button 
                                    className="close-btn"
                                    onClick={onClose}
                                >
                                    <i className="fas fa-times"></i>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="chatbot-messages">
                        {messages.map((message) => (
                            <div 
                                key={message.id}
                                className={`message ${message.sender}`}
                            >
                                <div className="message-content">
                                    {message.text}
                                </div>
                                <div className="message-time">
                                    {message.timestamp.toLocaleTimeString([], { 
                                        hour: '2-digit', 
                                        minute: '2-digit' 
                                    })}
                                </div>
                            </div>
                        ))}
                        
                        {isTyping && (
                            <div className="message bot">
                                <div className="message-content typing-indicator">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="chatbot-input">
                        <textarea
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Type your message..."
                            rows="1"
                        />
                        <button 
                            onClick={handleSendMessage}
                            disabled={!inputMessage.trim()}
                            style={{ color: themeColor }}
                        >
                            <i className="fas fa-paper-plane"></i>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FloatingChatbot;