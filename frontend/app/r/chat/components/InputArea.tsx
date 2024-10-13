import React, { useState, useRef, useEffect } from 'react';

interface InputAreaProps {
  onSendMessage: (message: string) => void;
  isAiTyping?: boolean;
}

const InputArea: React.FC<InputAreaProps> = ({ onSendMessage, isAiTyping = false }) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isAiTyping) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="input-area">
      <textarea
        ref={textareaRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type your message here..."
        rows={1}
        disabled={isAiTyping}
      />
      <button type="submit" disabled={!message.trim() || isAiTyping}>
        Send
      </button>
    </form>
  );
};

export default InputArea;

