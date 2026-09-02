import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import groups from "../data/group-list.json";
import forumPostsData from "../data/forum-post-list.json";
import users from "../data/user-list.json";

type Reply = { id: string; authorId: string; content: string; likes: number; createdAt: string };
type Post = (typeof forumPostsData)[number] & { replies: Reply[] };

export default function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();

  const group = groups.find((g) => g.id === id);
  if (!group) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="text-5xl mb-4">😕</div>
        <h2 className="text-2xl font-bold mb-3" style={{ fontFamily: "Lora, serif" }}>找不到该小组</h2>
        <Link to="/community" style={{ color: "var(--primary)" }}>← 返回社区</Link>
      </div>
    );
  }

  const groupPosts = forumPostsData.filter((p) => p.groupId === id) as Post[];
  const [posts, setPosts] = useState<Post[]>(groupPosts);
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [replyContent, setReplyContent] = useState<Record<string, string>>({});
  const [expandedPost, setExpandedPost] = useState<string | null>(posts[0]?.id || null);
  const [isNewPostOpen, setIsNewPostOpen] = useState(false);

  const isJoined = currentUser && group.members.includes(currentUser.id);

  function submitPost(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser || !newPostTitle.trim() || !newPostContent.trim()) return;
    const newPost: Post = {
      id: `fp${Date.now()}`,
      groupId: id!,
      authorId: currentUser.id,
      title: newPostTitle.trim(),
      content: newPostContent.trim(),
      image: null,
      likes: 0,
      createdAt: new Date().toISOString(),
      replies: [],
    };
    setPosts([newPost, ...posts]);
    setNewPostTitle("");
    setNewPostContent("");
    setIsNewPostOpen(false);
    setExpandedPost(newPost.id);
  }

  function submitReply(postId: string) {
    if (!currentUser || !replyContent[postId]?.trim()) return;
    const reply: Reply = {
      id: `r${Date.now()}`,
      authorId: currentUser.id,
      content: replyContent[postId].trim(),
      likes: 0,
      createdAt: new Date().toISOString(),
    };
    setPosts(posts.map((p) =>
      p.id === postId ? { ...p, replies: [...p.replies, reply] } : p
    ));
    setReplyContent({ ...replyContent, [postId]: "" });
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      {/* Group Header */}
      <div className="relative overflow-hidden" style={{ background: "var(--foreground)", minHeight: "200px" }}>
        <div
          className="absolute inset-0 opacity-20 bg-center bg-cover"
          style={{ backgroundImage: `url('${group.image}')` }}
        />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex items-center gap-2 text-xs mb-4" style={{ color: "#9E8878" }}>
            <Link to="/community" className="hover:opacity-80">社区</Link>
            <span>/</span>
            <span style={{ color: "#F7F1E8" }}>{group.name}</span>
          </div>
          <h1
            className="text-2xl sm:text-3xl font-bold mb-2"
            style={{ fontFamily: "Lora, serif", color: "#F7F1E8" }}
          >
            {group.name}
          </h1>
          <p className="text-sm max-w-xl mb-4" style={{ color: "#C8B99E" }}>
            {group.description}
          </p>
          <div className="flex gap-5 text-sm" style={{ color: "#9E8878" }}>
            <span>👥 {group.memberCount.toLocaleString()} 成员</span>
            <span>💬 {group.postCount.toLocaleString()} 帖子</span>
            <span>📅 创建于 {new Date(group.createdDate).getFullYear()}</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* New Post Button */}
        {currentUser ? (
          <div className="mb-6">
            <button
              onClick={() => setIsNewPostOpen(!isNewPostOpen)}
              className="px-4 py-2.5 rounded-lg font-semibold text-sm transition-opacity hover:opacity-90"
              style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
            >
              ✏️ 发布新帖子
            </button>

            {isNewPostOpen && (
              <form
                onSubmit={submitPost}
                className="mt-4 p-5 rounded-xl space-y-3"
                style={{ background: "var(--card)", border: "1.5px solid var(--border)" }}
              >
                <input
                  type="text"
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                  placeholder="帖子标题..."
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{
                    background: "var(--muted)",
                    border: "1.5px solid var(--border)",
                    color: "var(--foreground)",
                  }}
                />
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="分享你的想法..."
                  rows={4}
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none resize-none"
                  style={{
                    background: "var(--muted)",
                    border: "1.5px solid var(--border)",
                    color: "var(--foreground)",
                  }}
                />
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setIsNewPostOpen(false)}
                    className="px-4 py-2 rounded-lg text-sm font-medium"
                    style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90"
                    style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
                  >
                    发布帖子
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <div
            className="mb-6 p-4 rounded-xl text-sm"
            style={{ background: "var(--muted)", border: "1.5px solid var(--border)", color: "var(--muted-foreground)" }}
          >
            <Link to="/" style={{ color: "var(--primary)", fontWeight: 600 }}>登录</Link> 后可发帖和回复。
          </div>
        )}

        {/* Posts */}
        <div className="space-y-4">
          {posts.map((post) => {
            const author = users.find((u) => u.id === post.authorId);
            const isExpanded = expandedPost === post.id;

            return (
              <div
                key={post.id}
                className="rounded-xl overflow-hidden"
                style={{ background: "var(--card)", border: "1.5px solid var(--border)" }}
              >
                {/* Post header */}
                <button
                  className="w-full text-left p-5"
                  onClick={() => setExpandedPost(isExpanded ? null : post.id)}
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={author?.avatar}
                      alt={author?.displayName}
                      className="w-9 h-9 rounded-full object-cover shrink-0 mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                          {author?.displayName}
                        </span>
                        <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                          {new Date(post.createdAt).toLocaleDateString("zh-CN")}
                        </span>
                        <span
                          className="ml-auto text-xs px-2 py-0.5 rounded-full"
                          style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
                        >
                          💬 {post.replies.length} 回复
                        </span>
                      </div>
                      <h3
                        className="font-bold text-base leading-snug"
                        style={{ fontFamily: "Lora, serif", color: "var(--foreground)" }}
                      >
                        {post.title}
                      </h3>
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div style={{ borderTop: "1px solid var(--border)" }}>
                    {/* Post content */}
                    <div className="px-5 py-4">
                      {post.image && (
                        <img
                          src={post.image}
                          alt=""
                          className="rounded-lg w-full max-h-64 object-cover mb-4"
                        />
                      )}
                      <p className="text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>
                        {post.content}
                      </p>
                      <div className="flex items-center gap-4 mt-3">
                        <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                          ❤️ {post.likes} 个赞
                        </span>
                      </div>
                    </div>

                    {/* Replies */}
                    {post.replies.length > 0 && (
                      <div className="px-5 pb-4 space-y-3" style={{ borderTop: "1px solid var(--border)" }}>
                        <p className="text-xs font-semibold pt-4" style={{ color: "var(--muted-foreground)" }}>
                          {post.replies.length} 条回复
                        </p>
                        {post.replies.map((reply) => {
                          const replyAuthor = users.find((u) => u.id === reply.authorId);
                          return (
                            <div key={reply.id} className="flex gap-3">
                              <img
                                src={replyAuthor?.avatar}
                                alt={replyAuthor?.displayName}
                                className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5"
                              />
                              <div
                                className="flex-1 rounded-lg p-3 text-sm"
                                style={{ background: "var(--muted)" }}
                              >
                                <p className="font-semibold text-xs mb-1" style={{ color: "var(--foreground)" }}>
                                  {replyAuthor?.displayName}
                                  <span className="ml-2 font-normal" style={{ color: "var(--muted-foreground)" }}>
                                    {new Date(reply.createdAt).toLocaleDateString("zh-CN")}
                                  </span>
                                </p>
                                <p style={{ color: "var(--foreground)" }}>{reply.content}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Reply box */}
                    {currentUser && (
                      <div
                        className="px-5 pb-4 pt-3 flex gap-3"
                        style={{ borderTop: "1px solid var(--border)" }}
                      >
                        <img
                          src={currentUser.avatar}
                          alt={currentUser.displayName}
                          className="w-7 h-7 rounded-full object-cover shrink-0"
                        />
                        <div className="flex-1 flex gap-2">
                          <input
                            type="text"
                            value={replyContent[post.id] || ""}
                            onChange={(e) =>
                              setReplyContent({ ...replyContent, [post.id]: e.target.value })
                            }
                            onKeyDown={(e) => { if (e.key === "Enter") submitReply(post.id); }}
                            placeholder="写下你的回复..."
                            className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
                            style={{
                              background: "var(--muted)",
                              border: "1.5px solid var(--border)",
                              color: "var(--foreground)",
                            }}
                          />
                          <button
                            onClick={() => submitReply(post.id)}
                            className="px-3 py-2 rounded-lg text-sm font-semibold shrink-0 transition-opacity hover:opacity-80"
                            style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
                          >
                            回复
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
