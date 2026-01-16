'use client';

import { useEffect, useState } from 'react';
import { useRealtime } from '@/hooks';
import { wasteApi } from '@/lib/api';
import { WasteEntry, WasteStatus } from '@/lib/types';
import { 
  Card, 
  CardHeader, 
  CardTitle,
  CardContent,
  StatusCard,
  LoadingSpinner,
  Badge,
  StatusTimeline
} from '@/components/ui';
import { cn } from '@/lib/cn';
import { 
  Filter, 
  X, 
  ChevronRight,
  Clock,
  CheckCircle,
  Truck
} from 'lucide-react';

export default function HistoryPage() {
  const [entries, setEntries] = useState<WasteEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<WasteEntry | null>(null);
  const [filterStatus, setFilterStatus] = useState<WasteStatus | 'all'>('all');

  // Real-time updates
  useRealtime({
    onStatusUpdate: (data) => {
      const updateData = data as { entry_id: string; status: WasteStatus };
      setEntries((prev) =>
        prev.map((entry) =>
          entry.id === updateData.entry_id
            ? { ...entry, status: updateData.status }
            : entry
        )
      );
      // Also update selected entry if it's the one being updated
      if (selectedEntry?.id === updateData.entry_id) {
        setSelectedEntry((prev) => prev ? { ...prev, status: updateData.status } : null);
      }
    },
    onPickupAccepted: (data) => {
      const updateData = data as { entry_id: string; collector_id: string };
      setEntries((prev) =>
        prev.map((entry) =>
          entry.id === updateData.entry_id
            ? { ...entry, status: 'accepted' as WasteStatus, collected_by: updateData.collector_id }
            : entry
        )
      );
    },
    onPickupCollected: (data) => {
      const updateData = data as { entry_id: string };
      setEntries((prev) =>
        prev.map((entry) =>
          entry.id === updateData.entry_id
            ? { ...entry, status: 'collected' as WasteStatus }
            : entry
        )
      );
    },
  });

  useEffect(() => {
    async function loadHistory() {
      try {
        const data = await wasteApi.getHistory(100);
        setEntries(data);
      } catch (error) {
        console.error('Failed to load history:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadHistory();
  }, []);

  const filteredEntries = filterStatus === 'all'
    ? entries
    : entries.filter((e) => e.status === filterStatus);

  const statusCounts = {
    all: entries.length,
    pending: entries.filter((e) => e.status === 'pending').length,
    accepted: entries.filter((e) => e.status === 'accepted').length,
    collected: entries.filter((e) => e.status === 'collected').length,
  };

  const filterOptions: { value: WasteStatus | 'all'; label: string; icon: React.ReactNode }[] = [
    { value: 'all', label: 'All', icon: <Filter className="w-4 h-4" /> },
    { value: 'pending', label: 'Pending', icon: <Clock className="w-4 h-4" /> },
    { value: 'accepted', label: 'In Transit', icon: <Truck className="w-4 h-4" /> },
    { value: 'collected', label: 'Collected', icon: <CheckCircle className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Submission History</h1>
        <p className="text-gray-400 mt-1">
          Track your waste submissions and collection status
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main content */}
        <div className="flex-1 space-y-4">
          {/* Filter tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 lg:mx-0 lg:px-0">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setFilterStatus(option.value)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all',
                  filterStatus === option.value
                    ? 'bg-eco-500/20 text-eco-400'
                    : 'bg-surface text-gray-400 hover:text-white'
                )}
              >
                {option.icon}
                {option.label}
                <Badge 
                  variant={filterStatus === option.value ? 'success' : 'default'}
                  size="sm"
                >
                  {statusCounts[option.value]}
                </Badge>
              </button>
            ))}
          </div>

          {/* Entries list */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : filteredEntries.length === 0 ? (
            <Card className="py-12">
              <div className="text-center">
                <p className="text-gray-400">
                  {filterStatus === 'all' 
                    ? 'No waste submissions yet' 
                    : `No ${filterStatus} submissions`}
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredEntries.map((entry) => (
                <div
                  key={entry.id}
                  onClick={() => setSelectedEntry(entry)}
                  className={cn(
                    'transition-all',
                    selectedEntry?.id === entry.id && 'ring-2 ring-eco-500 rounded-xl'
                  )}
                >
                  <StatusCard 
                    entry={entry} 
                    onClick={() => setSelectedEntry(entry)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selectedEntry && (
          <div className="lg:w-80 lg:sticky lg:top-6 lg:self-start">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Details</CardTitle>
                  <button
                    onClick={() => setSelectedEntry(null)}
                    aria-label="Close details"
                    className="p-1 text-gray-400 hover:text-white lg:hidden"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Image */}
                {selectedEntry.image_url && (
                  <div className="aspect-video rounded-xl overflow-hidden bg-background-tertiary">
                    <img
                      src={selectedEntry.image_url}
                      alt="Waste item"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Status timeline */}
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-4">Status</h4>
                  <StatusTimeline entry={selectedEntry} />
                </div>

                {/* Instructions */}
                {selectedEntry.instructions.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-2">Instructions</h4>
                    <ul className="space-y-1">
                      {selectedEntry.instructions.map((instruction, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-gray-300">
                          <ChevronRight className="w-4 h-4 text-eco-400 mt-0.5 flex-shrink-0" />
                          <span>{instruction}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Collection image */}
                {selectedEntry.collection_image_url && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-2">Collection Proof</h4>
                    <div className="aspect-video rounded-xl overflow-hidden bg-background-tertiary">
                      <img
                        src={selectedEntry.collection_image_url}
                        alt="Collection proof"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}

                {/* Impact */}
                <div className="p-3 rounded-xl bg-eco-500/10">
                  <p className="text-sm text-eco-400">{selectedEntry.impact_note}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
