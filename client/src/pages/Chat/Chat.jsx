
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import axios from "axios";
import { API_URL } from "../../services/apiConfig";
import "./Chat.css";

// Dashboard route in App.jsx
const DASHBOARD_PATH = "/dashboard";

const headers = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const idOf = (value) =>
  String(
    typeof value === "string"
      ? value
      : value?._id ||
          value?.id ||
          value?.userId ||
          ""
  );

const timeOf = (date) => {
  if (!date) return "";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "";

  return parsed.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const dateOf = (date) => {
  if (!date) return "";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "";

  return parsed.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
};

const errorOf = (err, fallback) =>
  err.response?.data?.message || fallback;

// ==========================================
// CHAT COMPONENT
// ==========================================

function Chat() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const sellerId = params.get("sellerId");
  const productId = params.get("productId");

  const notificationConversationId =
    params.get("conversationId");

  // ========================================
  // DASHBOARD NAVIGATION - FIXED
  // ========================================

  const goToDashboard = () => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    navigate(DASHBOARD_PATH);
  };

  // ========================================
  // CURRENT USER
  // ========================================

  const [myId] = useState(() => {
    try {
      const user = JSON.parse(
        localStorage.getItem("user") || "{}"
      );

      return idOf(user.user || user);
    } catch {
      return "";
    }
  });

  // ========================================
  // STATE
  // ========================================

  const [conversations, setConversations] =
    useState([]);

  const [active, setActive] = useState(null);

  const [messages, setMessages] = useState([]);

  const [unread, setUnread] = useState({});

  const [totalUnread, setTotalUnread] =
    useState(0);

  const [text, setText] = useState("");

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);

  const [messagesLoading, setMessagesLoading] =
    useState(false);

  const [sending, setSending] = useState(false);

  const [error, setError] = useState("");

  const [mobileOpen, setMobileOpen] =
    useState(false);

  const activeIdRef = useRef("");

  const bottomRef = useRef(null);

  const openedNotificationRef = useRef("");

  // ========================================
  // FETCH CONVERSATIONS
  // ========================================

  const fetchConversations = useCallback(
    async (silent = false) => {
      try {
        if (!silent) {
          setLoading(true);
        }

        const { data } = await axios.get(
          `${API_URL}/chat/conversations`,
          {
            headers: headers(),
          }
        );

        const list = Array.isArray(
          data?.conversations
        )
          ? data.conversations
          : [];

        setConversations(list);

        return list;
      } catch (err) {
        if (!silent) {
          setError(
            errorOf(
              err,
              "Unable to load conversations."
            )
          );
        }

        return [];
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    []
  );

  // ========================================
  // FETCH UNREAD COUNT
  // ========================================

  const fetchUnread = useCallback(async () => {
    try {
      const { data } = await axios.get(
        `${API_URL}/chat/unread-count`,
        {
          headers: headers(),
        }
      );

      setUnread(data?.counts || {});

      setTotalUnread(
        Number(data?.unreadCount) || 0
      );
    } catch (err) {
      console.error("Unread count:", err);
    }
  }, []);

  // ========================================
  // MARK CHAT AS READ
  // ========================================

  const markRead = useCallback(
    async (conversationId) => {
      try {
        await axios.patch(
          `${API_URL}/chat/conversations/${conversationId}/read`,
          {},
          {
            headers: headers(),
          }
        );

        await fetchUnread();
      } catch (err) {
        console.error("Mark read:", err);
      }
    },
    [fetchUnread]
  );

  // ========================================
  // FETCH MESSAGES
  // ========================================

  const fetchMessages = useCallback(
    async (
      conversationId,
      showLoading = false
    ) => {
      try {
        if (showLoading) {
          setMessagesLoading(true);
        }

        const { data } = await axios.get(
          `${API_URL}/chat/conversations/${conversationId}/messages`,
          {
            headers: headers(),
          }
        );

        // Ignore responses from old conversations.
        if (
          activeIdRef.current !==
          String(conversationId)
        ) {
          return;
        }

        setMessages(
          Array.isArray(data?.messages)
            ? data.messages
            : []
        );

        await markRead(conversationId);
      } catch (err) {
        if (showLoading) {
          setError(
            errorOf(
              err,
              "Unable to load messages."
            )
          );
        }
      } finally {
        if (
          showLoading &&
          activeIdRef.current ===
            String(conversationId)
        ) {
          setMessagesLoading(false);
        }
      }
    },
    [markRead]
  );

  // ========================================
  // OPEN CONVERSATION
  // ========================================

  const openConversation = useCallback(
    async (conversation) => {
      if (!conversation?._id) return;

      const conversationId = String(
        conversation._id
      );

      activeIdRef.current = conversationId;

      setActive(conversation);
      setMobileOpen(true);
      setMessages([]);
      setError("");

      await fetchMessages(
        conversationId,
        true
      );
    },
    [fetchMessages]
  );

  // ========================================
  // INITIAL LOAD + SELLER CHAT
  // ========================================

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/login", {
        replace: true,
      });
      return;
    }

    let cancelled = false;

    const init = async () => {
      await Promise.all([
        fetchConversations(),
        fetchUnread(),
      ]);

      if (!sellerId || cancelled) return;

      try {
        const { data } = await axios.post(
          `${API_URL}/chat/conversations`,
          {
            sellerId,
            ...(productId
              ? { productId }
              : {}),
          },
          {
            headers: headers(),
          }
        );

        if (
          !cancelled &&
          data?.conversation
        ) {
          await fetchConversations(true);

          if (!cancelled) {
            await openConversation(
              data.conversation
            );
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            errorOf(
              err,
              "Unable to start seller chat."
            )
          );
        }
      }
    };

    init();

    return () => {
      cancelled = true;
    };
  }, [
    sellerId,
    productId,
    navigate,
    fetchConversations,
    fetchUnread,
    openConversation,
  ]);

  // ========================================
  // OPEN CHAT FROM NOTIFICATION
  // ========================================

  useEffect(() => {
    if (!notificationConversationId) {
      openedNotificationRef.current = "";
      return;
    }

    if (
      openedNotificationRef.current ===
      notificationConversationId
    ) {
      return;
    }

    if (loading) return;

    const matchingConversation =
      conversations.find(
        (conversation) =>
          String(conversation._id) ===
          String(notificationConversationId)
      );

    if (matchingConversation) {
      openedNotificationRef.current =
        notificationConversationId;

      openConversation(
        matchingConversation
      );
    } else if (
      conversations.length > 0
    ) {
      setError(
        "The conversation linked to this notification was not found."
      );
    }
  }, [
    notificationConversationId,
    conversations,
    loading,
    openConversation,
  ]);

  // ========================================
  // AUTO REFRESH EVERY 3 SECONDS
  // ========================================

  useEffect(() => {
    const timer = setInterval(() => {
      if (!localStorage.getItem("token")) {
        return;
      }

      fetchConversations(true);
      fetchUnread();

      if (activeIdRef.current) {
        fetchMessages(
          activeIdRef.current
        );
      }
    }, 3000);

    return () => {
      clearInterval(timer);
    };
  }, [
    fetchConversations,
    fetchUnread,
    fetchMessages,
  ]);

  // ========================================
  // AUTO SCROLL TO LATEST MESSAGE
  // ========================================

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [
    messages.length,
    active?._id,
  ]);

  // ========================================
  // SEND MESSAGE
  // ========================================

  const sendMessage = async (event) => {
    event.preventDefault();

    const content = text.trim();

    if (
      !content ||
      !active?._id ||
      sending
    ) {
      return;
    }

    const conversationId = String(
      active._id
    );

    try {
      setSending(true);
      setError("");

      const { data } = await axios.post(
        `${API_URL}/chat/conversations/${conversationId}/messages`,
        {
          text: content,
        },
        {
          headers: headers(),
        }
      );

      if (
        activeIdRef.current ===
        conversationId
      ) {
        if (data?.data) {
          setMessages((previous) =>
            previous.some(
              (message) =>
                message._id ===
                data.data._id
            )
              ? previous
              : [
                  ...previous,
                  data.data,
                ]
          );
        }

        setText("");
      }

      await Promise.all([
        fetchConversations(true),
        fetchUnread(),
      ]);
    } catch (err) {
      setError(
        errorOf(
          err,
          "Unable to send message."
        )
      );
    } finally {
      setSending(false);
    }
  };

  // ========================================
  // GET OTHER USER
  // ========================================

  const otherUser = (conversation) => {
    const people =
      conversation?.participants || [];

    return (
      people.find(
        (person) =>
          idOf(person) !== myId
      ) ||
      people[0] ||
      {}
    );
  };

  // ========================================
  // SEARCH CONVERSATIONS
  // ========================================

  const filtered = conversations.filter(
    (conversation) => {
      const query =
        search.toLowerCase();

      const person =
        otherUser(conversation);

      return (
        (
          person.fullName ||
          person.name ||
          "User"
        )
          .toLowerCase()
          .includes(query) ||
        (
          conversation.product?.name ||
          ""
        )
          .toLowerCase()
          .includes(query)
      );
    }
  );

  const activeUser = active
    ? otherUser(active)
    : null;

  // ========================================
  // CHAT UI
  // ========================================

  return (
    <div className="cm-chat-page">
      {/* PAGE HEADER */}

      <header className="cm-chat-page-header">
        <div className="cm-chat-brand">
          {/* DASHBOARD BUTTON - FIXED */}

          <button
            className="cm-chat-back-dashboard"
            type="button"
            onClick={goToDashboard}
          >
            ← Dashboard
          </button>

          <div>
            <h1>
              💬 C-Mart Messages
            </h1>

            <p>
              Connect with buyers and
              sellers on campus
            </p>
          </div>
        </div>

        <button
          className="cm-chat-explore-btn"
          type="button"
          onClick={() =>
            navigate("/products")
          }
        >
          🛍️ Explore Products
        </button>
      </header>

      {/* ERROR */}

      {error && (
        <div
          className="cm-chat-error"
          role="alert"
        >
          <span>⚠️ {error}</span>

          <button
            type="button"
            onClick={() =>
              setError("")
            }
          >
            ✕
          </button>
        </div>
      )}

      {/* CHAT LAYOUT */}

      <div className="cm-chat-layout">
        {/* CONVERSATIONS SIDEBAR */}

        <aside
          className={`cm-chat-sidebar ${
            mobileOpen
              ? "cm-chat-mobile-hidden"
              : ""
          }`}
        >
          <div className="cm-chat-sidebar-header">
            <div>
              <h2>
                Messages{" "}

                {totalUnread > 0 && (
                  <span className="cm-chat-unread-badge">
                    {totalUnread > 99
                      ? "99+"
                      : totalUnread}
                  </span>
                )}
              </h2>

              <p>
                {conversations.length}{" "}
                conversations
              </p>
            </div>

            <span className="cm-chat-sidebar-icon">
              💬
            </span>
          </div>

          {/* SEARCH */}

          <div className="cm-chat-search">
            <span>🔍</span>

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search conversations..."
            />
          </div>

          {/* CONVERSATION LIST */}

          <div className="cm-chat-conversation-list">
            {loading ? (
              <div className="cm-chat-list-empty">
                Loading conversations...
              </div>
            ) : filtered.length === 0 ? (
              <div className="cm-chat-list-empty">
                <span>💌</span>

                <h3>
                  No conversations yet
                </h3>

                <p>
                  Open a product and
                  select Chat with Seller
                  to get started.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    navigate("/products")
                  }
                >
                  Browse Products
                </button>
              </div>
            ) : (
              filtered.map(
                (conversation) => {
                  const person =
                    otherUser(
                      conversation
                    );

                  const name =
                    person.fullName ||
                    person.name ||
                    "C-Mart User";

                  const count =
                    Number(
                      unread[
                        conversation._id
                      ]
                    ) || 0;

                  return (
                    <button
                      key={
                        conversation._id
                      }
                      type="button"
                      className={`cm-chat-conversation ${
                        active?._id ===
                        conversation._id
                          ? "active"
                          : ""
                      }`}
                      onClick={() =>
                        openConversation(
                          conversation
                        )
                      }
                    >
                      <div className="cm-chat-avatar">
                        {name
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div className="cm-chat-conversation-info">
                        <div className="cm-chat-conversation-top">
                          <strong>
                            {name}
                          </strong>

                          <span>
                            {timeOf(
                              conversation.lastMessageAt
                            )}
                          </span>
                        </div>

                        {conversation
                          .product
                          ?.name && (
                          <span className="cm-chat-product-label">
                            🛍️{" "}
                            {
                              conversation
                                .product
                                .name
                            }
                          </span>
                        )}

                        <p>
                          {conversation.lastMessage ||
                            "Start your conversation"}
                        </p>
                      </div>

                      {count > 0 && (
                        <span
                          className="cm-chat-unread-badge"
                          aria-label={`${count} unread messages`}
                        >
                          {count > 99
                            ? "99+"
                            : count}
                        </span>
                      )}
                    </button>
                  );
                }
              )
            )}
          </div>
        </aside>

        {/* CHAT MAIN AREA */}

        <main
          className={`cm-chat-main ${
            mobileOpen
              ? "cm-chat-mobile-open"
              : ""
          }`}
        >
          {!active ? (
            <div className="cm-chat-welcome">
              <div className="cm-chat-welcome-icon">
                💬
              </div>

              <h2>
                Welcome to C-Mart Chat
              </h2>

              <p>
                Select a conversation
                to start messaging.
                Chat directly with
                students about products,
                prices and availability.
              </p>

              <button
                type="button"
                onClick={() =>
                  navigate("/products")
                }
              >
                Explore Products →
              </button>
            </div>
          ) : (
            <>
              {/* ACTIVE CHAT HEADER */}

              <div className="cm-chat-active-header">
                <button
                  type="button"
                  className="cm-chat-mobile-back"
                  onClick={() =>
                    setMobileOpen(false)
                  }
                >
                  ←
                </button>

                <div className="cm-chat-avatar">
                  {(
                    activeUser?.fullName ||
                    activeUser?.name ||
                    "U"
                  )
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div className="cm-chat-active-user">
                  <h3>
                    {activeUser?.fullName ||
                      activeUser?.name ||
                      "C-Mart User"}
                  </h3>

                  <p>
                    {active.product?.name
                      ? `🛍️ ${active.product.name}`
                      : "Campus Marketplace"}
                  </p>
                </div>

                {active.product?._id && (
                  <button
                    className="cm-chat-view-product"
                    type="button"
                    onClick={() =>
                      navigate(
                        `/product/${active.product._id}`
                      )
                    }
                  >
                    View Product →
                  </button>
                )}
              </div>

              {/* MESSAGES */}

              <div className="cm-chat-messages">
                {messagesLoading ? (
                  <div className="cm-chat-messages-empty">
                    Loading messages...
                  </div>
                ) : messages.length ===
                  0 ? (
                  <div className="cm-chat-messages-empty">
                    <span>👋</span>

                    <h3>
                      Start the
                      conversation
                    </h3>

                    <p>
                      Send your first
                      message below.
                    </p>
                  </div>
                ) : (
                  messages.map(
                    (message) => (
                      <div
                        key={
                          message._id
                        }
                        className={`cm-chat-message-row ${
                          idOf(
                            message.sender
                          ) === myId
                            ? "mine"
                            : "theirs"
                        }`}
                      >
                        <div className="cm-chat-message-bubble">
                          <p>
                            {
                              message.text
                            }
                          </p>

                          <span>
                            {dateOf(
                              message.createdAt
                            )}{" "}
                            ·{" "}
                            {timeOf(
                              message.createdAt
                            )}
                          </span>
                        </div>
                      </div>
                    )
                  )
                )}

                <div
                  ref={bottomRef}
                />
              </div>

              {/* SEND MESSAGE */}

              <form
                className="cm-chat-input-area"
                onSubmit={sendMessage}
              >
                <input
                  value={text}
                  maxLength={2000}
                  onChange={(event) =>
                    setText(
                      event.target.value
                    )
                  }
                  placeholder="Type your message..."
                />

                <button
                  type="submit"
                  disabled={
                    !text.trim() ||
                    sending
                  }
                >
                  {sending
                    ? "Sending..."
                    : "Send ➤"}
                </button>
              </form>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default Chat;
