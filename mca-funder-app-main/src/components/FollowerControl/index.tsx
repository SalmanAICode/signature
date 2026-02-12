import React from 'react';
import { StarIcon as SolidStarIcon } from '@heroicons/react/24/solid';
import { StarIcon as OutlineStarIcon } from '@heroicons/react/24/outline';

import { User } from '@/types/user';
import useAuthStore from '@/lib/store/auth';
import { toast } from 'react-hot-toast';

interface FollowerControlProps {
  followers: User[];
  assignedUser: string;
  assignedManager: string;
  onClick?: (newFollowers: string[]) => void;
}

export const renderFollowerControl = ({ followers, assignedUser, assignedManager, onClick }: FollowerControlProps) => {
  const { user } = useAuthStore();

  const isAssignedUser = user && assignedUser === user._id;
  const isAssignedManager = user && assignedManager === user._id;
  const isExplicitlyFollowing = user && followers.some(follower => follower._id === user._id);
  
  // User is following if they're explicitly in the follower list OR if they're assigned user/manager
  const isFollowing = isExplicitlyFollowing || isAssignedUser || isAssignedManager;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('FollowerControl handleClick called');
    console.log('Current user:', user?._id);
    console.log('Is following:', isFollowing);
    console.log('Is assigned user:', isAssignedUser);
    console.log('Is assigned manager:', isAssignedManager);
    console.log('Followers:', followers);
    
    if (!user) return;
    if (isFollowing) {
      if (isAssignedUser) {
        toast.error('You cannot unfollow yourself, you are assigned user');
        return;
      }
      if (isAssignedManager) {
        toast.error('You cannot unfollow yourself, you are assigned manager');
        return;
      }
      // Unfollow
      const newFollowers = followers.filter(f => f._id !== user._id).map(f => f._id);
      console.log('Unfollowing, new followers:', newFollowers);
      onClick?.(newFollowers);
    } else {
      // Follow (prevent duplicates)
      if (!followers.some(f => f._id === user._id)) {
        const newFollowers = [...followers.map(f => f._id), user._id];
        console.log('Following, new followers:', newFollowers);
        onClick?.(newFollowers);
      }
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-300 ease-in-out group min-w-[80px] inline-flex items-center justify-center
        ${isFollowing ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
      aria-label={isFollowing ? 'Unfollow' : 'Follow'}
      disabled={!!(isFollowing && (isAssignedUser || isAssignedManager))}
    >
      {isFollowing ? (
        <SolidStarIcon className="w-5 h-5 text-yellow-500 mr-1" />
      ) : (
        <OutlineStarIcon className="w-5 h-5 text-gray-400 mr-1" />
      )}
      <span>{isFollowing ? (isAssignedUser || isAssignedManager ? 'Followed' : 'Unfollow') : 'Follow'}</span>
    </button>
  );
};

export const parseFollowerList = (value: any) => {
  let followers: User[] = [];
  if (typeof value === 'string') {
    try {
      followers = JSON.parse(value);
    } catch {
      followers = [];
    }
  } else {
    followers = Array.isArray(value) ? value : [];
  }
  return followers;
};