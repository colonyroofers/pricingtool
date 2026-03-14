import React, { useState, useRef, useEffect } from 'react';

export default function AIAssistant({ currentModule, currentEstimate, currentUser }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const bubbleRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const handleEscapeKey = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscapeKey);
    return () => window.removeEventListener('keydown', handleEscapeKey);
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: inputValue,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputValue,
          context: {
            currentModule,
            currentEstimate,
            userRole: currentUser?.role,
            market: currentUser?.market,
          },
          history: messages,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: data.content || data.message || 'No response received',
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setError(`Failed to get response: ${err.message}`);
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: `Error: ${err.message}. Please try again.`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Inline styles matching project conventions
  const styles = {
    bubble: {
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      width: '48px',
      height: '48px',
      borderRadius: '50%',
      backgroundColor: '#E30613',
      border: 'none',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 4px 12px rgba(227, 6, 19, 0.3)',
      zIndex: 999,
      transition: 'all 0.3s ease',
      animation: isOpen ? 'none' : 'pulse 2s infinite',
    },
    bubbleHover: {
      transform: 'scale(1.1)',
      boxShadow: '0 6px 16px rgba(227, 6, 19, 0.4)',
    },
    chatIcon: {
      width: '24px',
      height: '24px',
      fill: 'white',
    },
    panel: {
      position: 'fixed',
      bottom: 0,
      right: 0,
      top: 0,
      width: window.innerWidth < 768 ? '100%' : '320px',
      backgroundColor: 'white',
      boxShadow: '-2px 0 8px rgba(0, 0, 0, 0.1)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      animation: 'slideIn 0.3s ease-out',
      transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
      transition: 'transform 0.3s ease-out',
      pointerEvents: isOpen ? 'auto' : 'none',
    },
    header: {
      padding: '16px',
      borderBottom: '1px solid #e0e0e0',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: '#f9f9f9',
    },
    headerTitle: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#1a1a1a',
      margin: 0,
    },
    closeButton: {
      background: 'none',
      border: 'none',
      fontSize: '20px',
      cursor: 'pointer',
      color: '#666',
      padding: '4px 8px',
    },
    messagesContainer: {
      flex: 1,
      overflowY: 'auto',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    },
    contextBar: {
      padding: '12px 16px',
      backgroundColor: '#f0f0f0',
      borderTop: '1px solid #e0e0e0',
      fontSize: '12px',
      color: '#666',
      maxHeight: '60px',
      overflowY: 'auto',
    },
    message: {
      padding: '12px 14px',
      borderRadius: '8px',
      maxWidth: '85%',
      wordWrap: 'break-word',
      fontSize: '14px',
      lineHeight: '1.4',
    },
    userMessage: {
      alignSelf: 'flex-end',
      backgroundColor: '#001a4d',
      color: 'white',
      marginLeft: '15%',
    },
    assistantMessage: {
      alignSelf: 'flex-start',
      backgroundColor: '#f0f0f0',
      color: '#1a1a1a',
      marginRight: '15%',
    },
    typingIndicator: {
      display: 'flex',
      gap: '4px',
      alignItems: 'center',
      padding: '12px 14px',
      backgroundColor: '#f0f0f0',
      borderRadius: '8px',
      maxWidth: '85%',
    },
    typingDot: {
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      backgroundColor: '#999',
      animation: 'bounce 1.4s infinite',
    },
    inputArea: {
      padding: '12px',
      borderTop: '1px solid #e0e0e0',
      display: 'flex',
      gap: '8px',
      backgroundColor: '#fafafa',
    },
    input: {
      flex: 1,
      padding: '10px 12px',
      border: '1px solid #ddd',
      borderRadius: '6px',
      fontSize: '14px',
      fontFamily: 'inherit',
      resize: 'none',
      maxHeight: '60px',
    },
    sendButton: {
      padding: '10px 16px',
      backgroundColor: '#E30613',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '600',
      transition: 'background-color 0.2s',
    },
    sendButtonHover: {
      backgroundColor: '#c10410',
    },
    sendButtonDisabled: {
      backgroundColor: '#ccc',
      cursor: 'not-allowed',
    },
  };

  // Add CSS animation keyframes
  const styleSheet = document.createElement('style');
  if (!document.querySelector('style[data-ai-assistant]')) {
    styleSheet.setAttribute('data-ai-assistant', 'true');
    styleSheet.textContent = `
      @keyframes pulse {
        0% {
          box-shadow: 0 4px 12px rgba(227, 6, 19, 0.3);
        }
        50% {
          box-shadow: 0 4px 20px rgba(227, 6, 19, 0.5);
        }
        100% {
          box-shadow: 0 4px 12px rgba(227, 6, 19, 0.3);
        }
      }

      @keyframes slideIn {
        from {
          transform: translateX(100%);
        }
        to {
          transform: translateX(0);
        }
      }

      @keyframes bounce {
        0%, 60%, 100% {
          transform: translateY(0);
        }
        30% {
          transform: translateY(-8px);
        }
      }
    `;
    document.head.appendChild(styleSheet);
  }

  return (
    <>
      <button
        ref={bubbleRef}
        style={styles.bubble}
        onMouseEnter={(e) => {
          Object.assign(e.currentTarget.style, styles.bubbleHover);
        }}
        onMouseLeave={(e) => {
          Object.assign(e.currentTarget.style, { transform: 'scale(1)' });
        }}
        onClick={() => setIsOpen(!isOpen)}
        title="Open Colony AI Assistant"
        aria-label="Open AI Assistant"
      >
        <svg
          style={styles.chatIcon}
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
        </svg>
      </button>

      {isOpen && (
        <div style={styles.panel}>
          <div style={styles.header}>
            <h2 style={styles.headerTitle}>Colony AI Assistant</h2>
            <button
              style={styles.closeButton}
              onClick={() => setIsOpen(false)}
              aria-label="Close assistant"
            >
              ✕
            </button>
          </div>

          {(currentModule || currentEstimate || currentUser) && (
            <div style={styles.contextBar}>
              {currentModule && <div>Module: {currentModule}</div>}
              {currentEstimate && <div>Estimate ID: {currentEstimate}</div>}
              {currentUser && <div>Role: {currentUser.role}</div>}
            </div>
          )}

          <div style={styles.messagesContainer}>
            {messages.length === 0 && (
              <div style={{ ...styles.assistantMessage, alignSelf: 'center', marginRight: 0, marginTop: 'auto', marginBottom: 'auto' }}>
                👋 Hi! I'm the Colony AI Assistant. Ask me about pricing, estimates, or anything else!
              </div>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  ...styles.message,
                  ...(msg.role === 'user' ? styles.userMessage : styles.assistantMessage),
                }}
              >
                {msg.content}
              </div>
            ))}
            {isLoading && (
              <div style={styles.typingIndicator}>
                <div style={{ ...styles.typingDot, animationDelay: '0s' }} />
                <div style={{ ...styles.typingDot, animationDelay: '0.2s' }} />
                <div style={{ ...styles.typingDot, animationDelay: '0.4s' }} />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div style={styles.inputArea}>
            <textarea
              style={styles.input}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything..."
              rows={1}
              disabled={isLoading}
            />
            <button
              style={{
                ...styles.sendButton,
                ...(isLoading || !inputValue.trim() ? styles.sendButtonDisabled : {}),
              }}
              onClick={handleSendMessage}
              disabled={isLoading || !inputValue.trim()}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}
