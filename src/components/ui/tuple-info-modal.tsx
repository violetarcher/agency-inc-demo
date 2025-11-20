'use client';

import React from 'react';
import { X } from 'lucide-react';

export interface TupleInfo {
  operation: 'created' | 'updated' | 'deleted';
  tuple: {
    user: string;
    relation: string;
    object: string;
  };
}

interface TupleInfoModalProps {
  isOpen: boolean;
  tupleInfo: TupleInfo | null;
  onClose: () => void;
}

export function TupleInfoModal({ isOpen, tupleInfo, onClose }: TupleInfoModalProps) {
  if (!isOpen || !tupleInfo) return null;

  const operationColors = {
    created: 'bg-green-100 text-green-800 border-green-300',
    updated: 'bg-blue-100 text-blue-800 border-blue-300',
    deleted: 'bg-red-100 text-red-800 border-red-300',
  };

  const operationLabels = {
    created: 'Tuple Created',
    updated: 'Tuple Updated',
    deleted: 'Tuple Deleted',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-lg border bg-white p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div
              className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${operationColors[tupleInfo.operation]}`}
            >
              {operationLabels[tupleInfo.operation]}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-semibold">FGA Tuple Details</h3>

            <div className="rounded-md bg-gray-50 p-4 font-mono text-sm">
              <div className="space-y-2">
                <div className="flex gap-2">
                  <span className="text-gray-600">User:</span>
                  <span className="font-semibold text-gray-900">{tupleInfo.tuple.user}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-gray-600">Relation:</span>
                  <span className="font-semibold text-gray-900">{tupleInfo.tuple.relation}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-gray-600">Object:</span>
                  <span className="font-semibold text-gray-900">{tupleInfo.tuple.object}</span>
                </div>
              </div>
            </div>

            <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
              <p className="text-xs text-gray-600">
                <strong>Note:</strong> This tuple {tupleInfo.operation === 'deleted' ? 'was removed from' : 'was written to'} the Auth0 FGA store to manage fine-grained access control.
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Click anywhere to dismiss
          </p>
        </div>
      </div>
    </div>
  );
}
