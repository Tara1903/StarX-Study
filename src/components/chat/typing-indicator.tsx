"use client";
import { useEffect, useState } from 'react';

interface TypingIndicatorProps {
  users: string[];
}

export function TypingIndicator({ users }: TypingIndicatorProps) {
  if (users.length === 0) return null;

  const text = users.length === 1 
    ? `${users[0]} is typing...`
    : users.length === 2 
      ? `${users[0]} and ${users[1]} are typing...`
      : 'Several people are typing...';

  return (
    <div className="text-xs text-muted-foreground mt-1 px-2 h-4 flex items-center">
      {text}
    </div>
  );
}
