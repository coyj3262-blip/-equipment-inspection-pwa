/**
 * DocumentList Component
 *
 * Filterable grid of documents with search and category filters
 */

import { useState, useMemo } from "react";
import DocumentCard from "./DocumentCard";
import LoadingSpinner from "../ui/LoadingSpinner";
import type { Document, DocumentCategory, FileType } from "../../types/documents";

interface DocumentListProps {
  documents: Document[];
  loading: boolean;
  onRefresh?: () => void;
  onDeleted?: () => void;
  showSiteName?: boolean;
}

const CATEGORIES: { value: "all" | DocumentCategory; label: string }[] = [
  { value: "all", label: "All Categories" },
  { value: "blueprint", label: "Blueprint" },
  { value: "kmz", label: "KMZ Map" },
  { value: "photo", label: "Photo" },
  { value: "cad", label: "CAD File" },
  { value: "other", label: "Other" }
];

const FILE_TYPES: { value: "all" | FileType; label: string }[] = [
  { value: "all", label: "All Types" },
  { value: "pdf", label: "PDF" },
  { value: "kmz", label: "KMZ" },
  { value: "jpg", label: "JPG" },
  { value: "png", label: "PNG" },
  { value: "dwg", label: "DWG" },
  { value: "dxf", label: "DXF" }
];

export default function DocumentList({
  documents,
  loading,
  onRefresh,
  onDeleted,
  showSiteName = false
}: DocumentListProps) {
  const [categoryFilter, setCategoryFilter] = useState<"all" | DocumentCategory>("all");
  const [fileTypeFilter, setFileTypeFilter] = useState<"all" | FileType>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Check if any filters are active
  const hasActiveFilters = categoryFilter !== "all" || fileTypeFilter !== "all" || searchTerm !== "";

  // Filter documents
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      // Category filter
      if (categoryFilter !== "all" && doc.category !== categoryFilter) {
        return false;
      }

      // File type filter
      if (fileTypeFilter !== "all" && doc.fileType !== fileTypeFilter) {
        return false;
      }

      // Search filter (name, description)
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesName = doc.name.toLowerCase().includes(searchLower);
        const matchesDescription = doc.description?.toLowerCase().includes(searchLower);
        const matchesSite = doc.siteName?.toLowerCase().includes(searchLower);

        if (!matchesName && !matchesDescription && !matchesSite) {
          return false;
        }
      }

      return true;
    });
  }, [documents, categoryFilter, fileTypeFilter, searchTerm]);

  // Clear all filters
  const handleClearFilters = () => {
    setCategoryFilter("all");
    setFileTypeFilter("all");
    setSearchTerm("");
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="bg-white rounded-xl border-2 border-slate-200 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-navy-900">
            <span className="font-semibold">🔍 Filter Documents</span>
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="px-3 py-1.5 text-sm text-orange-600 hover:bg-orange-50 rounded-lg transition-colors font-medium"
            >
              🔄 Refresh
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Category Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as "all" | DocumentCategory)}
              className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm focus:border-orange-500 focus:outline-none"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* File Type Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              File Type
            </label>
            <select
              value={fileTypeFilter}
              onChange={(e) => setFileTypeFilter(e.target.value as "all" | FileType)}
              className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm focus:border-orange-500 focus:outline-none"
            >
              {FILE_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Search Bar */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Search
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name..."
              className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm focus:border-orange-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Clear Filters Button */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div className="text-sm text-slate-600">
            Showing {filteredDocuments.length} of {documents.length} documents
          </div>
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium"
            >
              ✕ Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Document Grid */}
      {filteredDocuments.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-slate-200 p-12 text-center">
          <div className="text-6xl mb-4">📂</div>
          <h3 className="text-lg font-bold text-navy-900 mb-2">No documents found</h3>
          <p className="text-sm text-slate-600 mb-4">
            {hasActiveFilters
              ? "Try adjusting your filters to see more results."
              : "No documents have been uploaded yet."}
          </p>
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((doc) => (
            <DocumentCard
              key={doc.id}
              document={doc}
              showSiteName={showSiteName}
              onDeleted={onDeleted}
            />
          ))}
        </div>
      )}
    </div>
  );
}
