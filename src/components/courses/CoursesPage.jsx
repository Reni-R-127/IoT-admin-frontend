import { useCallback, useEffect, useState } from "react";
import { adminRequest } from "../../services/adminApi";
import DataTable from "../common/DataTable";
import PanelHead from "../common/PanelHead";
import CourseForm from "./CourseForm";
import "./CoursesPage.css";

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingCourse, setEditingCourse] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadCourses = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await adminRequest("/courses");
      const records = Array.isArray(result)
        ? result
        : result.courses || result.data || [];

      setCourses(records);
    } catch (err) {
      setError(err.message || "Unable to load courses.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const filteredCourses = courses.filter((course) =>
    `${course.title || ""} ${course.slug || ""} ${course.category || ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  function openCreateForm() {
    setEditingCourse(null);
    setShowForm(true);
    setError("");
    setNotice("");
  }

  function openEditForm(course) {
    setEditingCourse(course);
    setShowForm(true);
    setError("");
    setNotice("");
  }

  async function deleteCourse(course) {
    if (!window.confirm(`Delete "${course.title}"?`)) return;

    setError("");
    setNotice("");

    try {
      await adminRequest(`/courses/${course._id}`, {
        method: "DELETE",
      });

      setNotice("Course deleted successfully.");
      await loadCourses();
    } catch (err) {
      setError(err.message || "Unable to delete course.");
    }
  }

  function handleSaved(message) {
    setShowForm(false);
    setEditingCourse(null);
    setNotice(message);
    loadCourses();
  }

  const columns = [
    { key: "title", label: "TITLE" },
    {
      key: "category",
      label: "CATEGORY",
      render: (course) => course.category || "—",
    },
    {
      key: "ageRange",
      label: "AGE RANGE",
      render: (course) => course.ageRange || "—",
    },
    {
      key: "duration",
      label: "DURATION",
      render: (course) => course.duration || "—",
    },
    {
      key: "price",
      label: "PRICE",
      render: (course) => course.price || "Contact us",
    },
    {
      key: "active",
      label: "STATUS",
      render: (course) => (course.active ? "Active" : "Inactive"),
    },
  ];

  return (
    <section className="page courses-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">CONTROL CENTER / COURSES</span>
          <h1>Courses</h1>
          <p>Manage live website courses and learning content.</p>
        </div>

        <div className="page-actions">
          <a
            className="secondary-button"
            href={import.meta.env.VITE_WEBSITE_URL || "http://localhost:5173"}
            target="_blank"
            rel="noreferrer"
          >
            View website ↗
          </a>

          <button
            type="button"
            className="secondary-button"
            onClick={loadCourses}
            disabled={loading}
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {error && <div className="alert error-alert">{error}</div>}
      {notice && <div className="alert success-alert">{notice}</div>}

      {showForm ? (
        <CourseForm
          course={editingCourse}
          onCancel={() => setShowForm(false)}
          onSaved={handleSaved}
        />
      ) : (
        <div className="panel">
          <PanelHead
            title="Courses library"
            description="Create and edit course content stored in MongoDB."
            actionLabel="Add course"
            onAction={openCreateForm}
          />

          <input
            className="search-input"
            type="search"
            placeholder="Search courses..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <p className="record-count">
            {filteredCourses.length} records
          </p>

          {loading ? (
            <p>Loading courses...</p>
          ) : (
            <DataTable
              columns={columns}
              rows={filteredCourses}
              getRowId={(course) => course._id}
              onEdit={openEditForm}
              onDelete={deleteCourse}
              emptyMessage="No courses found. Add your first course."
            />
          )}
        </div>
      )}
    </section>
  );
}
