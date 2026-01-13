import { useCallback, useEffect, useState } from "react";
import { getAllUsers, User } from "../../api/user.api";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import { PencilIcon } from "../../icons";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext"; // Import useAuth to check current user

export default function UserList() {
  const [userList, setUserList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user: currentUser } = useAuth(); // Get current user for permission checks

  const loadUser = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllUsers();
      setUserList(data ?? []);
    } catch (err: unknown) {
      console.error("Error fetching users:", err);
      setError(err instanceof Error ? err.message : "Failed to load users");
      setUserList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  function roleColor(role?: string) {
    switch (role) {
      case "SuperAdmin":
        return "success";
      case "Admin":
        return "warning";
      case "Staff":
        return "primary"; // Changed from error to primary for better UX
      default:
        return "primary";
    }
  }

  // Check if current user can edit a target user
  const canEditUser = (targetUser: User): boolean => {
    // SuperAdmin can edit anyone
    if (currentUser?.role === "SuperAdmin") return true;

    // Admin can edit Staff and other Admins (but not SuperAdmin)
    if (currentUser?.role === "Admin") {
      return targetUser.role !== "SuperAdmin";
    }

    // Staff can only edit themselves
    return currentUser?._id === targetUser._id;
  };

  const handleEdit = (id: string) =>
    navigate(`/admin-dashboard/users/edit/${id}`);

  if (loading) return <div className="p-4 text-center">Loading users...</div>;
  if (error)
    return <div className="p-4 text-red-500 text-center">Error: {error}</div>;
  if (!userList.length)
    return <div className="p-4 text-center text-gray-500">No users found</div>;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 w-full">
      <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            User List
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
                Username
              </TableCell>
              <TableCell
                isHeader
                className="py-3 px-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Email
              </TableCell>
              <TableCell
                isHeader
                className="py-3 px-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Role
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
            {userList.map((user) => {
              const canEdit = canEditUser(user);

              return (
                <TableRow key={user._id}>
                  <TableCell className="py-3 px-3 text-gray-800 text-theme-sm dark:text-gray-300 whitespace-nowrap font-medium">
                    {user.fullName || "-"}
                  </TableCell>

                  <TableCell className="py-3 px-3 text-gray-600 text-theme-sm dark:text-gray-400 whitespace-nowrap">
                    {user.userName || "-"}
                  </TableCell>

                  <TableCell className="py-3 px-3 text-gray-600 text-theme-sm dark:text-gray-400 whitespace-nowrap">
                    {user.email || "-"}
                  </TableCell>

                  <TableCell className="py-3 px-3 text-gray-600 text-theme-sm dark:text-gray-400 whitespace-nowrap">
                    <Badge size="sm" color={roleColor(user.role)}>
                      {user.role || "Staff"}
                    </Badge>
                  </TableCell>

                  <TableCell className="py-3 px-3 text-theme-sm whitespace-nowrap">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(user._id)}
                        className={`icon-btn ${
                          !canEdit
                            ? "cursor-not-allowed opacity-50"
                            : "hover:text-blue-600"
                        }`}
                        aria-label="Edit"
                        disabled={!canEdit}
                        title={
                          !canEdit
                            ? "You don't have permission to edit this user"
                            : "Edit user"
                        }
                      >
                        <PencilIcon className="w-4 h-4 sm:w-5 sm:h-5 fill-gray-500 dark:fill-gray-400 hover:fill-blue-600" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
