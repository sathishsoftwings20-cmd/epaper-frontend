// src/components/epaper/EpaperView.tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getEpaperById, Epaper } from "../../api/epaper.api";
import { format } from "date-fns";
import Badge from "../ui/badge/Badge";
import Button from "../ui/button/Button";
import { useNavigate } from "react-router-dom";

export default function EpaperView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [epaper, setEpaper] = useState<Epaper | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    if (!id) return;

    const loadEpaper = async () => {
      try {
        setLoading(true);
        const data = await getEpaperById(id);
        setEpaper(data);
      } catch (err) {
        console.error("Failed to load ePaper", err);
        setError(err instanceof Error ? err.message : "Failed to load ePaper");
      } finally {
        setLoading(false);
      }
    };

    loadEpaper();
  }, [id]);

  function statusColor(status?: string) {
    switch (status) {
      case "published":
        return "success";
      case "draft":
        return "warning";
      case "archived":
        return "error";
      default:
        return "primary";
    }
  }

  if (loading) return <div className="p-4 text-center">Loading ePaper...</div>;
  if (error)
    return <div className="p-4 text-red-500 text-center">Error: {error}</div>;
  if (!epaper) return <div className="p-4 text-center">ePaper not found</div>;

  const totalPages = epaper.images.length;

  return (
    <div className="w-full rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
              {epaper.name}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-gray-600 dark:text-gray-400">
                {format(new Date(epaper.date), "dd MMMM yyyy")}
              </span>
              <Badge size="sm" color={statusColor(epaper.status)}>
                {epaper.status}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => navigate(`/admin-dashboard/epapers/edit/${id}`)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Edit ePaper
          </Button>
        </div>
      </div>

      {/* Page Navigation */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <Button
            onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
            disabled={currentPage === 0}
            className="px-4 py-2"
          >
            Previous Page
          </Button>

          <div className="text-center">
            <span className="font-medium text-gray-800 dark:text-white">
              Page {currentPage + 1} of {totalPages}
            </span>
            <div className="flex items-center gap-1 mt-2">
              {Array.from({ length: totalPages }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentPage(index)}
                  className={`w-3 h-3 rounded-full ${
                    index === currentPage
                      ? "bg-blue-600"
                      : "bg-gray-300 dark:bg-gray-600"
                  }`}
                  aria-label={`Go to page ${index + 1}`}
                />
              ))}
            </div>
          </div>

          <Button
            onClick={() =>
              setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))
            }
            disabled={currentPage === totalPages - 1}
            className="px-4 py-2"
          >
            Next Page
          </Button>
        </div>
      )}

      {/* Image Display */}
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-6">
        {epaper.images[currentPage] && (
          <div className="text-center">
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {epaper.images[currentPage].originalName}
              </p>
            </div>

            <img
              src={`${API_URL}/${epaper.images[currentPage].imageUrl}`}
              alt={`Page ${epaper.images[currentPage].pageNumber}`}
              className="max-w-full h-auto mx-auto rounded-lg shadow-lg"
            />

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
              Image size:{" "}
              {(epaper.images[currentPage].size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        )}
      </div>

      {/* Thumbnail Navigation */}
      {totalPages > 1 && (
        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">
            All Pages
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {epaper.images.map((image, index) => (
              <button
                key={image._id || index}
                onClick={() => setCurrentPage(index)}
                className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                  index === currentPage
                    ? "border-blue-500 ring-2 ring-blue-200"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                <img
                  src={`${API_URL}/${image.imageUrl}`}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-32 object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1">
                  Page {image.pageNumber}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">
          ePaper Details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Basic Information
            </h4>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Name</p>
                <p className="font-medium">{epaper.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Publication Date
                </p>
                <p className="font-medium">
                  {format(new Date(epaper.date), "dd MMMM yyyy")}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Total Pages
                </p>
                <p className="font-medium">{epaper.totalPages}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Status
                </p>
                <Badge color={statusColor(epaper.status)}>
                  {epaper.status}
                </Badge>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Creation Details
            </h4>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Created By
                </p>
                <p className="font-medium">
                  {epaper.createdBy?.fullName || "System"}
                </p>
                <p className="text-sm text-gray-500">
                  {epaper.createdBy?.email}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Created At
                </p>
                <p className="font-medium">
                  {epaper.createdAt
                    ? format(new Date(epaper.createdAt), "dd MMM yyyy HH:mm")
                    : "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Last Updated
                </p>
                <p className="font-medium">
                  {epaper.updatedAt
                    ? format(new Date(epaper.updatedAt), "dd MMM yyyy HH:mm")
                    : "-"}
                </p>
                <p className="text-sm text-gray-500">
                  {epaper.updatedBy?.fullName
                    ? `by ${epaper.updatedBy.fullName}`
                    : ""}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
