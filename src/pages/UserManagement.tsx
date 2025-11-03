/**
 * User Management Page (Supervisor Only)
 *
 * Manage employees: create, edit, disable, and reset passwords
 */

import { useState, useEffect } from "react";
import {
  subscribeToUsers,
  updateUser,
  disableUser,
  enableUser,
  resetUserPassword,
  createUser,
} from "../services/userManagement";
import type { User, UpdateUserData } from "../types/user";
import { useToast } from "../hooks/useToast";
import Header from "../components/ui/Header";
import Button from "../components/ui/Button";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import EmptyState from "../components/ui/EmptyState";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import Tag from "../components/ui/Tag";

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "employee" | "supervisor">("all");
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDisable, setUserToDisable] = useState<User | null>(null);
  const [userToEnable, setUserToEnable] = useState<User | null>(null);
  const [userForPasswordReset, setUserForPasswordReset] = useState<User | null>(null);
  const toast = useToast();

  // Subscribe to real-time user updates
  useEffect(() => {
    const unsubscribe = subscribeToUsers((updatedUsers) => {
      setUsers(updatedUsers);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Filter users based on search and role
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      searchQuery === "" ||
      user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === "all" || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  function handleAddNew() {
    setEditingUser(null);
    setShowForm(true);
  }

  function handleEdit(user: User) {
    setEditingUser(user);
    setShowForm(true);
  }

  async function handleDisable(user: User) {
    try {
      await disableUser(user.uid);
      toast.success(`${user.displayName} disabled`);
      setUserToDisable(null);
    } catch (error) {
      console.error("Error disabling user:", error);
      toast.error("Failed to disable user");
    }
  }

  async function handleEnable(user: User) {
    try {
      await enableUser(user.uid);
      toast.success(`${user.displayName} enabled`);
      setUserToEnable(null);
    } catch (error) {
      console.error("Error enabling user:", error);
      toast.error("Failed to enable user");
    }
  }

  async function handlePasswordReset(user: User) {
    try {
      await resetUserPassword(user.email);
      toast.success(`Password reset email sent to ${user.email}`);
      setUserForPasswordReset(null);
    } catch (error) {
      console.error("Error sending password reset:", error);
      toast.error("Failed to send password reset email");
    }
  }

  if (loading) {
    return (
      <div className="pb-20 min-h-screen bg-slate-50">
        <Header title="User Management" subtitle="Loading users..." />
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20 min-h-screen bg-slate-50">
      <Header
        title="User Management"
        subtitle={`${filteredUsers.length} ${filteredUsers.length === 1 ? "user" : "users"}`}
      />

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Actions and Filters */}
        <div className="space-y-3">
          <Button onClick={handleAddNew} className="w-full" size="lg">
            + Create Employee
          </Button>

          {/* Search */}
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border-2 border-slate-200 p-3 text-sm shadow-sm focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-100"
          />

          {/* Role Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setRoleFilter("all")}
              className={`flex-1 px-4 py-2 rounded-xl font-semibold text-sm transition-colors ${
                roleFilter === "all"
                  ? "bg-orange-500 text-white"
                  : "bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setRoleFilter("employee")}
              className={`flex-1 px-4 py-2 rounded-xl font-semibold text-sm transition-colors ${
                roleFilter === "employee"
                  ? "bg-orange-500 text-white"
                  : "bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              Employees
            </button>
            <button
              onClick={() => setRoleFilter("supervisor")}
              className={`flex-1 px-4 py-2 rounded-xl font-semibold text-sm transition-colors ${
                roleFilter === "supervisor"
                  ? "bg-orange-500 text-white"
                  : "bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              Supervisors
            </button>
          </div>
        </div>

        {/* Users List */}
        {filteredUsers.length === 0 ? (
          <EmptyState
            icon="ðŸ‘¥"
            title="No users found"
            description={
              searchQuery || roleFilter !== "all"
                ? "Try adjusting your filters"
                : "Create your first employee to get started"
            }
          />
        ) : (
          <div className="space-y-3">
            {filteredUsers.map((user) => (
              <div
                key={user.uid}
                className={`bg-white rounded-2xl shadow-sm border-2 p-5 ${
                  user.disabled
                    ? "border-slate-300 opacity-60"
                    : "border-slate-200"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-lg text-slate-900">
                        {user.displayName}
                      </h3>
                      <Tag
                        kind={user.role === "supervisor" ? "info" : undefined}
                        className={
                          user.role === "supervisor"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-slate-100 text-slate-700"
                        }
                      >
                        {user.role === "supervisor" ? "Supervisor" : "Employee"}
                      </Tag>
                      {user.disabled && (
                        <Tag kind="overdue">Disabled</Tag>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 mt-1">{user.email}</p>
                    {user.jobTitle && (
                      <p className="text-xs text-slate-500 mt-1">
                        {user.jobTitle}
                      </p>
                    )}
                    {user.phoneNumber && (
                      <p className="text-xs text-slate-500">{user.phoneNumber}</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 mt-4">
                  <button
                    onClick={() => handleEdit(user)}
                    className="flex-1 px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold text-sm transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setUserForPasswordReset(user)}
                    className="flex-1 px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-semibold text-sm transition-colors"
                  >
                    Reset Password
                  </button>
                  {user.disabled ? (
                    <button
                      onClick={() => setUserToEnable(user)}
                      className="flex-1 px-4 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white font-semibold text-sm transition-colors"
                    >
                      Enable
                    </button>
                  ) : (
                    <button
                      onClick={() => setUserToDisable(user)}
                      className="flex-1 px-4 py-2 rounded-xl bg-slate-500 hover:bg-slate-600 text-white font-semibold text-sm transition-colors"
                    >
                      Disable
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User Form Modal */}
      {showForm && (
        <UserFormModal
          user={editingUser}
          onClose={() => {
            setShowForm(false);
            setEditingUser(null);
          }}
          onSave={() => {
            setShowForm(false);
            setEditingUser(null);
          }}
        />
      )}

      {/* Disable Confirmation */}
      {userToDisable && (
        <ConfirmDialog
          isOpen={true}
          title="Disable User"
          message={`Are you sure you want to disable "${userToDisable.displayName}"? They will no longer be able to access the system.`}
          confirmLabel="Disable"
          cancelLabel="Cancel"
          variant="warning"
          onConfirm={() => handleDisable(userToDisable)}
          onCancel={() => setUserToDisable(null)}
        />
      )}

      {/* Enable Confirmation */}
      {userToEnable && (
        <ConfirmDialog
          isOpen={true}
          title="Enable User"
          message={`Are you sure you want to enable "${userToEnable.displayName}"? They will regain access to the system.`}
          confirmLabel="Enable"
          cancelLabel="Cancel"
          variant="warning"
          onConfirm={() => handleEnable(userToEnable)}
          onCancel={() => setUserToEnable(null)}
        />
      )}

      {/* Password Reset Confirmation */}
      {userForPasswordReset && (
        <ConfirmDialog
          isOpen={true}
          title="Reset Password"
          message={`Send password reset email to ${userForPasswordReset.email}?`}
          confirmLabel="Send Email"
          cancelLabel="Cancel"
          variant="warning"
          onConfirm={() => handlePasswordReset(userForPasswordReset)}
          onCancel={() => setUserForPasswordReset(null)}
        />
      )}
    </div>
  );
}

// User Form Modal Component
interface UserFormModalProps {
  user: User | null;
  onClose: () => void;
  onSave: () => void;
}

function UserFormModal({ user, onClose, onSave }: UserFormModalProps) {
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || "");
  const [jobTitle, setJobTitle] = useState(user?.jobTitle || "");
  const [role, setRole] = useState<"employee" | "supervisor">(
    user?.role || "employee"
  );
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      if (user) {
        // Update existing user
        const updates: UpdateUserData = {
          displayName: displayName.trim(),
          phoneNumber: phoneNumber.trim() || undefined,
          jobTitle: jobTitle.trim() || undefined,
          role,
        };

        await updateUser(user.uid, updates);
        toast.success(`${displayName} updated`);
      } else {
        // Create new user
        if (!password) {
          toast.error("Password is required for new users");
          setSaving(false);
          return;
        }

        await createUser({
          email: email.trim(),
          password,
          displayName: displayName.trim(),
          role,
          phoneNumber: phoneNumber.trim() || undefined,
          jobTitle: jobTitle.trim() || undefined,
        });
        toast.success(`${displayName} created`);
      }

      onSave();
    } catch (error) {
      console.error("Error saving user:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save user"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <h2 className="text-2xl font-bold text-slate-900">
            {user ? "Edit User" : "Create New Employee"}
          </h2>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Display Name <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              placeholder="John Doe"
              className="w-full rounded-xl border-2 border-slate-200 p-3 text-sm shadow-sm focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-100"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Email <span className="text-error">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={!!user}
              placeholder="john.doe@company.com"
              className="w-full rounded-xl border-2 border-slate-200 p-3 text-sm shadow-sm focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-100 disabled:bg-slate-100 disabled:cursor-not-allowed"
            />
            {user && (
              <p className="mt-1 text-xs text-slate-500">
                Email cannot be changed after creation
              </p>
            )}
          </div>

          {!user && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Password <span className="text-error">*</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={!user}
                placeholder="Minimum 6 characters"
                minLength={6}
                className="w-full rounded-xl border-2 border-slate-200 p-3 text-sm shadow-sm focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-100"
              />
              <p className="mt-1 text-xs text-slate-500">
                User can change this after first login
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="(555) 123-4567"
              className="w-full rounded-xl border-2 border-slate-200 p-3 text-sm shadow-sm focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-100"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Job Title
            </label>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="Equipment Operator"
              className="w-full rounded-xl border-2 border-slate-200 p-3 text-sm shadow-sm focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-100"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Role <span className="text-error">*</span>
            </label>
            <div className="flex gap-3">
              <label className="flex-1 cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  value="employee"
                  checked={role === "employee"}
                  onChange={(e) =>
                    setRole(e.target.value as "employee" | "supervisor")
                  }
                  className="sr-only"
                />
                <div
                  className={`p-3 rounded-xl border-2 text-center font-semibold text-sm transition-colors ${
                    role === "employee"
                      ? "border-orange-500 bg-orange-50 text-orange-700"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  Employee
                </div>
              </label>
              <label className="flex-1 cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  value="supervisor"
                  checked={role === "supervisor"}
                  onChange={(e) =>
                    setRole(e.target.value as "employee" | "supervisor")
                  }
                  className="sr-only"
                />
                <div
                  className={`p-3 rounded-xl border-2 text-center font-semibold text-sm transition-colors ${
                    role === "supervisor"
                      ? "border-orange-500 bg-orange-50 text-orange-700"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  Supervisor
                </div>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              loading={saving}
              disabled={saving}
              className="flex-1"
              size="lg"
            >
              {saving ? "Saving..." : user ? "Update User" : "Create User"}
            </Button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-xl border-2 border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

