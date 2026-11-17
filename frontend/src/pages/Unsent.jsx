import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  PenLine,
  Send,
  Heart,
  LoaderCircle,
  Trash2,
  Lock,
  Users,
  Globe,
  ChevronDown,
  MessageCircle,
  Feather,
  X,
  CornerDownRight,
} from "lucide-react";

import Sidebar from "../components/Sidebar";
import {
  createUnsent,
  getUnsentFeed,
  getMyUnsent,
  toggleUnsentReaction,
  deleteUnsent,
  getUnsentReplies,
  createUnsentReply,
  deleteUnsentReply,
} from "../services/unsentService";

const categories = [
  "To Someone",
  "To My Past",
  "To My Future",
  "An Apology",
  "A Thank You",
  "A Goodbye",
  "A Dream",
  "A Secret",
];

const visibilityOptions = [
  {
    value: "anonymous",
    label: "Anonymous",
    description: "Your identity stays hidden from other users.",
    icon: Lock,
  },
  {
    value: "followers",
    label: "Followers",
    description: "Only your followers can read this.",
    icon: Users,
  },
  {
    value: "public",
    label: "Public",
    description: "Anyone can read this with your identity visible.",
    icon: Globe,
  },
];

const formatDate = (date) => {
  if (!date) return "";

  const messageDate = new Date(date);

  if (Number.isNaN(messageDate.getTime())) return "";

  return messageDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const Unsent = () => {
  const [messages, setMessages] = useState([]);
  const [activeTab, setActiveTab] = useState("feed");

  const [content, setContent] = useState("");
  const [category, setCategory] = useState("To Someone");
  const [visibility, setVisibility] = useState("anonymous");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reactingId, setReactingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showComposer, setShowComposer] = useState(false);

  // REPLIES
  const [expandedReplies, setExpandedReplies] = useState({});
  const [replies, setReplies] = useState({});
  const [replyInputs, setReplyInputs] = useState({});
  const [loadingReplies, setLoadingReplies] = useState({});
  const [submittingReply, setSubmittingReply] = useState({});
  const [deletingReply, setDeletingReply] = useState(null);

  const loadMessages = async (tab = activeTab) => {
    try {
      setLoading(true);
      setError("");

      const data = tab === "my" ? await getMyUnsent() : await getUnsentFeed();

      setMessages(data);
    } catch (err) {
      console.error("Failed to load Unsent messages:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load messages. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages(activeTab);
  }, [activeTab]);

  const handleCreate = async (e) => {
    e.preventDefault();

    if (!content.trim()) {
      setError("Write something before sharing.");
      return;
    }

    if (content.trim().length > 5000) {
      setError("Your message cannot exceed 5000 characters.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      await createUnsent({
        content: content.trim(),
        category,
        visibility,
      });

      setContent("");
      setCategory("To Someone");
      setVisibility("anonymous");
      setShowComposer(false);

      setSuccess("Your unsent message has been shared.");

      await loadMessages(activeTab);
    } catch (err) {
      console.error("Failed to create Unsent message:", err);

      setError(
        err.response?.data?.message ||
          "Unable to share your message. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleReaction = async (messageId) => {
    try {
      setReactingId(messageId);

      const response = await toggleUnsentReaction(messageId);

      setMessages((previous) =>
        previous.map((message) =>
          message._id === messageId
            ? {
                ...message,
                isReacted: response.isReacted,
                reactionCount: response.reactionCount,
              }
            : message,
        ),
      );
    } catch (err) {
      console.error("Failed to react to Unsent message:", err);

      setError(
        err.response?.data?.message || "Unable to update your reaction.",
      );
    } finally {
      setReactingId(null);
    }
  };

  const handleDelete = async (messageId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this unsent message?",
    );

    if (!confirmed) return;

    try {
      setDeletingId(messageId);

      await deleteUnsent(messageId);

      setMessages((previous) =>
        previous.filter((message) => message._id !== messageId),
      );

      setSuccess("Message deleted.");
    } catch (err) {
      console.error("Failed to delete Unsent message:", err);

      setError(err.response?.data?.message || "Unable to delete this message.");
    } finally {
      setDeletingId(null);
    }
  };

  // LOAD REPLIES
  const handleToggleReplies = async (messageId) => {
    if (expandedReplies[messageId]) {
      setExpandedReplies((previous) => ({
        ...previous,
        [messageId]: false,
      }));

      return;
    }

    setExpandedReplies((previous) => ({
      ...previous,
      [messageId]: true,
    }));

    if (replies[messageId]) return;

    try {
      setLoadingReplies((previous) => ({
        ...previous,
        [messageId]: true,
      }));

      const data = await getUnsentReplies(messageId);

      setReplies((previous) => ({
        ...previous,
        [messageId]: data,
      }));
    } catch (err) {
      console.error("Failed to load replies:", err);

      setError(err.response?.data?.message || "Unable to load replies.");

      setExpandedReplies((previous) => ({
        ...previous,
        [messageId]: false,
      }));
    } finally {
      setLoadingReplies((previous) => ({
        ...previous,
        [messageId]: false,
      }));
    }
  };

  // CREATE ANONYMOUS REPLY
  const handleCreateReply = async (messageId) => {
    const replyContent = replyInputs[messageId]?.trim();

    if (!replyContent) return;

    if (replyContent.length > 1000) {
      setError("Reply cannot exceed 1000 characters.");
      return;
    }

    try {
      setSubmittingReply((previous) => ({
        ...previous,
        [messageId]: true,
      }));

      setError("");

      const response = await createUnsentReply(messageId, replyContent);

      setReplies((previous) => ({
        ...previous,
        [messageId]: [...(previous[messageId] || []), response.reply],
      }));

      setReplyInputs((previous) => ({
        ...previous,
        [messageId]: "",
      }));

      setMessages((previous) =>
        previous.map((message) =>
          message._id === messageId
            ? {
                ...message,
                replyCount: response.replyCount,
              }
            : message,
        ),
      );
    } catch (err) {
      console.error("Failed to create reply:", err);

      setError(err.response?.data?.message || "Unable to publish your reply.");
    } finally {
      setSubmittingReply((previous) => ({
        ...previous,
        [messageId]: false,
      }));
    }
  };

  // DELETE OWN REPLY
  const handleDeleteReply = async (messageId, replyId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this reply?",
    );

    if (!confirmed) return;

    try {
      setDeletingReply(replyId);

      await deleteUnsentReply(messageId, replyId);

      setReplies((previous) => ({
        ...previous,
        [messageId]: (previous[messageId] || []).filter(
          (reply) => reply._id !== replyId,
        ),
      }));

      setMessages((previous) =>
        previous.map((message) =>
          message._id === messageId
            ? {
                ...message,
                replyCount: Math.max(0, (message.replyCount || 0) - 1),
              }
            : message,
        ),
      );
    } catch (err) {
      console.error("Failed to delete reply:", err);

      setError(err.response?.data?.message || "Unable to delete this reply.");
    } finally {
      setDeletingReply(null);
    }
  };

  const getVisibilityIcon = (value) => {
    if (value === "followers") return Users;
    if (value === "public") return Globe;
    return Lock;
  };

  const renderMessage = (message) => {
    const VisibilityIcon = getVisibilityIcon(message.visibility);

    const author = message.author || {};
    const isAnonymous = message.isAnonymous;

    return (
      <article
        key={message._id}
        className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6"
      >
        {/* Author information */}
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            {isAnonymous ? (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                <Lock size={17} />
              </div>
            ) : (
              <Link to={`/profile/${author._id}`} className="shrink-0">
                <img
                  src={
                    author.profilePicture ||
                    "https://placehold.co/100x100?text=User"
                  }
                  alt={author.username || "User"}
                  className="h-10 w-10 rounded-full object-cover"
                />
              </Link>
            )}

            <div className="min-w-0">
              {isAnonymous ? (
                <p className="text-sm font-semibold text-gray-800">Anonymous</p>
              ) : (
                <Link
                  to={`/profile/${author._id}`}
                  className="block truncate text-sm font-semibold text-gray-900 hover:text-[#315efb]"
                >
                  {author.username || "Baatein user"}
                </Link>
              )}

              <p className="text-xs text-gray-500">
                {formatDate(message.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-gray-50 px-3 py-1.5 text-xs text-gray-500">
            <VisibilityIcon size={13} />

            <span className="hidden sm:inline">
              {message.visibility === "anonymous"
                ? "Anonymous"
                : message.visibility === "followers"
                  ? "Followers"
                  : "Public"}
            </span>
          </div>
        </div>

        {/* Category */}
        <div className="mb-3">
          <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[#315efb]">
            {message.category}
          </span>
        </div>

        {/* Message content */}
        <p className="whitespace-pre-wrap break-words text-[15px] leading-7 text-gray-800">
          {message.content}
        </p>

        {/* Actions */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleReaction(message._id)}
              disabled={reactingId === message._id}
              className={`flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition ${
                message.isReacted
                  ? "bg-pink-50 text-pink-600"
                  : "text-gray-500 hover:bg-gray-50 hover:text-pink-600"
              }`}
            >
              {reactingId === message._id ? (
                <LoaderCircle size={17} className="animate-spin" />
              ) : (
                <Heart
                  size={17}
                  className={message.isReacted ? "fill-current" : ""}
                />
              )}

              <span>I felt this too</span>

              <span className="text-xs">{message.reactionCount || 0}</span>
            </button>

            <button
              onClick={() => handleToggleReplies(message._id)}
              className={`flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition ${
                expandedReplies[message._id]
                  ? "bg-blue-50 text-[#315efb]"
                  : "text-gray-500 hover:bg-gray-50 hover:text-[#315efb]"
              }`}
            >
              <MessageCircle size={17} />

              <span>Reply</span>

              <span className="text-xs">{message.replyCount || 0}</span>
            </button>
          </div>

          {activeTab === "my" && (
            <button
              onClick={() => handleDelete(message._id)}
              disabled={deletingId === message._id}
              title="Delete message"
              className="rounded-full p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-500"
            >
              {deletingId === message._id ? (
                <LoaderCircle size={17} className="animate-spin" />
              ) : (
                <Trash2 size={17} />
              )}
            </button>
          )}
        </div>

        {/* REPLIES SECTION */}
        {expandedReplies[message._id] && (
          <div className="mt-4 border-t border-gray-100 pt-4">
            <div className="mb-4 flex items-center gap-2">
              <CornerDownRight size={16} className="text-[#315efb]" />

              <h3 className="text-sm font-semibold text-gray-800">
                Anonymous replies
              </h3>
            </div>

            {loadingReplies[message._id] ? (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-gray-400">
                <LoaderCircle
                  size={18}
                  className="animate-spin text-[#315efb]"
                />
                Loading replies...
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-3">
                  {(replies[message._id] || []).length === 0 ? (
                    <p className="rounded-xl bg-gray-50 px-4 py-5 text-center text-sm text-gray-400">
                      No replies yet. You can be the first to respond.
                    </p>
                  ) : (
                    replies[message._id].map((reply) => (
                      <div
                        key={reply._id}
                        className="rounded-xl bg-gray-50 p-3 sm:p-4"
                      >
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-2">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-gray-500">
                              <Lock size={13} />
                            </div>

                            <div>
                              <p className="text-xs font-semibold text-gray-700">
                                Anonymous
                              </p>

                              <p className="text-[11px] text-gray-400">
                                {formatDate(reply.createdAt)}
                              </p>
                            </div>
                          </div>

                          {activeTab === "my" && (
                            <button
                              onClick={() =>
                                handleDeleteReply(message._id, reply._id)
                              }
                              disabled={deletingReply === reply._id}
                              title="Delete your reply"
                              className="shrink-0 rounded-full p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-500"
                            >
                              {deletingReply === reply._id ? (
                                <LoaderCircle
                                  size={15}
                                  className="animate-spin"
                                />
                              ) : (
                                <Trash2 size={15} />
                              )}
                            </button>
                          )}
                        </div>

                        <p className="whitespace-pre-wrap break-words pl-10 text-sm leading-6 text-gray-700">
                          {reply.content}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                {/* Reply composer */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleCreateReply(message._id);
                  }}
                  className="mt-4"
                >
                  <textarea
                    value={replyInputs[message._id] || ""}
                    onChange={(e) =>
                      setReplyInputs((previous) => ({
                        ...previous,
                        [message._id]: e.target.value,
                      }))
                    }
                    placeholder="Write an anonymous reply..."
                    maxLength={1000}
                    rows={2}
                    className="w-full resize-y rounded-xl border border-gray-200 bg-white p-3 text-sm leading-6 text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-[#315efb]"
                  />

                  <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-[11px] text-gray-400">
                      Your identity will not be displayed.{" "}
                      {(replyInputs[message._id] || "").length}/1000
                    </p>

                    <button
                      type="submit"
                      disabled={
                        submittingReply[message._id] ||
                        !(replyInputs[message._id] || "").trim()
                      }
                      className="flex items-center justify-center gap-2 rounded-lg bg-[#315efb] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {submittingReply[message._id] ? (
                        <LoaderCircle size={16} className="animate-spin" />
                      ) : (
                        <Send size={15} />
                      )}

                      {submittingReply[message._id]
                        ? "Sending..."
                        : "Send anonymously"}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        )}
      </article>
    );
  };

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-[#171717]">
      <Sidebar />

      {/* Mobile top spacing increased from pt-6 to pt-20 */}
      <main className="min-h-screen px-4 pb-24 pt-20 md:ml-[240px] md:px-8 md:pt-6 lg:mr-[320px]">
        <div className="mx-auto w-full max-w-[680px]">
          {/* Header */}
          <div className="mb-7">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#315efb]">
                <Feather size={23} />
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                  The Unsent
                </h1>

                <p className="mt-0.5 text-sm text-gray-500">
                  Words you never got to say.
                </p>
              </div>
            </div>
          </div>

          {/* Intro */}
          <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50/70 p-5">
            <p className="text-sm leading-6 text-gray-700">
              Some words are never sent. Some feelings are never expressed. This
              is a place to let them out.
            </p>

            <button
              onClick={() => {
                setShowComposer(true);
                setError("");
                setSuccess("");
              }}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#315efb] px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 sm:w-auto"
            >
              <PenLine size={17} />
              Write something unsent
            </button>
          </div>

          {/* Notifications */}
          {error && (
            <div className="mb-4 flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              <p>{error}</p>

              <button onClick={() => setError("")}>
                <X size={17} />
              </button>
            </div>
          )}

          {success && (
            <div className="mb-4 flex items-start justify-between gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              <p>{success}</p>

              <button onClick={() => setSuccess("")}>
                <X size={17} />
              </button>
            </div>
          )}

          {/* Composer */}
          {showComposer && (
            <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Write your unsent words
                </h2>

                <button
                  onClick={() => setShowComposer(false)}
                  className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                >
                  <X size={19} />
                </button>
              </div>

              <form onSubmit={handleCreate}>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="If you could say anything without fear, what would you say?"
                  maxLength={5000}
                  rows={6}
                  className="w-full resize-y rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm leading-7 text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[#315efb] focus:bg-white"
                />

                <div className="mb-5 mt-2 flex justify-end">
                  <span className="text-xs text-gray-400">
                    {content.length}/5000
                  </span>
                </div>

                {/* Category */}
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  What is this about?
                </label>

                <div className="relative mb-5">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-3 pr-10 text-sm text-gray-700 outline-none focus:border-[#315efb]"
                  >
                    {categories.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>

                  <ChevronDown
                    size={17}
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                </div>

                {/* Visibility */}
                <label className="mb-3 block text-sm font-semibold text-gray-700">
                  Who can read this?
                </label>

                <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {visibilityOptions.map((option) => {
                    const Icon = option.icon;
                    const selected = visibility === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setVisibility(option.value)}
                        className={`rounded-xl border p-3 text-left transition ${
                          selected
                            ? "border-[#315efb] bg-blue-50"
                            : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                      >
                        <div className="mb-2 flex items-center gap-2">
                          <Icon
                            size={16}
                            className={
                              selected ? "text-[#315efb]" : "text-gray-500"
                            }
                          />

                          <span
                            className={`text-sm font-semibold ${
                              selected ? "text-[#315efb]" : "text-gray-700"
                            }`}
                          >
                            {option.label}
                          </span>
                        </div>

                        <p className="text-xs leading-5 text-gray-500">
                          {option.description}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {visibility === "anonymous" && (
                  <p className="mb-5 rounded-lg bg-gray-50 px-3 py-2 text-xs leading-5 text-gray-500">
                    Your username and profile picture will not be displayed with
                    this message. Baatein still stores your account privately to
                    manage your post.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting || !content.trim()}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#315efb] px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? (
                    <LoaderCircle size={18} className="animate-spin" />
                  ) : (
                    <Send size={17} />
                  )}

                  {submitting ? "Sharing..." : "Share anonymously or publicly"}
                </button>
              </form>
            </div>
          )}

          {/* Tabs */}
          <div className="mb-5 flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("feed")}
              className={`relative flex-1 py-3 text-sm font-semibold transition ${
                activeTab === "feed"
                  ? "text-[#315efb]"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Discover
              {activeTab === "feed" && (
                <span className="absolute bottom-0 left-0 h-0.5 w-full rounded-full bg-[#315efb]" />
              )}
            </button>

            <button
              onClick={() => setActiveTab("my")}
              className={`relative flex-1 py-3 text-sm font-semibold transition ${
                activeTab === "my"
                  ? "text-[#315efb]"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              My Unsent
              {activeTab === "my" && (
                <span className="absolute bottom-0 left-0 h-0.5 w-full rounded-full bg-[#315efb]" />
              )}
            </button>
          </div>

          {/* Feed */}
          <div className="flex flex-col gap-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <LoaderCircle
                  size={28}
                  className="mb-3 animate-spin text-[#315efb]"
                />

                <p className="text-sm">Loading unsent messages...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 bg-white px-5 py-14 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-[#315efb]">
                  <MessageCircle size={25} />
                </div>

                <h3 className="text-base font-semibold text-gray-900">
                  {activeTab === "my"
                    ? "Nothing unsent yet"
                    : "No messages to discover"}
                </h3>

                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-500">
                  {activeTab === "my"
                    ? "Your unsent messages will appear here when you share them."
                    : "Be the first to share something you never got to say."}
                </p>

                <button
                  onClick={() => setShowComposer(true)}
                  className="mt-5 text-sm font-semibold text-[#315efb] hover:text-blue-700"
                >
                  Write your first unsent message
                </button>
              </div>
            ) : (
              messages.map(renderMessage)
            )}
          </div>

          <p className="mt-8 text-center text-xs leading-5 text-gray-400">
            Every feeling has a place. Share responsibly and respect others.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Unsent;
