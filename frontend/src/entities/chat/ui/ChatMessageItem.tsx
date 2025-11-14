/**
 * ChatMessageItem 컴포넌트
 * @description 개별 채팅 메시지를 표시하는 컴포넌트
 */

import type { ChatMessage } from '../api/chat.types';

interface ChatMessageItemProps {
  /**
   * 메시지 데이터
   */
  message: ChatMessage;

  /**
   * 현재 로그인한 사용자 ID
   * @description 내 메시지인지 판단하기 위해 사용
   */
  currentUserId: string;
}

export function ChatMessageItem({ message, currentUserId }: ChatMessageItemProps) {
  const isMyMessage = message.senderId === currentUserId;
  const createdAt = new Date(message.createdAt);

  return (
    <div
      className={`flex w-full mb-4 ${
        isMyMessage ? 'justify-end' : 'justify-start'
      }`}
    >
      <div
        className={`max-w-[70%] ${
          isMyMessage ? 'items-end' : 'items-start'
        } flex flex-col gap-1`}
      >
        {/* 보낸 사람 이름 (상대방 메시지만) */}
        {!isMyMessage && (
          <span className="text-xs text-gray-600 px-2">
            {message.sender.name}
          </span>
        )}

        {/* 메시지 내용 */}
        <div
          className={`px-4 py-2 rounded-2xl ${
            isMyMessage
              ? 'bg-blue-500 text-white rounded-br-sm'
              : 'bg-gray-200 text-gray-800 rounded-bl-sm'
          }`}
        >
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        </div>

        {/* 전송 시간 */}
        <span className="text-xs text-gray-500 px-2">
          {createdAt.toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
    </div>
  );
}
