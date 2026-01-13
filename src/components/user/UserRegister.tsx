// src/components/user/UserForm.tsx
import React, { useEffect, useRef, useState } from "react";
import { getUserById } from "../../api/user.api";
import api from "../../api/api";
import Label from "../ui/form/Label";
import Input from "../ui/form/InputField";
import Button from "../ui/button/Button";
import Select from "../ui/form/Select";
import { useToast } from "../../context/ToastContext";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { Lock } from "lucide-react";

/* ---------------------- Types ---------------------- */
type FormUser = {
  fullName: string;
  email: string;
  userName: string;
  password?: string;
  passwordConfirm?: string;
  role: "SuperAdmin" | "Admin" | "Staff";
};

type Errors = {
  fullName?: string;
  email?: string;
  userName?: string;
  password?: string;
  passwordConfirm?: string;
};

// Separate types for create and update payloads
type CreateUserPayload = {
  fullName: string;
  email: string;
  userName: string;
  role: "SuperAdmin" | "Admin" | "Staff";
  password: string;
};

type UpdateUserPayload = {
  fullName: string;
  email: string;
  role: "SuperAdmin" | "Admin" | "Staff";
  password?: string;
};

type ErrorResponse = {
  message?: string;
  error?: string;
};

/* ---------------------- Defaults ---------------------- */
const defaultForm: FormUser = {
  fullName: "",
  email: "",
  userName: "",
  password: "",
  passwordConfirm: "",
  role: "Staff",
};

/* ===================== Component ===================== */
export default function UserRegister() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const mounted = useRef(true);

  const [user, setUser] = useState<FormUser>(defaultForm);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [originalUsername, setOriginalUsername] = useState<string>("");

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Prevent username changes in edit mode
    if (isEditing && name === "userName") {
      // Revert to original username if user tries to change it
      setUser((prev) => ({
        ...prev,
        [name]: originalUsername,
      }));
      return;
    }

    setUser((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for this field when user starts typing
    if (errors[name as keyof Errors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  // Handle role change for Select component
  const handleRoleSelectChange = (value: string) => {
    setUser((prev) => ({
      ...prev,
      role: value as FormUser["role"],
    }));
  };

  // load user for edit
  useEffect(() => {
    if (!id) return;

    setIsEditing(true);

    let cancelled = false;
    (async () => {
      try {
        const data = await getUserById(id);
        if (cancelled) return;

        setUser({
          fullName: data.fullName || "",
          email: data.email || "",
          userName: data.userName || "",
          role: (data.role as FormUser["role"]) || "Staff",
          password: "",
          passwordConfirm: "",
        });
        setOriginalUsername(data.userName || "");
      } catch (err) {
        console.error("Failed to load user", err);
        showToast({
          variant: "error",
          title: "Error",
          message: "Failed to load user",
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, showToast]);

  // Mount cleanup
  useEffect(() => {
    return () => {
      mounted.current = false;
    };
  }, []);

  // Validation
  const validate = (): boolean => {
    const newErrors: Errors = {};

    if (!user.fullName?.trim()) newErrors.fullName = "Full name is required";

    if (!user.email?.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email.trim()))
      newErrors.email = "Email is invalid";

    if (!id && !user.userName?.trim()) {
      newErrors.userName = "Username is required";
    }

    if (!id) {
      // For new user creation
      if (!user.password) newErrors.password = "Password is required";
      else if (user.password.length < 6)
        newErrors.password = "Password must be at least 6 characters";
      if (!user.passwordConfirm)
        newErrors.passwordConfirm = "Confirm password is required";
      else if (user.password !== user.passwordConfirm)
        newErrors.passwordConfirm = "Passwords do not match";
    } else {
      // For user update - password is optional
      if (user.password && user.password.length > 0 && user.password.length < 6)
        newErrors.password = "Password must be at least 6 characters";
      if (user.password && user.password !== user.passwordConfirm)
        newErrors.passwordConfirm = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      if (id) {
        // Update existing user - DON'T include username
        const userData: UpdateUserPayload = {
          fullName: user.fullName.trim(),
          email: user.email.trim(),
          role: user.role,
        };

        // Only include password if it's provided
        if (user.password && user.password.trim()) {
          userData.password = user.password;
        }

        console.log("Updating user data:", userData);
        await api.put(`/users/${id}`, userData);

        showToast({
          variant: "success",
          title: "Updated",
          message: "User updated successfully.",
        });
      } else {
        // Create new user - include username
        if (!user.password) {
          showToast({
            variant: "error",
            title: "Error",
            message: "Password is required for new users.",
          });
          setLoading(false);
          return;
        }

        const userData: CreateUserPayload = {
          fullName: user.fullName.trim(),
          email: user.email.trim(),
          userName: user.userName.trim(),
          role: user.role,
          password: user.password,
        };

        console.log("Creating user data:", userData);
        await api.post(`/users`, userData);

        showToast({
          variant: "success",
          title: "Created",
          message: "User created successfully.",
        });
      }

      setTimeout(() => navigate("/admin-dashboard/users"), 800);
    } catch (err: unknown) {
      console.error("Error saving user:", err);
      let msg = "Error saving user.";

      if (axios.isAxiosError(err)) {
        const responseData = err.response?.data as ErrorResponse;
        if (responseData?.message) {
          msg = responseData.message;
        } else if (responseData?.error) {
          msg = responseData.error;
        }

        // Handle specific errors
        if (
          msg.toLowerCase().includes("username") &&
          msg.toLowerCase().includes("already")
        ) {
          showToast({
            variant: "error",
            title: "Username Taken",
            message: "This username is already taken. Please choose another.",
          });
        } else if (
          msg.toLowerCase().includes("email") &&
          msg.toLowerCase().includes("already")
        ) {
          showToast({
            variant: "error",
            title: "Email Already Used",
            message: "This email is already registered.",
          });
        } else {
          showToast({
            variant: "error",
            title: "Error",
            message: msg,
          });
        }
      } else if (err instanceof Error) {
        msg = err.message;
        showToast({
          variant: "error",
          title: "Error",
          message: msg,
        });
      }
    } finally {
      if (mounted.current) setLoading(false);
    }
  };

  // Role options
  const roleOptions = [
    { value: "Staff", label: "Staff" },
    { value: "Admin", label: "Admin" },
  ];

  return (
    <div
      className="w-full rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 
    dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 overflow-hidden"
    >
      <div className="flex flex-col gap-2 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
            {isEditing ? "Edit User" : "Create New User"}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {isEditing
              ? "Update user information. Username cannot be changed."
              : "Create a new user account with appropriate permissions."}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 w-full">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Full Name */}
          <div>
            <Label htmlFor="fullName">
              Full Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="fullName"
              name="fullName"
              value={user.fullName}
              onChange={handleChange}
              error={!!errors.fullName}
              placeholder="Enter full name"
              disabled={loading}
            />
            {errors.fullName && (
              <div className="text-sm text-red-600 mt-1">{errors.fullName}</div>
            )}
          </div>

          {/* Role */}
          <div>
            <Label htmlFor="role">Role</Label>
            <Select
              options={roleOptions}
              value={user.role}
              onChange={handleRoleSelectChange}
              className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm"
              disabled={loading}
            />
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="email">
              Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={user.email}
              onChange={handleChange}
              error={!!errors.email}
              placeholder="Enter email address"
              disabled={loading}
            />
            {errors.email && (
              <div className="text-sm text-red-600 mt-1">{errors.email}</div>
            )}
          </div>

          {/* User Name */}
          <div>
            <Label htmlFor="userName">
              Username <span className="text-red-500">*</span>
              {isEditing && (
                <span className="ml-2 text-xs font-normal text-gray-500">
                  (Cannot be changed)
                </span>
              )}
            </Label>
            <div className="relative">
              <Input
                id="userName"
                name="userName"
                value={user.userName}
                onChange={handleChange}
                error={!!errors.userName}
                placeholder="Choose a username"
                disabled={isEditing || loading}
                className={`pr-10 ${
                  isEditing
                    ? "bg-gray-50 text-gray-600 border-gray-300 cursor-not-allowed"
                    : ""
                }`}
              />
              {isEditing && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
              )}
            </div>
            {errors.userName && (
              <div className="text-sm text-red-600 mt-1">{errors.userName}</div>
            )}
            {!isEditing && (
              <p className="text-xs text-gray-500 mt-1">
                Username cannot be changed once created
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <Label htmlFor="password">
              Password{" "}
              {isEditing ? (
                "(Optional)"
              ) : (
                <span className="text-red-500">*</span>
              )}
            </Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                placeholder={
                  isEditing
                    ? "Leave blank to keep current password"
                    : "Enter password"
                }
                type={showPassword ? "text" : "password"}
                value={user.password || ""}
                onChange={handleChange}
                error={!!errors.password}
                disabled={loading}
              />
              <span
                onClick={() => !loading && setShowPassword(!showPassword)}
                className={`absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2 ${
                  loading ? "cursor-not-allowed opacity-50" : ""
                }`}
              >
                {showPassword ? (
                  <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                ) : (
                  <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                )}
              </span>
            </div>
            {errors.password && (
              <div className="text-sm text-red-600 mt-1">{errors.password}</div>
            )}
            {!isEditing && (
              <p className="text-xs text-gray-500 mt-1">
                Must be at least 6 characters
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <Label htmlFor="passwordConfirm">
              Confirm Password{" "}
              {isEditing ? (
                "(Optional)"
              ) : (
                <span className="text-red-500">*</span>
              )}
            </Label>
            <div className="relative">
              <Input
                id="passwordConfirm"
                name="passwordConfirm"
                placeholder={
                  isEditing
                    ? "Leave blank to keep current password"
                    : "Confirm password"
                }
                type={showConfirmPassword ? "text" : "password"}
                value={user.passwordConfirm || ""}
                onChange={handleChange}
                error={!!errors.passwordConfirm}
                disabled={loading}
              />
              <span
                onClick={() =>
                  !loading && setShowConfirmPassword(!showConfirmPassword)
                }
                className={`absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2 ${
                  loading ? "cursor-not-allowed opacity-50" : ""
                }`}
              >
                {showConfirmPassword ? (
                  <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                ) : (
                  <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                )}
              </span>
            </div>

            {errors.passwordConfirm && (
              <div className="text-sm text-red-600 mt-1">
                {errors.passwordConfirm}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="md:col-span-2 pt-4 border-t border-gray-200">
            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 py-2.5 bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300 rounded-lg font-medium"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    {isEditing ? "Updating..." : "Creating..."}
                  </span>
                ) : isEditing ? (
                  "Update User"
                ) : (
                  "Create User"
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
