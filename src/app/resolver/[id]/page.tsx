'use client';

import { useUserContext } from '@/contexts/user-context';
import { useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { ResponseChat } from '@/components/resolver/response-chat';
import { ResponseDisplay } from '@/components/resolver/response-display';
import { ResponseHeader } from '@/components/resolver/response-header';
import { ResponseKeyPoints } from '@/components/resolver/response-key-points';
import { ResponseTab, ResponseTabs } from '@/components/resolver/response-tabs';
import { ResolverMessage, useResolver } from '@/hooks/useResolver';

export default function ResolverResponsePage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { user } = useUserContext();
  const {
    sendMessage,
    useComplaintDetails,
    useKeyPoints,
    useInfiniteMessagesList,
  } = useResolver();

  // Queries
  const { data: details, isLoading: isLoadingDetails } = useComplaintDetails(
    id as string
  );
  const { data: keyPointsData, isLoading: isLoadingKeyPoints } = useKeyPoints(
    id as string
  );

  const {
    data: infiniteMessagesData,
    isLoading: isLoadingMessages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteMessagesList(id as string, 30);

  const [chatMessages, setChatMessages] = useState<ResolverMessage[]>([]);
  const [activeTab, setActiveTab] = useState<ResponseTab>('chat');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [hasTriggeredAuto, setHasTriggeredAuto] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<
    string | number | null
  >(null);

  // Map infinite pages to the chatMessages state.
  const fetchedMessages = useMemo(() => {
    if (!infiniteMessagesData) return [];

    // Flat map all pages and map to ResolverMessage format
    // InfiniteQuery pages are in order of fetch, but results within pages are descending (newer first)
    // Actually, usually messages are fetched 'before_seq', so the first page is the newest.
    // We reverse everything to show oldest at top for display.
    const allMsgs: ResolverMessage[] = (infiniteMessagesData.pages || [])
      .flatMap(
        (page: import('@/hooks/useResolver').MessageListResponse) =>
          page.results
      )
      .filter((m: import('@/hooks/useResolver').Message) => m.role !== 'system')
      .map((m: import('@/hooks/useResolver').Message) => ({
        id: m.id,
        complaint: id as string,
        user: m.role === 'assistant' ? 'AI' : 'USER',
        content: m.content,
        created_at: m.created_at,
        done: true,
      }));

    // Results from API are usually sorted newest first (descending)
    // We want to sort them ascending for the chat UI.
    return [...allMsgs].sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }, [infiniteMessagesData, id]);

  // Sync fetched messages with local chatMessages state
  useEffect(() => {
    // Only sync if we're not currently streaming and we actually have fetched data
    if (!isStreaming && fetchedMessages.length > 0) {
      setChatMessages((prev) => {
        // If we have no local messages, just take the fetched ones
        if (prev.length === 0) return fetchedMessages;

        // Check if the latest message in fetched exists in our local list
        // This helps determine if the server has caught up with our local updates
        const latestFetched = fetchedMessages[fetchedMessages.length - 1];
        const existsInLocal = prev.some((m) => m.id === latestFetched.id);

        // If local state has more messages and the latest fetched message isn't even the last one we have
        // it means the server response is still stale relative to what the user just sent.
        if (prev.length > fetchedMessages.length && !existsInLocal) {
          return prev;
        }

        // Otherwise, prioritize official data but keep local placeholders if they are newer
        // For simplicity, if lengths match or server has more, take server data
        return fetchedMessages;
      });
    }
  }, [fetchedMessages, isStreaming]);

  const handleRefine = useCallback(
    async (prompt: string) => {
      const userMessage: ResolverMessage = {
        id: `user-${Date.now()}`,
        complaint: id as string,
        user: 'USER',
        content: prompt,
        created_at: new Date().toISOString(),
        done: true,
      };

      const aiMessageId = `ai-${Date.now()}`;
      const placeholderAiMessage: ResolverMessage = {
        id: aiMessageId,
        complaint: id as string,
        user: 'AI',
        content: '',
        reasoning: '',
        created_at: new Date().toISOString(),
        done: false,
      };

      setChatMessages((prev) => [...prev, userMessage, placeholderAiMessage]);
      setIsStreaming(true);
      setStreamingContent('');
      setSelectedMessageId(null);

      try {
        const aiResponse = await sendMessage({
          complaintId: id as string,
          message: prompt,
          onChunkUpdate: (chunk) => {
            setChatMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last && last.id === aiMessageId) {
                return [
                  ...prev.slice(0, -1),
                  {
                    ...last,
                    content: chunk.content || last.content,
                    reasoning: chunk.reasoning || last.reasoning,
                    done: chunk.done,
                  },
                ];
              }
              return prev;
            });

            if (chunk.content) {
              setStreamingContent(chunk.content);
            }
          },
        });

        setChatMessages((prev) => {
          const index = prev.findIndex((m) => m.id === aiMessageId);
          if (index !== -1) {
            const newMessages = [...prev];
            newMessages[index] = aiResponse;
            return newMessages;
          }
          return prev;
        });
      } catch (error: unknown) {
        console.error('Failed to refine response:', error);
        const err = error as Error;
        setChatMessages((prev) => {
          const index = prev.findIndex((m) => m.id === aiMessageId);
          if (index !== -1) {
            const newMessages = [...prev];
            newMessages[index] = {
              ...newMessages[index],
              isError: true,
              errorChunk: err.message || 'An error occurred',
              done: true,
            };
            return newMessages;
          }
          return prev;
        });
      } finally {
        setIsStreaming(false);
        setStreamingContent('');
        // Invalidate the message list query to pull official data from server
        queryClient.invalidateQueries({
          queryKey: ['complaintMessages', 'infinite', id as string],
        });
      }
    },
    [id, sendMessage, queryClient]
  );

  // No manual sync needed anymore with useInfiniteQuery memo
  // No manual fetch logic needed anymore with useInfiniteQuery memo

  const handleLoadMoreMessages = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Auto-trigger first analysis if no messages exist
  useEffect(() => {
    if (
      !isLoadingMessages &&
      !isLoadingDetails &&
      infiniteMessagesData &&
      details &&
      !hasTriggeredAuto
    ) {
      // Check if there are no user/assistant messages across all pages
      const hasMessages = infiniteMessagesData.pages.some((page) =>
        page.results.some((m) => m.role !== 'system')
      );

      if (!hasMessages) {
        setHasTriggeredAuto(true);
        const initialPrompt =
          details.context?.system_prompt ||
          'Analyze this complaint and provide a professional response.';
        handleRefine(initialPrompt);
      } else {
        setHasTriggeredAuto(true);
      }
    }
  }, [
    isLoadingMessages,
    isLoadingDetails,
    infiniteMessagesData,
    details,
    hasTriggeredAuto,
    handleRefine,
  ]);

  const handleRevert = (id: string | number) => {
    setSelectedMessageId(id);
  };

  // Get the latest AI response for display
  const latestAiMessage = [...chatMessages]
    .reverse()
    .find((m) => m.user === 'AI');

  // Use streaming content if actively streaming, otherwise use latest message
  // If a specific message is selected (via Revert), show that, otherwise show latest
  const activeContent = useMemo(() => {
    if (isStreaming) return streamingContent;

    if (selectedMessageId) {
      const selected = chatMessages.find((m) => m.id === selectedMessageId);
      if (selected) return selected.content;
    }

    return latestAiMessage?.content || details?.description || '';
  }, [
    isStreaming,
    streamingContent,
    selectedMessageId,
    chatMessages,
    latestAiMessage,
    details?.description,
  ]);

  const handleExport = async () => {
    try {
      const { pdf } = await import('@react-pdf/renderer');
      const { PdfDocument } = await import(
        '@/components/resolver/pdf-document'
      );

      let logoData: string | null = null;
      if (user?.company_picture) {
        try {
          // Use the proxy-image API route to bypass CORS
          const response = await fetch(
            `/api/proxy-image?url=${encodeURIComponent(user.company_picture)}`
          );
          if (!response.ok) throw new Error('Proxy fetch failed');
          const blob = await response.blob();
          logoData = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        } catch (e) {
          console.error('Error proxying company logo:', e);
          logoData = null; // Fallback to default in PdfDocument
        }
      }

      const blob = await pdf(
        <PdfDocument content={activeContent} logo={logoData} />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `compliance-report-${new Date().getTime()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export PDF:', error);
    }
  };

  const handleRetry = () => {
    const lastMessage = chatMessages[chatMessages.length - 1];
    if (lastMessage?.user === 'AI' && lastMessage.isError) {
      const prevUserMessage = chatMessages[chatMessages.length - 2];
      if (prevUserMessage?.user === 'USER') {
        // Remove both and re-refine
        setChatMessages((prev) => prev.slice(0, -2));
        handleRefine(prevUserMessage.content);
      }
    }
  };

  if ((isLoadingDetails || isLoadingMessages) && chatMessages.length === 0) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#04338B] border-t-transparent" />
          <p className="text-[#04338B] font-medium">
            Loading complaint details...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-white overflow-hidden font-poppins">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col px-6 py-4  overflow-hidden">
        {/* Header */}
        <div className="mb-3">
          <ResponseHeader />
        </div>

        <div className="flex h-full bg-[#F5F8FF] p-2 rounded-xl gap-3">
          {/* Response Display - Always show */}
          <ResponseDisplay content={activeContent} onExport={handleExport} />

          {/* Right Panel: Chat or Key Points */}
          <div className="w-[40svw] shrink-0 bg-white rounded-[10px] flex flex-col h-[calc(100vh-100px)] overflow-hidden">
            <div className="p-4 pb-0">
              <ResponseTabs activeTab={activeTab} onTabChange={setActiveTab} />
            </div>

            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {activeTab === 'chat' ? (
                <ResponseChat
                  messages={chatMessages}
                  onRevert={handleRevert}
                  onRefine={handleRefine}
                  onRetry={handleRetry}
                  onLoadMore={handleLoadMoreMessages}
                  isLoadingMore={isFetchingNextPage}
                  hasMore={hasNextPage}
                  selectedMessageId={selectedMessageId}
                />
              ) : (
                <ResponseKeyPoints
                  points={keyPointsData?.key_points || []}
                  isLoading={isLoadingKeyPoints}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
