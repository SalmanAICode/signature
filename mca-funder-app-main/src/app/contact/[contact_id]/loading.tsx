import React from 'react';

export default function Loading() {
  return (
    <div className="p-4 animate-pulse space-y-4">
      <div className="h-6 bg-gray-300 rounded w-1/3" />
      <div className="h-4 bg-gray-300 rounded w-1/2" />
      <div className="h-4 bg-gray-300 rounded w-1/2" />
      <div className="h-4 bg-gray-300 rounded w-1/4" />
    </div>
  );
}
