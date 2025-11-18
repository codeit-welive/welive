/**
 * ChatInput 컴포넌트
 * @description 메시지 입력창
 */

import { useState, type FormEvent, type KeyboardEvent, type ChangeEvent } from 'react';

interface ChatInputProps {
  /**
   * 메시지 전송 함수
   */
  onSend: (content: string) => void;

  /**
   * 전송 비활성화 여부
   */
  disabled?: boolean;

  /**
   * Placeholder 텍스트
   */
  placeholder?: string;

  /**
   * 타이핑 이벤트 전송 함수
   */
  onTyping?: (isTyping: boolean) => void;
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = '메시지를 입력하세요...',
  onTyping,
}: ChatInputProps) {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;

    // 메시지 전송 시 타이핑 중지 이벤트 전송
    if (onTyping) {
      onTyping(false);
    }

    onSend(trimmedMessage);
    setMessage(''); // 전송 후 입력창 비우기
  };

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setMessage(newValue);

    // 타이핑 이벤트 전송
    if (onTyping) {
      if (newValue.length > 0) {
        onTyping(true); // 입력 중
      } else {
        onTyping(false); // 입력 중지
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Shift + Enter: 줄바꿈
    // Enter만: 전송
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t bg-white p-4">
      <div className="flex gap-2">
        <textarea
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          className="flex-1 px-4 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          rows={1}
          style={{
            minHeight: '44px',
            maxHeight: '120px',
          }}
        />
        <button
          type="submit"
          disabled={disabled || !message.trim()}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          전송
        </button>
      </div>
      <p className="text-xs text-gray-500 mt-2">
        Enter: 전송 | Shift + Enter: 줄바꿈
      </p>
    </form>
  );
}
