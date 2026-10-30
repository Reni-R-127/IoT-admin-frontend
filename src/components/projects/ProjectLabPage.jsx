import { useCallback, useEffect, useState } from "react";
import { adminRequest } from "../../services/adminApi";
import { getArray } from "../../utils/constants";
import DataTable from "../common/DataTable";
import PanelHead from "../common/PanelHead";
import ProjectLabForm from "./ProjectLabForm";
import "./ProjectLabPage.css";

export default function ProjectLabPage() {
  const [projects, setProjects] = useState([]);
  const [editingProject, setEditingProject] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await adminRequest("/projects");

      setProjects(
        getArray(response, "projects", "data", "items")
      );
    } catch (err) {
      setError(err.message || "Unable to load projects.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  function openCreateForm() {
    setEditingProject(null);
    setShowForm(true);
  }

  function openEditForm(project) {
    setEditingProject(project);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingProject(null);
  }

  async function handleSubmit(formData) {
    setSaving(true);
    setError("");

    try {
      const projectId = editingProject?._id || editingProject?.id;

      if (projectId) {
        await adminRequest(`/projects/${projectId}`, {
          method: "PUT",
          body: JSON.stringify(formData),
        });
      } else {
        await adminRequest("/projects", {
          method: "POST",
          body: JSON.stringify(formData),
        });
      }

      closeForm();
      await loadProjects();
    } catch (err) {
      setError(err.message || "Unable to save project.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(project) {
    const confirmed = window.confirm(
      `Delete "${project.title}"?`
    );

    if (!confirmed) return;

    setError("");

    try {
      const projectId = project._id || project.id;

      await adminRequest(`/projects/${projectId}`, {
        method: "DELETE",
      });

      await loadProjects();
    } catch (err) {
      setError(err.message || "Unable to delete project.");
    }
  }

  const columns = [
    {
      key: "title",
      label: "Project",
    },
    {
      key: "category",
      label: "Category",
      render: (project) => project.category || "—",
    },
    {
      key: "technologies",
      label: "Technologies",
      render: (project) =>
        Array.isArray(project.technologies)
          ? project.technologies.join(", ") || "—"
          : project.technologies || "—",
    },
    {
      key: "active",
      label: "Status",
      render: (project) =>
        project.active ? "Active" : "Inactive",
    },
    {
      key: "actions",
      label: "Actions",
      render: (project) => (
        <div className="admin-table__actions">
          <button
            type="button"
            onClick={() => openEditForm(project)}
          >
            Edit
          </button>

          <button
            type="button"
            onClick={() => handleDelete(project)}
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <section className="page project-lab-page">
      <PanelHead
        title="Project Lab"
        description="Manage projects displayed on your IoT website."
        actionLabel={showForm ? "Back to Projects" : "Add Project"}
        onAction={showForm ? closeForm : openCreateForm}
      />

      {error && (
        <div className="admin-error" role="alert">
          {error}
        </div>
      )}

      {showForm ? (
        <ProjectLabForm
          initialData={editingProject}
          onSubmit={handleSubmit}
          onCancel={closeForm}
          saving={saving}
        />
      ) : loading ? (
        <p>Loading projects...</p>
      ) : (
        <DataTable
          columns={columns}
          rows={projects}
          emptyMessage="No projects found. Add your first project."
        />
      )}
    </section>
  );
}
