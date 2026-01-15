'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

import { MarkdownRenderer } from '@/lib/markdown';
import { cn } from '@/lib/utils';
import { ResolverMessage } from '@/hooks/useResolver';

import CopyButton from '../common/copy-button';
import { Button } from '../ui/button';

interface ResolverChatBubbleProps {
  message: ResolverMessage;
  onRevert?: (id: string | number) => void;
  onRetry?: () => void;
  isSelected?: boolean;
}

export function ResolverChatBubble({
  message,
  onRevert,
  onRetry,
  isSelected,
}: ResolverChatBubbleProps) {
  const isBot = message.user === 'AI';
  const isError = !!message.isError;
  const isLoading =
    (message.content === '' || message.content === 'loading') && !message.done;

  const hasReasoning = message.reasoning && message.reasoning.trim().length > 0;
  const shouldShowReasoning =
    hasReasoning && (message.content === '' || message.content === 'loading');
  const showSkeleton = isLoading && !isError && !hasReasoning;

  // State for tracking content chunks and animations
  const [isStreaming, setIsStreaming] = useState(false);
  const previousContentRef = useRef<string>('');
  const chunkTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // State for tracking reasoning animations
  const [isReasoningStreaming, setIsReasoningStreaming] = useState(false);
  const previousReasoningRef = useRef<string>('');
  const reasoningTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Function to extract heading from reasoning content
  const getReasoningHeading = (reasoning: string): string => {
    if (!reasoning) return 'AI Reasoning';
    const headerMatches = reasoning.match(/^#{2,4}\s+(.+)$/gm);
    if (headerMatches && headerMatches.length > 0) {
      const lastHeader = headerMatches[headerMatches.length - 1];
      const headerText = lastHeader.match(/^#{2,4}\s+(.+)$/);
      if (headerText) return headerText[1].trim();
    }
    const boldMatches = reasoning.match(/\*\*(.+?)\*\*/g);
    if (boldMatches && boldMatches.length > 0) {
      const lastBold = boldMatches[boldMatches.length - 1];
      const boldText = lastBold.match(/\*\*(.+?)\*\*/);
      if (boldText) return boldText[1].trim();
    }
    return 'AI Reasoning';
  };

  // Content streaming animation effect
  useEffect(() => {
    if (
      !isBot ||
      !message.content ||
      message.done ||
      message.content === 'loading'
    ) {
      setIsStreaming(false);
      return;
    }
    const currentContent = message.content;
    const previousContent = previousContentRef.current;

    if (currentContent.length > previousContent.length) {
      setIsStreaming(true);
      if (chunkTimeoutRef.current) clearTimeout(chunkTimeoutRef.current);
      chunkTimeoutRef.current = setTimeout(() => setIsStreaming(false), 1000);
    }
    previousContentRef.current = currentContent;
    return () => {
      if (chunkTimeoutRef.current) clearTimeout(chunkTimeoutRef.current);
    };
  }, [message.content, isBot, message.done]);

  // Reasoning streaming effect
  useEffect(() => {
    if (!isBot || !message.reasoning || message.done) {
      setIsReasoningStreaming(false);
      return;
    }
    const currentReasoning = message.reasoning;
    const previousReasoning = previousReasoningRef.current;

    if (currentReasoning.length > previousReasoning.length) {
      setIsReasoningStreaming(true);
      if (reasoningTimeoutRef.current)
        clearTimeout(reasoningTimeoutRef.current);
      reasoningTimeoutRef.current = setTimeout(
        () => setIsReasoningStreaming(false),
        2000
      );
    }
    previousReasoningRef.current = currentReasoning;
    return () => {
      if (reasoningTimeoutRef.current)
        clearTimeout(reasoningTimeoutRef.current);
    };
  }, [message.reasoning, isBot, message.done]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn('flex mb-8', isBot ? 'justify-start' : 'justify-end')}
    >
      <div
        className={cn(
          'flex flex-col gap-2 rounded-2xl py-1 px-5',
          isBot ? 'bg-white' : 'bg-[#F5F8FF] border border-[#DFEAFF]'
        )}
      >
        <div className="flex items-start gap-4">
          {isBot && !showSkeleton && (
            <div className="shrink-0 mt-1">
              <Image
                src="/favicon.svg"
                alt="Compl-AI"
                width={32}
                height={32}
                className="rounded-full"
              />
            </div>
          )}

          <div className="flex-1 flex flex-col gap-2 min-w-0">
            {/* Loading Skeleton (GIF Style) */}
            {showSkeleton && (
              <div className="flex items-center gap-2 h-10">
                <Image
                  unoptimized
                  width={40}
                  height={40}
                  src="/loading-anime-circle.gif"
                  alt="Loading..."
                  className="w-10 h-10"
                />
                <span className="text-gray-600 text-lg">Thinking...</span>
              </div>
            )}

            {/* Reasoning Title Bar (Main Chat Style) */}
            {isBot && shouldShowReasoning && (
              <motion.div
                className="mb-2 border border-gray-200 rounded-lg overflow-hidden"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="w-full flex items-center justify-between p-3 bg-gray-50 relative overflow-hidden">
                  {isReasoningStreaming && (
                    <motion.div
                      className="absolute inset-0"
                      initial={{ x: '-100%' }}
                      animate={{ x: '100%' }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatDelay: 1,
                        ease: 'easeInOut',
                      }}
                      style={{
                        background:
                          'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
                        pointerEvents: 'none',
                      }}
                    />
                  )}
                  <div className="flex items-center gap-2 relative z-10">
                    <motion.svg
                      className="h-4 w-4 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      />
                    </motion.svg>
                    <span className="text-sm font-medium text-gray-700">
                      {getReasoningHeading(message.reasoning!)}
                    </span>
                    {isReasoningStreaming && (
                      <span className="text-xs text-blue-600 animate-pulse">
                        Thinking...
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Error State */}
            {isError ? (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
                <p className="font-semibold mb-1">AI Error</p>
                <p>{message.errorChunk || message.content}</p>
                {onRetry && (
                  <Button
                    onClick={onRetry}
                    variant="outline"
                    size="sm"
                    className="mt-2 border-red-200 text-red-700 hover:bg-red-100"
                  >
                    Retry
                  </Button>
                )}
              </div>
            ) : (
              <div className="relative">
                {!isLoading || hasReasoning ? (
                  <div className="text-sm text-[#39393A] leading-relaxed">
                    <MarkdownRenderer content={message.content} />
                    {isStreaming && (
                      <motion.div
                        className="absolute inset-0 bg-blue-50/20 pointer-events-none"
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      />
                    )}
                  </div>
                ) : null}
              </div>
            )}

            {/* Actions */}
            {isBot && !isLoading && !isError && (
              <div className="flex items-center justify-between mt-3 gap-2">
                <div className="flex items-center gap-2">
                  <CopyButton content={message.content} />
                </div>
                {onRevert && (
                  <Button
                    onClick={() => onRevert(message.id)}
                    className="h-8 px-4 text-xs font-medium rounded-lg"
                  >
                    Use this
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
