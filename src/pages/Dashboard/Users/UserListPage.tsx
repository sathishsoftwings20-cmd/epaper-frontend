// src/pages/Dashboard/Users/UserListPage.tsx
import PageMeta from "../../../components/common/PageMeta";
import UserList from "../../../components/user/UserList";

export default function UserListPage() {
  return (
    <>
      <PageMeta
        title="User Management | Epaper Admin"
        description="User management page"
      />
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            User Management
          </h1>
        </div>
        <UserList />
      </div>
    </>
  );
}
