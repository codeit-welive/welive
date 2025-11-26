export interface Notification {
  notificationId: string;
  content: string;
  notificationType: string;
  notifiedAt: string;
  isChecked: boolean;
  complaintId?: string;
  noticeId?: string;
  pollId?: string;
}

interface NotificationPanelProps {
  notifications: Notification[];
  onClose: () => void;
  onMarkAsRead: (notificationId: string) => Promise<void>;
}

// 상대 시간 포맷 함수는 그대로
function getRelativeTime(isoString: string) {
  const now = new Date();
  const date = new Date(isoString);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diff < 60) return '방금 전';
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}일 전`;

  return date.toLocaleDateString('ko-KR');
}

export default function NotificationPanel({
  notifications,
  onClose,
  onMarkAsRead,
}: NotificationPanelProps) {
  const handleClick = async (notificationId: string) => {
    try {
      await onMarkAsRead(notificationId);
      // 상태 업데이트는 부모(onMarkAsRead) / store에서 처리하므로 여기서는 끝
    } catch (error) {
      console.error('알림 처리 실패:', error);
    }
  };

  return (
    <div className='absolute top-12 -right-4 z-20 w-[320px] rounded-xl border border-gray-200 bg-white p-5 shadow-md'>
      {notifications.length === 0 ? (
        <p className='py-4 text-center text-sm text-gray-400'>새로운 알림이 없습니다</p>
      ) : (
        notifications.map((alarm) => (
          <div
            key={alarm.notificationId}
            className={`mb-4 flex cursor-pointer flex-col gap-1 border-b border-gray-100 pb-3 last:border-b-0 ${alarm.isChecked ? 'opacity-50' : ''}`}
            onClick={() => handleClick(alarm.notificationId)}
          >
            <p className='text-sm text-gray-800'>{alarm.content}</p>
            <span className='text-xs text-gray-400'>{getRelativeTime(alarm.notifiedAt)}</span>
          </div>
        ))
      )}
      <button
        onClick={onClose}
        className='bg-main mt-4 w-full rounded-lg py-1.5 text-sm text-white'
      >
        닫기
      </button>
    </div>
  );
}
