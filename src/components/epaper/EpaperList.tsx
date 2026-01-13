/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/epaper/EpaperList.tsx
import { useCallback, useEffect, useState } from "react";
import { getAllEpapers, Epaper } from "../../api/epaper.api";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../context/ToastContext";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import { PencilIcon, TrashBinIcon, EyeIcon } from "../../icons";
import Button from "../ui/button/Button";
import api from "../../api/api";

export default function EpaperList() {
  const [epapers, setEpapers] = useState<Epaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
  });

  const navigate = useNavigate();
  const { showToast } = useToast();

  const loadEpapers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // No search parameter — fetch all with pagination
      const data = await getAllEpapers(pagination.page, pagination.limit);

      setEpapers(data.epapers);
      setPagination(data.pagination);
    } catch (err: unknown) {
      console.error("Error fetching ePapers:", err);
      setError(err instanceof Error ? err.message : "Failed to load ePapers");
      setEpapers([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit]);

  useEffect(() => {
    loadEpapers();
  }, [loadEpapers]);

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

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setPagination((prev) => ({ ...prev, page: newPage }));
    }
  };

  const handleEdit = (id: string) =>
    navigate(`/admin-dashboard/epapers/edit/${id}`);
  const handleView = (id: string) =>
    navigate(`/admin-dashboard/epapers/view/${id}`);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      await api.delete(`/epapers/${id}`);
      showToast({
        variant: "success",
        title: "Deleted",
        message: "ePaper deleted successfully",
      });
      await loadEpapers();
    } catch (err: unknown) {
      let msg = "Failed to delete ePaper";
      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as any;
        msg = axiosError.response?.data?.message || msg;
      }
      showToast({ variant: "error", title: "Error", message: msg });
    }
  };

  if (loading) return <div className="p-4 text-center">Loading ePapers...</div>;
  if (error)
    return <div className="p-4 text-red-500 text-center">Error: {error}</div>;
  if (!epapers.length)
    return (
      <div className="p-4 text-center text-gray-500">No ePapers found</div>
    );

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 w-full">
      <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            E-Paper List
          </h3>
        </div>
      </div>

      <div className="w-full overflow-x-auto px-2 sm:px-0 table-scroll">
        <Table className="min-w-[700px] sm:min-w-full">
          <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
            <TableRow>
              <TableCell
                isHeader
                className="py-3 px-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Name
              </TableCell>
              <TableCell
                isHeader
                className="py-3 px-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Date
              </TableCell>
              <TableCell
                isHeader
                className="py-3 px-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Pages
              </TableCell>
              <TableCell
                isHeader
                className="py-3 px-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Status
              </TableCell>
              <TableCell
                isHeader
                className="py-3 px-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Created By
              </TableCell>
              <TableCell
                isHeader
                className="py-3 px-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Actions
              </TableCell>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {epapers.map((epaper) =>
              epaper._id ? (
                <TableRow key={epaper._id}>
                  <TableCell className="py-3 px-3 text-gray-800 text-theme-sm dark:text-gray-300 whitespace-nowrap font-medium">
                    {epaper.name}
                  </TableCell>

                  <TableCell className="py-3 px-3 text-gray-600 text-theme-sm dark:text-gray-400 whitespace-nowrap">
                    {format(new Date(epaper.date), "dd MMM yyyy")}
                  </TableCell>

                  <TableCell className="py-3 px-3 text-gray-600 text-theme-sm dark:text-gray-400 whitespace-nowrap">
                    {epaper.totalPages} pages
                  </TableCell>

                  <TableCell className="py-3 px-3 text-gray-600 text-theme-sm dark:text-gray-400 whitespace-nowrap">
                    <Badge size="sm" color={statusColor(epaper.status)}>
                      {epaper.status}
                    </Badge>
                  </TableCell>

                  <TableCell className="py-3 px-3 text-gray-600 text-theme-sm dark:text-gray-400 whitespace-nowrap">
                    {epaper.createdBy?.fullName || "System"}
                  </TableCell>

                  <TableCell className="py-3 px-3 text-theme-sm whitespace-nowrap">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => handleView(epaper._id!)}
                        className="icon-btn hover:text-blue-600"
                        aria-label="View"
                        title="View ePaper"
                      >
                        <EyeIcon className="w-4 h-4 fill-gray-500 hover:fill-blue-600" />
                      </button>

                      <button
                        onClick={() => handleEdit(epaper._id!)}
                        className="icon-btn hover:text-green-600"
                        aria-label="Edit"
                        title="Edit ePaper"
                      >
                        <PencilIcon className="w-4 h-4 fill-gray-500 hover:fill-green-600" />
                      </button>

                      <button
                        onClick={() => handleDelete(epaper._id!, epaper.name)}
                        className="icon-btn hover:text-red-600"
                        aria-label="Delete"
                        title="Delete ePaper"
                      >
                        <TrashBinIcon className="w-4 h-4 fill-gray-500 hover:fill-red-600" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : null
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} ePapers
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Previous
            </Button>

            <span className="px-3 py-1 text-sm">
              Page {pagination.page} of {pagination.pages}
            </span>

            <Button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
