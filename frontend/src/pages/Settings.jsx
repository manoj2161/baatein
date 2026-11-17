import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Mail,
  Phone,
  Shield,
  Trash2,
  UserRound,
  Eye,
  EyeOff,
  LoaderCircle,
  CheckCircle2,
  AlertCircle,
  Ban,
  RefreshCw,
} from "lucide-react";

import Sidebar from "../components/Sidebar";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function Settings() {
  const navigate = useNavigate();

  const { clearAuth, updateUser } = useAuth();

  const [loading, setLoading] = useState(true);

  const [user, setUser] = useState(null);
  const [blockedUsers, setBlockedUsers] = useState([]);

  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);

  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneLoading, setPhoneLoading] = useState(false);

  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showDeletePassword, setShowDeletePassword] = useState(false);

  const [unblockingId, setUnblockingId] = useState(null);

  const [message, setMessage] = useState({
    type: "",
    text: "",
  });

  // -----------------------------------------
  // LOAD SETTINGS DATA
  // -----------------------------------------

  const loadSettings = async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      }

      const [profileResponse, blockedResponse] = await Promise.all([
        api.get("/users/profile"),
        api.get("/users/blocked"),
      ]);

      const profile = profileResponse.data.user || profileResponse.data.profile;

      const blocked =
        blockedResponse.data.users || blockedResponse.data.blockedUsers || [];

      setUser(profile);
      setBlockedUsers(blocked);

      setEmail(profile?.email || "");
      setPhoneNumber(profile?.phoneNumber || "");
    } catch (error) {
      console.error("Settings loading error:", error);

      setMessage({
        type: "error",
        text: error.response?.data?.message || "Unable to load settings.",
      });
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  // -----------------------------------------
  // SHOW MESSAGE
  // -----------------------------------------

  const showMessage = (type, text) => {
    setMessage({ type, text });
  };

  // -----------------------------------------
  // REQUEST EMAIL CHANGE
  // -----------------------------------------

  const handleEmailChange = async (e) => {
    e.preventDefault();

    if (!email.trim() || !currentPassword) {
      return showMessage("error", "Enter your new email and current password.");
    }

    try {
      setEmailLoading(true);
      setMessage({ type: "", text: "" });

      const response = await api.post("/users/settings/email", {
        email: email.trim(),
        currentPassword,
      });

      setCurrentPassword("");

      showMessage(
        "success",
        response.data.message ||
          "Verification link sent to your new email address.",
      );

      await loadSettings(false);
    } catch (error) {
      showMessage(
        "error",
        error.response?.data?.message || "Unable to request email change.",
      );
    } finally {
      setEmailLoading(false);
    }
  };

  // -----------------------------------------
  // UPDATE PHONE NUMBER
  // -----------------------------------------

  const handlePhoneUpdate = async (e) => {
    try {
      e.preventDefault();

      setPhoneLoading(true);
      setMessage({ type: "", text: "" });

      const response = await api.put("/users/settings/phone", {
        phoneNumber: phoneNumber.trim(),
      });

      const updatedUser = response.data.user;

      if (updatedUser) {
        setUser(updatedUser);

        if (typeof updateUser === "function") {
          updateUser(updatedUser);
        }
      }

      showMessage(
        "success",
        response.data.message || "Phone number updated successfully.",
      );
    } catch (error) {
      showMessage(
        "error",
        error.response?.data?.message || "Unable to update phone number.",
      );
    } finally {
      setPhoneLoading(false);
    }
  };

  // -----------------------------------------
  // UNBLOCK USER
  // -----------------------------------------

  const handleUnblock = async (userId) => {
    try {
      setUnblockingId(userId);

      await api.delete(`/users/${userId}/block`);

      setBlockedUsers((previous) =>
        previous.filter((blockedUser) => blockedUser._id !== userId),
      );

      showMessage("success", "User unblocked successfully.");
    } catch (error) {
      showMessage(
        "error",
        error.response?.data?.message || "Unable to unblock this user.",
      );
    } finally {
      setUnblockingId(null);
    }
  };

  // -----------------------------------------
  // DELETE ACCOUNT
  // -----------------------------------------

  const handleDeleteAccount = async (e) => {
    e.preventDefault();

    if (!deletePassword || deleteConfirmation !== "DELETE") {
      return showMessage(
        "error",
        'Enter your password and type "DELETE" exactly.',
      );
    }

    const confirmed = window.confirm(
      "This action is permanent. Your account and personal content will be deleted. Your chat history will remain visible to other participants as Deleted Account. Continue?",
    );

    if (!confirmed) return;

    try {
      setDeleteLoading(true);
      setMessage({ type: "", text: "" });

      await api.delete("/users/settings/account", {
        data: {
          password: deletePassword,
          confirmation: deleteConfirmation,
        },
      });

      clearAuth();

      navigate("/login", {
        replace: true,
        state: {
          message: "Your account has been deleted successfully.",
        },
      });
    } catch (error) {
      showMessage(
        "error",
        error.response?.data?.message || "Unable to delete your account.",
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  // -----------------------------------------
  // MESSAGE COMPONENT
  // -----------------------------------------

  const MessageAlert = () => {
    if (!message.text) return null;

    const isSuccess = message.type === "success";

    return (
      <div
        className={`mb-5 flex items-start gap-3 rounded-xl border p-4 ${
          isSuccess
            ? "border-green-200 bg-green-50 text-green-700"
            : "border-red-200 bg-red-50 text-red-600"
        }`}
      >
        {isSuccess ? (
          <CheckCircle2 size={19} className="mt-0.5 shrink-0" />
        ) : (
          <AlertCircle size={19} className="mt-0.5 shrink-0" />
        )}

        <p className="text-sm">{message.text}</p>
      </div>
    );
  };

  // -----------------------------------------
  // LOADING
  // -----------------------------------------

  if (loading) {
    return (
      <>
        <Sidebar />

        <main className="flex min-h-screen items-center justify-center bg-[#fafafa] pt-14 pb-20 md:ml-[220px] md:pt-0 md:pb-0 lg:ml-[240px]">
          <LoaderCircle size={32} className="animate-spin text-[#315efb]" />
        </main>
      </>
    );
  }

  return (
    <>
      <Sidebar />

      <main className="min-h-screen bg-[#fafafa] px-4 pt-20 pb-28 sm:px-6 md:ml-[220px] md:px-8 md:pt-8 md:pb-10 lg:ml-[240px]">
        <div className="mx-auto max-w-3xl">
          {/* HEADER */}
          <div className="mb-7 flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              aria-label="Go back"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white transition hover:bg-gray-100"
            >
              <ArrowLeft size={19} />
            </button>

            <div>
              <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

              <p className="mt-1 text-sm text-gray-500">
                Manage your account and preferences.
              </p>
            </div>
          </div>

          <MessageAlert />

          {/* ACCOUNT INFORMATION */}
          <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#315efb]">
                <UserRound size={21} />
              </div>

              <div>
                <h2 className="font-semibold text-gray-900">
                  Account information
                </h2>

                <p className="text-xs text-gray-500">
                  Your Baatein account details.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex flex-col gap-1 border-b border-gray-100 pb-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm text-gray-500">Username</span>

                <span className="text-sm font-medium text-gray-900">
                  @{user?.username || "Unknown"}
                </span>
              </div>

              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm text-gray-500">Full name</span>

                <span className="text-sm font-medium text-gray-900">
                  {user?.fullName || "Not added"}
                </span>
              </div>
            </div>
          </section>

          {/* EMAIL SETTINGS */}
          <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#315efb]">
                <Mail size={21} />
              </div>

              <div>
                <h2 className="font-semibold text-gray-900">Email address</h2>

                <p className="text-xs text-gray-500">
                  Change your email address securely.
                </p>
              </div>
            </div>

            <div className="mb-5 rounded-xl bg-gray-50 p-4">
              <p className="mb-1 text-xs text-gray-500">Current email</p>

              <p className="break-all text-sm font-medium text-gray-900">
                {user?.email || "No email available"}
              </p>

              {user?.pendingEmail && (
                <div className="mt-3 border-t border-gray-200 pt-3">
                  <p className="mb-1 text-xs font-medium text-orange-600">
                    Verification pending
                  </p>

                  <p className="break-all text-sm text-gray-700">
                    {user.pendingEmail}
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Check your new email inbox for the verification link.
                  </p>
                </div>
              )}
            </div>

            <form onSubmit={handleEmailChange} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  New email address
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter new email address"
                  required
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#315efb] focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Current password
                </label>

                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter your current password"
                    required
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 pr-12 text-sm outline-none transition focus:border-[#315efb] focus:ring-2 focus:ring-blue-100"
                  />

                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                    aria-label="Toggle password visibility"
                  >
                    {showCurrentPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={emailLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#315efb] px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60 sm:w-auto"
              >
                {emailLoading && (
                  <LoaderCircle size={17} className="animate-spin" />
                )}

                {emailLoading ? "Sending..." : "Send verification link"}
              </button>
            </form>
          </section>

          {/* PHONE SETTINGS */}
          <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#315efb]">
                <Phone size={21} />
              </div>

              <div>
                <h2 className="font-semibold text-gray-900">Phone number</h2>

                <p className="text-xs text-gray-500">
                  Add or update your contact number.
                </p>
              </div>
            </div>

            <form onSubmit={handlePhoneUpdate} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Phone number
                </label>

                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+919876543210"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#315efb] focus:ring-2 focus:ring-blue-100"
                />

                <p className="mt-2 text-xs text-gray-400">
                  Include your country code. Phone numbers are not SMS-verified
                  yet.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  disabled={phoneLoading}
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#315efb] px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                >
                  {phoneLoading && (
                    <LoaderCircle size={17} className="animate-spin" />
                  )}
                  Save phone number
                </button>

                {user?.phoneNumber && (
                  <button
                    type="button"
                    disabled={phoneLoading}
                    onClick={() => setPhoneNumber("")}
                    className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-60"
                  >
                    Remove number
                  </button>
                )}
              </div>
            </form>
          </section>

          {/* BLOCKED USERS */}
          <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#315efb]">
                <Ban size={21} />
              </div>

              <div>
                <h2 className="font-semibold text-gray-900">
                  Blocked accounts
                </h2>

                <p className="text-xs text-gray-500">
                  Manage the accounts you have blocked.
                </p>
              </div>
            </div>

            {blockedUsers.length === 0 ? (
              <div className="rounded-xl bg-gray-50 px-4 py-8 text-center">
                <Shield size={28} className="mx-auto mb-2 text-gray-400" />

                <p className="text-sm font-medium text-gray-700">
                  No blocked accounts
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Accounts you block will appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {blockedUsers.map((blockedUser) => (
                  <div
                    key={blockedUser._id}
                    className="flex items-center gap-3 py-3"
                  >
                    <img
                      src={
                        blockedUser.profilePicture ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          blockedUser.username || "User",
                        )}&background=e5e7eb&color=374151`
                      }
                      alt={blockedUser.username || "User"}
                      className="h-11 w-11 shrink-0 rounded-full object-cover"
                    />

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {blockedUser.fullName || blockedUser.username}
                      </p>

                      <p className="truncate text-xs text-gray-500">
                        @{blockedUser.username}
                      </p>
                    </div>

                    <button
                      onClick={() => handleUnblock(blockedUser._id)}
                      disabled={unblockingId === blockedUser._id}
                      className="flex shrink-0 items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-100 disabled:opacity-50"
                    >
                      {unblockingId === blockedUser._id ? (
                        <LoaderCircle size={14} className="animate-spin" />
                      ) : (
                        <RefreshCw size={14} />
                      )}
                      Unblock
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* DELETE ACCOUNT */}
          <section className="mb-6 rounded-2xl border border-red-200 bg-white p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
                <Trash2 size={21} />
              </div>

              <div>
                <h2 className="font-semibold text-red-600">Delete account</h2>

                <p className="text-xs text-gray-500">
                  Permanently delete your Baatein account.
                </p>
              </div>
            </div>

            <div className="mb-5 rounded-xl bg-red-50 p-4">
              <p className="text-sm font-medium text-red-700">
                This action cannot be undone.
              </p>

              <p className="mt-2 text-xs leading-5 text-red-600">
                Your profile, posts, stories, and personal information will be
                deleted. Your existing chat history will remain visible to other
                participants under the name "Deleted Account".
              </p>
            </div>

            <form onSubmit={handleDeleteAccount} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Current password
                </label>

                <div className="relative">
                  <input
                    type={showDeletePassword ? "text" : "password"}
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 pr-12 text-sm outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100"
                  />

                  <button
                    type="button"
                    onClick={() => setShowDeletePassword(!showDeletePassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                    aria-label="Toggle password visibility"
                  >
                    {showDeletePassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Type DELETE to confirm
                </label>

                <input
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder="DELETE"
                  autoComplete="off"
                  required
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100"
                />
              </div>

              <button
                type="submit"
                disabled={
                  deleteLoading ||
                  !deletePassword ||
                  deleteConfirmation !== "DELETE"
                }
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                {deleteLoading && (
                  <LoaderCircle size={17} className="animate-spin" />
                )}

                <Trash2 size={17} />

                {deleteLoading ? "Deleting account..." : "Delete my account"}
              </button>
            </form>
          </section>

          <p className="pb-4 text-center text-xs text-gray-400">
            Baatein Account Settings
          </p>
        </div>
      </main>
    </>
  );
}
