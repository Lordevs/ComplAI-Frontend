'use client';

import { API_ROUTES } from '@/constants/apiRoutes';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import type { Citation } from '@/types/chat';
import apiCaller, { RequestData } from '@/config/apiCaller';

// Types for Complaints
export interface Complaint {
  id: string;
  subject: string;
  description: string;
  status: 'open' | 'closed' | 'in_progress' | 'resolved' | 'pending';
  created_at: string;
  updated_at: string;
  thread_id: string;
  last_message_at: string;
  last_seq: number;
  // UI helper fields
  type?: 'document' | 'text';
  context?: {
    id: string;
    system_prompt: string;
  };
}

export interface ComplaintListResponse {
  total: number;
  limit: number;
  offset: number;
  results: Complaint[];
}

export interface CreateComplaintPayload {
  subject: string;
  complaint_date: string;
  description: string;
  system_prompt?: string;
  context_text?: string;
  document?: File | Blob;
  document_mime_type?: string;
}

export interface CreateComplaintResponse {
  id: string;
  thread_id: string;
  context_id: string;
  key_points_id: string;
}

export interface ReferenceDocument {
  id: string;
  document_name: string;
  size_bytes: number;
  has_extracted_text: boolean;
}

export interface UploadDocsResponse {
  context_id: string;
  count: number;
  documents: ReferenceDocument[];
}

export interface Thread {
  id: string;
  last_seq: number;
  last_message_at: string;
  created_at: string;
  updated_at: string;
}

export interface Context {
  id: string;
  system_prompt: string;
  context_text: string;
  document_name?: string;
  document_mime_type?: string;
  document_size_bytes?: number;
  extracted_text?: string;
  content_sha256?: string;
  created_at: string;
  updated_at: string;
}

export interface ComplaintDetailsResponse extends Complaint {
  context: Context;
  thread: Thread;
}

export interface Message {
  id: string;
  seq: number;
  role: 'system' | 'user' | 'assistant';
  content: string;
  tool_name?: string;
  tool_call_id?: string;
  parent_id?: string | null;
  model_name?: string;
  input_tokens?: number | null;
  output_tokens?: number | null;
  total_tokens?: number | null;
  created_at: string;
}

export interface MessageListResponse {
  thread_id: string;
  complaint_id: string;
  results: Message[];
  has_more: boolean;
  next_after_seq?: number;
  next_before_seq?: number;
}

export interface KeyPoint {
  title: string;
  description: string;
}

export interface KeyPointsResponse {
  complaint_id: string;
  key_points_id: string;
  key_points: KeyPoint[];
  model_name: string;
  tokens_used: number;
  created_at: string;
  updated_at: string;
  generated: boolean;
}

export interface ResolverMessage {
  id: string | number;
  complaint: string;
  user: 'AI' | 'USER';
  content: string;
  created_at: string;
  reasoning?: string;
  citations?: string | Citation;
  done?: boolean;
  isError?: boolean;
  errorChunk?: string;
  retryData?: {
    complaintId: string;
    message: string;
  };
  tokens_used?: number;
}

// Fetch complaints list
const fetchComplaints = async (
  limit = 20,
  offset = 0
): Promise<ComplaintListResponse> => {
  const response = await apiCaller(
    `${API_ROUTES.COMPLAINTS.LIST}?limit=${limit}&offset=${offset}`,
    'GET',
    {},
    {},
    true,
    'json'
  );
  return response.data;
};

export const useResolver = () => {
  const queryClient = useQueryClient();

  // Query: Get complaints list
  const useComplaintsList = (limit = 20, offset = 0) => {
    return useQuery<ComplaintListResponse, Error>({
      queryKey: ['complaints', limit, offset],
      queryFn: () => fetchComplaints(limit, offset),
      staleTime: 1000 * 60 * 5, // 5 minutes
    });
  };

  // Query: Infinite complaints list
  const useInfiniteComplaintsList = (limit = 20) => {
    return useInfiniteQuery<ComplaintListResponse, Error>({
      queryKey: ['complaints', 'infinite', limit],
      queryFn: ({ pageParam = 0 }) =>
        fetchComplaints(limit, pageParam as number),
      getNextPageParam: (lastPage) => {
        const nextOffset = lastPage.offset + lastPage.results.length;
        if (nextOffset < lastPage.total) {
          return nextOffset;
        }
        return undefined;
      },
      initialPageParam: 0,
      staleTime: 1000 * 60 * 5,
    });
  };

  // Mutation: Create complaint
  const createComplaintMutation = useMutation({
    mutationFn: async (
      payload: CreateComplaintPayload
    ): Promise<CreateComplaintResponse> => {
      const response = await apiCaller(
        API_ROUTES.COMPLAINTS.CREATE,
        'POST',
        payload as unknown as RequestData,
        {},
        true,
        'formdata'
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complaints'] });
    },
  });

  // Mutation: Upload reference documents
  const uploadDocsMutation = useMutation({
    mutationFn: async ({
      contextId,
      documents,
    }: {
      contextId: string;
      documents: File[];
    }): Promise<UploadDocsResponse> => {
      const response = await apiCaller(
        API_ROUTES.COMPLAINTS.UPLOAD_DOCS(contextId),
        'POST',
        { documents } as unknown as RequestData,
        {},
        true,
        'formdata'
      );
      return response.data;
    },
  });

  // Mutation: Send streaming message
  const sendMessageMutation = useMutation({
    mutationFn: async ({
      complaintId,
      message,
      signal,
      onChunkUpdate,
    }: {
      complaintId: string;
      message: string;
      signal?: AbortSignal;
      onChunkUpdate?: (chunk: {
        reasoning: string;
        content: string;
        tokens_used?: number;
        done?: boolean;
      }) => void;
    }): Promise<ResolverMessage> => {
      const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}${API_ROUTES.COMPLAINTS.ADD_MESSAGE(complaintId)}`;

      return new Promise<ResolverMessage>(async (resolve, reject) => {
        try {
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
              Accept: '*/*',
            },
            body: JSON.stringify({
              message,
              stream: true,
              temperature: 0.1,
              include_thoughts: true,
            }),
            signal,
          });

          if (!response.ok) {
            let errorData: { error?: string } = {
              error: 'Failed to send message',
            };
            try {
              errorData = await response.json();
            } catch {
              /* ignore parse error */
            }

            const error = new Error(
              errorData.error || 'Failed to send message'
            ) as Error & {
              status?: number;
              retryable?: boolean;
            };
            error.status = response.status;
            error.retryable =
              response.status !== 400 && response.status !== 403;
            throw error;
          }

          const reader = response.body?.getReader();
          if (!reader) throw new Error('No response body');

          const decoder = new TextDecoder();
          let fullReasoning = '';
          let fullContent = '';
          let buffer = '';
          let finalMessage: ResolverMessage | null = null;
          let hasReceivedContent = false;

          const emitUpdate = (done = false) => {
            if (!onChunkUpdate) return;
            onChunkUpdate({
              reasoning: fullReasoning,
              content: fullContent, // Now streaming content along with reasoning
              done,
            });
          };

          while (true) {
            if (signal?.aborted)
              throw new DOMException('Aborted', 'AbortError');

            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith('data: ')) continue;

              const jsonStr = trimmed.substring(6).trim();
              if (!jsonStr) continue;

              try {
                const data = JSON.parse(jsonStr);

                if (data.error && data.done) {
                  const error = new Error(data.error) as Error & {
                    retryable?: boolean;
                  };
                  error.retryable = !data.error
                    .toLowerCase()
                    .includes('invalid');
                  reject(error);
                  return;
                }

                if (data.reasoning) {
                  if (data.done) fullReasoning = data.reasoning;
                  else fullReasoning += data.reasoning;
                  emitUpdate(false);
                }

                if (data.content) {
                  if (data.done) fullContent = data.content;
                  else fullContent += data.content;
                  hasReceivedContent = true;
                }

                if (data.done) {
                  emitUpdate(true);
                  finalMessage = {
                    id: data.ai_message_id || data.message_id || Date.now(),
                    complaint: complaintId,
                    user: 'AI',
                    content: fullContent,
                    reasoning: data.thought_summary || fullReasoning,
                    citations: data.citations,
                    created_at: new Date().toISOString(),
                    tokens_used: data.tokens_used || 0,
                    done: true,
                  };
                }
              } catch (e) {
                console.error('Error parsing stream chunk:', e);
              }
            }
          }

          if (!finalMessage) {
            finalMessage = {
              id: Date.now(),
              complaint: complaintId,
              user: 'AI',
              content: hasReceivedContent
                ? fullContent
                : 'No response generated',
              reasoning: fullReasoning,
              created_at: new Date().toISOString(),
              done: true,
            };
          }

          resolve(finalMessage);
        } catch (err) {
          reject(err);
        }
      });
    },
  });

  // Query: Get key points for a complaint
  const useKeyPoints = (complaintId: string | undefined) => {
    return useQuery<KeyPointsResponse, Error>({
      queryKey: ['keyPoints', complaintId],
      queryFn: async () => {
        if (!complaintId) throw new Error('Complaint ID is required');
        const response = await apiCaller(
          API_ROUTES.COMPLAINTS.GET_KEY_POINTS(complaintId),
          'GET',
          {},
          {},
          true,
          'json'
        );
        return response.data;
      },
      enabled: !!complaintId,
      staleTime: 1000 * 60 * 5,
    });
  };

  return {
    useComplaintsList,
    useInfiniteComplaintsList,
    useKeyPoints,
    // Query: Get complaint details
    useComplaintDetails: (complaintId: string | undefined) => {
      return useQuery<ComplaintDetailsResponse, Error>({
        queryKey: ['complaintDetails', complaintId],
        queryFn: async () => {
          if (!complaintId) throw new Error('Complaint ID is required');
          const response = await apiCaller(
            API_ROUTES.COMPLAINTS.GET_DETAILS(complaintId),
            'GET',
            {},
            {},
            true,
            'json'
          );
          return response.data;
        },
        enabled: !!complaintId,
      });
    },
    // Query: Get message history for a complaint
    useMessagesList: (complaintId: string | undefined, limit = 30) => {
      return useQuery<MessageListResponse, Error>({
        queryKey: ['complaintMessages', complaintId, limit],
        queryFn: async () => {
          if (!complaintId) throw new Error('Complaint ID is required');
          const response = await apiCaller(
            `${API_ROUTES.COMPLAINTS.GET_MESSAGES_LIST(complaintId)}?limit=${limit}`,
            'GET',
            {},
            {},
            true,
            'json'
          );
          return response.data;
        },
        enabled: !!complaintId,
      });
    },

    // Query: Infinite message history for a complaint (Reverse/Older)
    useInfiniteMessagesList: (complaintId: string | undefined, limit = 30) => {
      return useInfiniteQuery<MessageListResponse, Error>({
        queryKey: ['complaintMessages', 'infinite', complaintId, limit],
        queryFn: async ({ pageParam }) => {
          if (!complaintId) throw new Error('Complaint ID is required');
          const cursor = pageParam as number | undefined;
          const url = `${API_ROUTES.COMPLAINTS.GET_MESSAGES_LIST(complaintId)}?limit=${limit}${cursor ? `&before_seq=${cursor}` : ''}`;
          const response = await apiCaller(url, 'GET', {}, {}, true, 'json');
          return response.data;
        },
        getNextPageParam: (lastPage) => {
          if (lastPage.has_more && lastPage.next_before_seq) {
            return lastPage.next_before_seq;
          }
          return undefined;
        },
        initialPageParam: undefined,
        enabled: !!complaintId,
      });
    },
    createComplaint: createComplaintMutation.mutateAsync,
    isCreating: createComplaintMutation.isPending,
    uploadDocs: uploadDocsMutation.mutateAsync,
    isUploading: uploadDocsMutation.isPending,
    sendMessage: sendMessageMutation.mutateAsync,
  };
};
