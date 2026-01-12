'use client';

import { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import TextareaAutosize from 'react-textarea-autosize';

import { ResolverMessage } from '@/hooks/useResolver';
import { Button } from '@/components/ui/button';

import { ResolverChatBubble } from './resolver-chat-bubble';

interface ResponseChatProps {
  messages: ResolverMessage[];
  onRevert: (id: string | number) => void;
  onRefine: (prompt: string) => void;
  onRetry: () => void;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
  hasMore?: boolean;
  selectedMessageId?: string | number | null;
}

/**
 * Chat-like sidebar for viewing response history and refining responses.
 * Matches Figma design with rounded container, AI bubbles with logo, and user refinement bubbles.
 * Uses MarkdownRenderer for AI responses and CopyButton for copying.
 */
export function ResponseChat({
  messages,
  onRevert,
  onRefine,
  onRetry,
  onLoadMore,
  isLoadingMore,
  hasMore,
  selectedMessageId,
}: ResponseChatProps) {
  const [refineInput, setRefineInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const previousScrollHeight = useRef<number>(0);

  // Auto-scroll to bottom only when new user message is sent or initial load
  // (We use a more precise check to avoid jumping when loading older messages)
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (
      lastMessage?.user === 'USER' ||
      (messages.length > 0 && !isLoadingMore)
    ) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, isLoadingMore]);

  // Maintain scroll position after loading more messages
  useEffect(() => {
    if (isLoadingMore && scrollContainerRef.current) {
      previousScrollHeight.current = scrollContainerRef.current.scrollHeight;
    }
  }, [isLoadingMore]);

  useEffect(() => {
    if (
      !isLoadingMore &&
      previousScrollHeight.current > 0 &&
      scrollContainerRef.current
    ) {
      const el = scrollContainerRef.current;
      const heightDifference = el.scrollHeight - previousScrollHeight.current;
      if (heightDifference > 0) {
        el.scrollTop = heightDifference;
      }
      previousScrollHeight.current = 0;
    }
  }, [messages.length, isLoadingMore]);

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;

    if (el.scrollTop === 0 && hasMore && !isLoadingMore && onLoadMore) {
      onLoadMore();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (refineInput.trim()) {
      onRefine(refineInput.trim());
      setRefineInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter, allow Shift+Enter for new line
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (refineInput.trim()) {
        onRefine(refineInput.trim());
        setRefineInput('');
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Scrollable Message Area */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-3 py-4"
      >
        <div>
          {/* Loading indicator at top */}
          {isLoadingMore && (
            <div className="flex justify-center py-4">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#04338B] border-t-transparent" />
            </div>
          )}

          {messages.map((message, index) => (
            <ResolverChatBubble
              key={message.id}
              message={message}
              onRevert={onRevert}
              onRetry={index === messages.length - 1 ? onRetry : undefined}
              isSelected={selectedMessageId === message.id}
            />
          ))}
          {/* Auto-scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Refine Input - Fixed at bottom */}
      <div className="p-4 border-t border-[#DFEAFF]">
        <form onSubmit={handleSubmit} className="relative">
          <div className="bg-[#EDEDED] rounded-[17px] px-5 py-4 pr-16 flex items-center">
            <TextareaAutosize
              value={refineInput}
              onChange={(e) => setRefineInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Refine the Draft e.g., "Add apology", "Make it more formal"`}
              minRows={1}
              maxRows={4}
              className="min-h-[24px] max-h-[100px] w-full flex-1 resize-none bg-transparent text-sm text-[#39393A] placeholder:text-[#73726D]"
              style={{
                outline: 'none',
                border: 'none',
                boxShadow: 'none',
              }}
            />
          </div>

          <Button
            type="submit"
            variant={refineInput.trim() === '' ? 'ghost' : 'default'}
            size="icon"
            className={`absolute right-6 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full transition-all duration-200 ${
              refineInput.trim() === ''
                ? 'bg-transparent border border-gray-300'
                : 'bg-gradient-to-r from-[#020F26] to-[#07378C]'
            }`}
          >
            <Send
              className="h-4 w-4"
              stroke={refineInput.trim() === '' ? 'gray' : 'white'}
            />
          </Button>
        </form>
      </div>
    </div>
  );
}
