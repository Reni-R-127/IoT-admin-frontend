import { useCallback, useEffect, useState } from "react";
import { adminRequest } from "../../services/adminApi";
import DataTable from "../common/DataTable";
import PanelHead from "../common/PanelHead";
import BlogForm from "./BlogForm";
import "./BlogsPage.css";

export default function BlogsPage() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingBlog, setEditingBlog] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadBlogs = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await adminRequest("/blogs");
      setBlogs(
        Array.isArray(result)
          ? result
          : result.blogs || result.data || []
      );
    } catch (err) {
      setError(err.message || "Unable to load blogs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBlogs();
  }, [loadBlogs]);

  const filteredBlogs = blogs.filter((blog) =>
    `${blog.title || ""} ${blog.category || ""} ${blog.slug || ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  function openCreate() {
    setEditingBlog(null);
    setShowForm(true);
    setError("");
    setNotice("");
  }

  function openEdit(blog) {
    setEditingBlog(blog);
    setShowForm(true);
    setError("");
    setNotice("");
  }

  async function deleteBlog(blog) {
    if (!window.confirm(`Delete "${blog.title}"?`)) return;

    setError("");
    setNotice("");

    try {
      await adminRequest(`/blogs/${blog._id}`, {
        method: "DELETE",
      });

      setNotice("Blog deleted successfully.");
      await loadBlogs();
    } catch (err) {
      setError(err.message || "Unable to delete blog.");
    }
  }

  function handleSaved(message) {
    setShowForm(false);
    setEditingBlog(null);
    setNotice(message);
    loadBlogs();
  }

  const columns = [
    { key: "title", label: "TITLE" },
    {
      key: "category",
      label: "CATEGORY",
      render: (blog) => blog.category || "IoT",
    },
    {
      key: "published",
      label: "STATUS",
      render: (blog) => blog.published ? "Published" : "Draft",
    },
    {
      key: "createdAt",
      label: "CREATED",
      render: (blog) =>
        blog.createdAt
          ? new Date(blog.createdAt).toLocaleDateString()
          : "—",
    },
  ];

  return (
    <section className="page blogs-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">CONTROL CENTER / BLOGS</span>
          <h1>Blog posts</h1>
          <p>Create and manage website articles.</p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={loadBlogs}
          disabled={loading}
        >
          ↻ Refresh
        </button>
      </div>

      {error && <div className="alert error-alert">{error}</div>}
      {notice && <div className="alert success-alert">{notice}</div>}

      {showForm ? (
        <BlogForm
          blog={editingBlog}
          onCancel={() => setShowForm(false)}
          onSaved={handleSaved}
        />
      ) : (
        <div className="panel">
          <PanelHead
            title="Blog library"
            description="Manage article content and publication status."
            actionLabel="Add blog"
            onAction={openCreate}
          />

          <input
            className="search-input"
            type="search"
            placeholder="Search blog posts..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <p className="record-count">
            {filteredBlogs.length} records
          </p>

          {loading ? (
            <p>Loading blog posts...</p>
          ) : (
            <DataTable
              columns={columns}
              rows={filteredBlogs}
              getRowId={(blog) => blog._id}
              onEdit={openEdit}
              onDelete={deleteBlog}
              emptyMessage="No blog posts found."
            />
          )}
        </div>
      )}
    </section>
  );
}
