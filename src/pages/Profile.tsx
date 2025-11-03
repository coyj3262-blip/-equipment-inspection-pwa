/**
 * Profile Page
 *
 * View and edit own profile information
 * Change password functionality
 */

import { useState, useEffect } from "react";
import { getUser, updateOwnProfile, changePassword } from "../services/userManagement";
import type { User, UpdateProfileData } from "../types/user";
import { useToast } from "../hooks/useToast";
import { formatMemberSinceDate } from "../utils/dateFormatting";
import Header from "../components/ui/Header";
import Button from "../components/ui/Button";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import Tag from "../components/ui/Tag";
import { auth } from "../firebase";

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const toast = useToast();

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        toast.error("Not authenticated");
        return;
      }

      const userData = await getUser(currentUser.uid);
      if (userData) {
        setUser(userData);
      } else {
        toast.error("Profile not found");
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="pb-20 min-h-screen bg-slate-50">
        <Header title="My Profile" subtitle="Loading profile..." />
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="pb-20 min-h-screen bg-slate-50">
        <Header title="My Profile" subtitle="Profile not found" />
        <div className="max-w-2xl mx-auto p-4">
          <div className="bg-white rounded-2xl shadow-sm border-2 border-slate-200 p-6 text-center">
            <p className="text-slate-600">Unable to load profile data</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20 min-h-screen bg-slate-50">
      <Header title="My Profile" subtitle={user.displayName} />

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Profile Display */}
        {!editing && (
          <div className="bg-white rounded-2xl shadow-sm border-2 border-slate-200 p-6">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-2xl font-bold text-slate-900">
                      {user.displayName}
                    </h2>
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
                  </div>
                  <p className="text-sm text-slate-600">{user.email}</p>
                </div>
              </div>

              {user.jobTitle && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Job Title
                  </label>
                  <p className="text-sm text-slate-900">{user.jobTitle}</p>
                </div>
              )}

              {user.phoneNumber && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Phone Number
                  </label>
                  <p className="text-sm text-slate-900">{user.phoneNumber}</p>
                </div>
              )}

              <div className="pt-2">
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Member Since
                </label>
                <p className="text-sm text-slate-900">
                  {formatMemberSinceDate(user.createdAt)}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-6">
              <Button onClick={() => setEditing(true)} className="w-full">
                Edit Profile
              </Button>
              <button
                onClick={() => setShowPasswordChange(true)}
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-sm transition-colors"
              >
                Change Password
              </button>
            </div>
          </div>
        )}

        {/* Profile Edit Form */}
        {editing && (
          <ProfileEditForm
            user={user}
            onCancel={() => setEditing(false)}
            onSave={(updatedUser) => {
              setUser(updatedUser);
              setEditing(false);
            }}
          />
        )}

        {/* Password Change Modal */}
        {showPasswordChange && (
          <PasswordChangeModal
            onClose={() => setShowPasswordChange(false)}
            onSuccess={() => {
              setShowPasswordChange(false);
              toast.success("Password changed successfully");
            }}
          />
        )}
      </div>
    </div>
  );
}

// Profile Edit Form Component
interface ProfileEditFormProps {
  user: User;
  onCancel: () => void;
  onSave: (user: User) => void;
}

function ProfileEditForm({ user, onCancel, onSave }: ProfileEditFormProps) {
  const [displayName, setDisplayName] = useState(user.displayName);
  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber || "");
  const [jobTitle, setJobTitle] = useState(user.jobTitle || "");
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const updates: UpdateProfileData = {
        displayName: displayName.trim(),
        phoneNumber: phoneNumber.trim() || undefined,
        jobTitle: jobTitle.trim() || undefined,
      };

      await updateOwnProfile(updates);
      toast.success("Profile updated successfully");

      // Update local user object
      onSave({
        ...user,
        ...updates,
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border-2 border-slate-200 p-6">
      <form onSubmit={handleSubmit} className="space-y-5">
        <h3 className="text-xl font-bold text-slate-900">Edit Profile</h3>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Display Name <span className="text-error">*</span>
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            placeholder="Your full name"
            className="w-full rounded-xl border-2 border-slate-200 p-3 text-sm shadow-sm focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-100"
          />
        </div>

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
            placeholder="Your job title"
            className="w-full rounded-xl border-2 border-slate-200 p-3 text-sm shadow-sm focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-100"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="submit"
            loading={saving}
            disabled={saving}
            className="flex-1"
            size="lg"
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 rounded-xl border-2 border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-sm transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

// Password Change Modal Component
interface PasswordChangeModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function PasswordChangeModal({ onClose, onSuccess }: PasswordChangeModalProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setSaving(true);

    try {
      await changePassword(newPassword);
      onSuccess();
    } catch (error) {
      console.error("Error changing password:", error);
      if (error instanceof Error) {
        // Firebase error messages are helpful
        if (error.message.includes("requires-recent-login")) {
          toast.error("Please log out and log back in before changing password");
        } else {
          toast.error(error.message);
        }
      } else {
        toast.error("Failed to change password");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <h2 className="text-2xl font-bold text-slate-900">Change Password</h2>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              New Password <span className="text-error">*</span>
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Minimum 6 characters"
              className="w-full rounded-xl border-2 border-slate-200 p-3 text-sm shadow-sm focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-100"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Confirm Password <span className="text-error">*</span>
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Re-enter new password"
              className="w-full rounded-xl border-2 border-slate-200 p-3 text-sm shadow-sm focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-100"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              loading={saving}
              disabled={saving}
              className="flex-1"
              size="lg"
            >
              {saving ? "Changing..." : "Change Password"}
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

