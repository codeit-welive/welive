'use client';

import { useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import NotificationPanel from './NotificationPanel';
import axiosInstance from './lib/axios';
import { useAuthStore } from './store/auth.store';
import { useRouter } from 'next/router';

// 전역 알림 Store
import { useNotificationStore } from '@/shared/store/notify.store';

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

export default function Navibar() {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  // Store 기반
  const notifications = useNotificationStore((s) => s.notifications);
  const removeNotification = useNotificationStore((s) => s.removeNotification);

  const user = useAuthStore((state) => state.user);
  const clearUser = useAuthStore((state) => state.clearUser);
  const router = useRouter();
  const role = useAuthStore((state) => state.user?.role);

  const unreadCount = notifications.filter((n) => !n.isChecked).length;

  const getLinkByRole = (role?: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return '/super-admin';
      case 'ADMIN':
        return '/admin/notice';
      case 'USER':
        return '/resident/notice';
      default:
        return '/';
    }
  };

  async function handleLogout() {
    try {
      const res = await axiosInstance.post('/auth/logout');
      if (res.status === 200 || res.status === 204) {
        clearUser();
        router.replace('/');
      } else {
        alert('로그아웃에 실패했습니다.');
      }
    } catch (error) {
      console.error('로그아웃 실패:', error);
      alert('로그아웃 중 오류가 발생했습니다.');
    }
  }

  const toggleNotification = () => setIsNotificationOpen((prev) => !prev);

  /* 읽음 처리 */
  async function markAsRead(notificationId: string) {
    try {
      await axiosInstance.patch(`/notifications/${notificationId}/read`);
      removeNotification(notificationId);
    } catch (error) {
      console.error('알림읽음 처리함수 에러', error);
      throw error;
    }
  }

  return (
    <div className='z-10 h-[72px] border-b border-gray-200 px-[50px] py-[18px]'>
      <div className='flex h-full items-center justify-between'>
        {/* 메인로고 */}
        <Link href={getLinkByRole(role)}>
          <Image src='/img/logo.svg' alt='WeLive Logo' width={81} height={30} priority />
        </Link>

        <div className='flex items-center justify-center gap-10'>
          {/* 알림 */}
          <div className='relative'>
            <Image
              src='/img/Bell.svg'
              alt='알림'
              width={24}
              height={24}
              priority
              className='cursor-pointer text-gray-500'
              onClick={toggleNotification}
            />
            {unreadCount > 0 && (
              <span className='absolute bottom-0 left-5 h-2 w-2 -translate-x-1/2 translate-y-1/2 rounded-full border-2 border-white bg-red-500' />
            )}

            {isNotificationOpen && (
              <NotificationPanel
                notifications={notifications}
                onClose={toggleNotification}
                onMarkAsRead={markAsRead}
              />
            )}
          </div>

          {/* 유저 정보 */}
          <div className='flex items-center gap-2.5'>
            <Image
              src={user?.avatar ?? '/img/userImage.svg'}
              alt='유저 이미지'
              width={36}
              height={36}
              priority
              unoptimized
              className='rounded-full object-cover'
            />
            <p className='text-gray-500'>{user?.name ?? '사용자'}</p>
          </div>

          {/* 로그아웃 */}
          <button className='text-gray-300 hover:text-gray-500' onClick={handleLogout}>
            로그아웃
          </button>
        </div>
      </div>
    </div>
  );
}
