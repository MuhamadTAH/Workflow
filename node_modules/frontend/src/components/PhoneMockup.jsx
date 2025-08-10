import React from 'react';

const PhoneMockup = ({ conversation, view }) => {
    return (
        <div className="phone-mockup" aria-hidden="true">
            <div className="phone-notch"></div>
            <div className="phone-screen">
                <div className="chat-container">
                    <header className="chat-header">
                        <i className="fa-solid fa-arrow-left"></i>
                        <div className="chat-header-user">
                            <div className="chat-avatar">
                                <i className="fa-solid fa-user-circle"></i>
                            </div>
                            <span className="chat-username">workflow_user</span>
                        </div>
                        <div className="chat-header-actions">
                            <i className="fa-solid fa-phone"></i>
                            <i className="fa-solid fa-video"></i>
                        </div>
                    </header>
                    <div className="chat-body">
                        {conversation.map(msg => (
                            <div key={msg.id} className={`chat-message ${msg.sender === 'me' ? 'sent' : 'received'}`}>
                                <p>{msg.text}</p>
                            </div>
                        ))}
                        {conversation.length === 1 && view === 'login' && (
                            <div className="chat-actions">
                                <button className="chat-action-btn">Sign Up</button>
                                <button className="chat-action-btn">Forgot Password</button>
                            </div>
                        )}
                    </div>
                    <footer className="chat-input-area">
                        <div className="chat-input-wrapper">
                            <i className="fa-regular fa-face-smile"></i>
                            <input type="text" placeholder="Message..." readOnly />
                            <i className="fa-solid fa-microphone"></i>
                            <i className="fa-regular fa-image"></i>
                        </div>
                    </footer>
                </div>
            </div>
        </div>
    );
};

export default PhoneMockup;