/**
 * History Page
 * ============
 * 
 * Paginated waste entry history with filtering.
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import {
  FunnelIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

import { api, formatDate } from '@/lib';
import { Card, Badge, Input, Button, EmptyState, Spinner, Modal } from '@/components/ui';
import type { WasteEntry, WasteCategory } from '@/types';

const CATEGORIES: { value: WasteCategory | ''; label: string }[] = [
  { value: '', label: 'All Categories' },
  { value: 'recyclable', label: 'Recyclable' },
  { value: 'organic', label: 'Organic' },
  { value: 'hazardous', label: 'Hazardous' },
  { value: 'electronic', label: 'Electronic' },
  { value: 'general', label: 'General' },
];

const PAGE_SIZE = 10;

export function HistoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedEntry, setSelectedEntry] = useState<WasteEntry | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<WasteCategory | ''>('');

  const page = parseInt(searchParams.get('page') || '1', 10);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['waste', 'history', page, category, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: PAGE_SIZE.toString(),
      });
      if (category) params.append('category', category);
      if (search) params.append('search', search);

      const { data } = await api.get(`/api/v1/waste/history?${params}`);
      return data as {
        items: WasteEntry[];
        total: number;
        page: number;
        page_size: number;
        pages: number;
      };
    },
  });

  const totalPages = data?.pages || 1;

  const handlePageChange = (newPage: number) => {
    setSearchParams({ page: newPage.toString() });
  };

  const getBinInfo = (bin: string) => {
    const bins: Record<string, { color: string; bg: string; icon: string }> = {
      blue: { color: 'text-blue-600', bg: 'bg-blue-100', icon: '♻️' },
      green: { color: 'text-green-600', bg: 'bg-green-100', icon: '🌿' },
      black: { color: 'text-gray-800', bg: 'bg-gray-200', icon: '🗑️' },
      yellow: { color: 'text-yellow-600', bg: 'bg-yellow-100', icon: '⚡' },
      red: { color: 'text-red-600', bg: 'bg-red-100', icon: '☠️' },
    };
    return bins[bin] || bins.black;
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Waste History</h1>
        <p className="mt-1 text-gray-600">
          View all your past waste classifications
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="flex-1">
            <Input
              placeholder="Search entries..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<MagnifyingGlassIcon className="h-5 w-5" />}
            />
          </div>
          <div className="flex gap-3">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as WasteCategory | '')}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
            <Button
              variant="outline"
              leftIcon={<FunnelIcon className="h-4 w-4" />}
              onClick={() => {
                setSearch('');
                setCategory('');
              }}
            >
              Clear
            </Button>
          </div>
        </div>
      </Card>

      {/* Loading */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : !data?.items.length ? (
        <EmptyState
          icon={<FunnelIcon className="h-12 w-12" />}
          title="No entries found"
          description={
            search || category
              ? 'Try adjusting your filters'
              : "You haven't uploaded any waste photos yet"
          }
          action={{
            label: 'Upload Waste',
            href: '/dashboard/upload',
          }}
        />
      ) : (
        <>
          {/* Results */}
          <div className="space-y-4">
            {isFetching && !isLoading && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10">
                <Spinner size="lg" />
              </div>
            )}

            {data.items.map((entry) => (
              <Card
                key={entry.id}
                className="cursor-pointer transition-shadow hover:shadow-md"
                onClick={() => setSelectedEntry(entry)}
              >
                <div className="flex flex-col gap-4 sm:flex-row">
                  {/* Image */}
                  <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                    {entry.image_url && (
                      <img
                        src={entry.image_url}
                        alt="Waste"
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold capitalize text-gray-900">
                          {entry.classification?.category?.replace('_', ' ') || 'Pending'}
                        </h3>
                        {entry.classification?.sub_category && (
                          <p className="text-sm capitalize text-gray-600">
                            {entry.classification.sub_category.replace('_', ' ')}
                          </p>
                        )}
                      </div>
                      {entry.classification && (
                        <Badge
                          variant={
                            entry.classification.confidence_tier === 'high'
                              ? 'success'
                              : entry.classification.confidence_tier === 'medium'
                              ? 'warning'
                              : 'danger'
                          }
                          size="sm"
                        >
                          {Math.round(entry.classification.confidence * 100)}%
                        </Badge>
                      )}
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                      {entry.classification?.recommended_bin && (
                        <span
                          className={`flex items-center gap-1 rounded-full px-2 py-0.5 ${
                            getBinInfo(entry.classification.recommended_bin).bg
                          }`}
                        >
                          <span>
                            {getBinInfo(entry.classification.recommended_bin).icon}
                          </span>
                          <span
                            className={`font-medium capitalize ${
                              getBinInfo(entry.classification.recommended_bin).color
                            }`}
                          >
                            {entry.classification.recommended_bin} bin
                          </span>
                        </span>
                      )}
                      <span className="text-gray-500">
                        {formatDate(entry.created_at)}
                      </span>
                      {entry.points_earned && entry.points_earned > 0 && (
                        <span className="text-primary-600 font-medium">
                          +{entry.points_earned} pts
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
              <p className="text-sm text-gray-600">
                Showing {(page - 1) * PAGE_SIZE + 1} to{' '}
                {Math.min(page * PAGE_SIZE, data.total)} of {data.total} results
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                  leftIcon={<ChevronLeftIcon className="h-4 w-4" />}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages}
                  rightIcon={<ChevronRightIcon className="h-4 w-4" />}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Entry Detail Modal */}
      <Modal
        isOpen={!!selectedEntry}
        onClose={() => setSelectedEntry(null)}
        title="Classification Details"
        size="lg"
      >
        {selectedEntry && (
          <div className="space-y-4">
            {/* Image */}
            <div className="overflow-hidden rounded-lg bg-gray-100">
              {selectedEntry.image_url && (
                <img
                  src={selectedEntry.image_url}
                  alt="Waste"
                  className="h-64 w-full object-contain"
                />
              )}
            </div>

            {/* Classification */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Category
                </p>
                <p className="mt-1 text-lg font-semibold capitalize text-gray-900">
                  {selectedEntry.classification?.category?.replace('_', ' ') || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Confidence
                </p>
                <div className="mt-1 flex items-center gap-2">
                  {selectedEntry.classification && (
                    <Badge
                      variant={
                        selectedEntry.classification.confidence_tier === 'high'
                          ? 'success'
                          : selectedEntry.classification.confidence_tier === 'medium'
                          ? 'warning'
                          : 'danger'
                      }
                    >
                      {Math.round(selectedEntry.classification.confidence * 100)}%
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Bin recommendation */}
            {selectedEntry.classification?.recommended_bin && (
              <div
                className={`flex items-center gap-4 rounded-lg p-4 ${
                  getBinInfo(selectedEntry.classification.recommended_bin).bg
                }`}
              >
                <span className="text-3xl">
                  {getBinInfo(selectedEntry.classification.recommended_bin).icon}
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-700">Dispose in</p>
                  <p
                    className={`text-lg font-bold capitalize ${
                      getBinInfo(selectedEntry.classification.recommended_bin).color
                    }`}
                  >
                    {selectedEntry.classification.recommended_bin} Bin
                  </p>
                </div>
              </div>
            )}

            {/* Handling instructions */}
            {selectedEntry.classification?.handling_instructions && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Handling Instructions
                </p>
                <p className="mt-1 text-gray-700">
                  {selectedEntry.classification.handling_instructions}
                </p>
              </div>
            )}

            {/* Metadata */}
            <div className="flex items-center justify-between border-t border-gray-200 pt-4 text-sm text-gray-500">
              <span>Uploaded {formatDate(selectedEntry.created_at)}</span>
              {selectedEntry.points_earned && selectedEntry.points_earned > 0 && (
                <span className="text-primary-600 font-medium">
                  +{selectedEntry.points_earned} points earned
                </span>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
