/**
 * Waste Hooks
 * ===========
 * 
 * React Query hooks for waste management operations.
 */

import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import toast from 'react-hot-toast';

import api from '@/lib/api';
import type { WasteEntry, WasteClassification, PaginatedResponse, ErrorResponse } from '@/types';

// Query keys
export const wasteKeys = {
  all: ['waste'] as const,
  entries: () => [...wasteKeys.all, 'entries'] as const,
  entry: (id: string) => [...wasteKeys.entries(), id] as const,
  stats: () => [...wasteKeys.all, 'stats'] as const,
  recent: () => [...wasteKeys.all, 'recent'] as const,
};

// Types
interface UploadWasteParams {
  file: File;
  location?: { lat: number; lng: number };
  notes?: string;
}

interface WasteStats {
  total_entries: number;
  total_recycled: number;
  total_composted: number;
  total_landfill: number;
  carbon_saved_kg: number;
  points_earned: number;
}

interface WasteEntriesParams {
  page?: number;
  limit?: number;
  category?: string;
}

// Fetch waste entries
export function useWasteEntries(params?: WasteEntriesParams): UseQueryResult<PaginatedResponse<WasteEntry>, Error> {
  return useQuery({
    queryKey: [...wasteKeys.entries(), params],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<WasteEntry>>('/waste/entries', { params });
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Fetch single waste entry
export function useWasteEntry(id: string | undefined): UseQueryResult<WasteEntry, Error> {
  return useQuery({
    queryKey: wasteKeys.entry(id!),
    queryFn: async () => {
      const response = await api.get<WasteEntry>(`/waste/entries/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

// Fetch waste stats
export function useWasteStats(): UseQueryResult<WasteStats, Error> {
  return useQuery({
    queryKey: wasteKeys.stats(),
    queryFn: async () => {
      const response = await api.get<WasteStats>('/waste/stats');
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Fetch recent waste entries
export function useRecentWaste(limit = 5): UseQueryResult<WasteEntry[], Error> {
  return useQuery({
    queryKey: wasteKeys.recent(),
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<WasteEntry>>('/waste/entries', {
        params: { limit, page: 1 },
      });
      return response.data.items;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

// Upload waste image
export function useUploadWaste(): UseMutationResult<WasteClassification, AxiosError<ErrorResponse>, UploadWasteParams> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, location, notes }: UploadWasteParams) => {
      const formData = new FormData();
      formData.append('file', file);
      if (location) {
        formData.append('latitude', location.lat.toString());
        formData.append('longitude', location.lng.toString());
      }
      if (notes) {
        formData.append('notes', notes);
      }

      const response = await api.post<WasteClassification>('/waste/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Waste classified successfully!');
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: wasteKeys.entries() });
      queryClient.invalidateQueries({ queryKey: wasteKeys.stats() });
      queryClient.invalidateQueries({ queryKey: wasteKeys.recent() });
    },
    onError: (error) => {
      const message = error.response?.data?.detail || 'Failed to classify waste';
      toast.error(message);
    },
  });
}

// Delete waste entry
export function useDeleteWaste(): UseMutationResult<void, AxiosError<ErrorResponse>, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/waste/entries/${id}`);
    },
    onSuccess: () => {
      toast.success('Entry deleted successfully');
      queryClient.invalidateQueries({ queryKey: wasteKeys.entries() });
      queryClient.invalidateQueries({ queryKey: wasteKeys.stats() });
    },
    onError: (error) => {
      const message = error.response?.data?.detail || 'Failed to delete entry';
      toast.error(message);
    },
  });
}

export default {
  useWasteEntries,
  useWasteEntry,
  useWasteStats,
  useRecentWaste,
  useUploadWaste,
  useDeleteWaste,
};
