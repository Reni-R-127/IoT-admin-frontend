import { useCallback, useEffect, useState } from "react";
import { adminRequest } from "../../services/adminApi";
import { getArray } from "../../utils/constants";
import DataTable from "../common/DataTable";
import PanelHead from "../common/PanelHead";
import PricingForm from "./PricingForm";
import "./PricingPage.css";

export default function PricingPage() {
  const [plans, setPlans] = useState([]);
  const [editingPlan, setEditingPlan] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadPlans = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await adminRequest("/pricing");
      setPlans(getArray(response, "plans", "data", "pricing"));
    } catch (err) {
      setError(err.message || "Unable to load pricing plans.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  function openCreateForm() {
    setEditingPlan(null);
    setShowForm(true);
  }

  function openEditForm(plan) {
    setEditingPlan(plan);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingPlan(null);
  }

  async function handleSubmit(formData) {
    setSaving(true);
    setError("");

    try {
      if (editingPlan?._id || editingPlan?.id) {
        const id = editingPlan._id || editingPlan.id;

        await adminRequest(`/pricing/${id}`, {
          method: "PUT",
          body: JSON.stringify(formData),
        });
      } else {
        await adminRequest("/pricing", {
          method: "POST",
          body: JSON.stringify(formData),
        });
      }

      closeForm();
      await loadPlans();
    } catch (err) {
      setError(err.message || "Unable to save pricing plan.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(plan) {
    const confirmed = window.confirm(
      `Delete "${plan.title}" pricing plan?`
    );

    if (!confirmed) return;

    setError("");

    try {
      const id = plan._id || plan.id;

      await adminRequest(`/pricing/${id}`, {
        method: "DELETE",
      });

      await loadPlans();
    } catch (err) {
      setError(err.message || "Unable to delete pricing plan.");
    }
  }

  const columns = [
    {
      key: "title",
      label: "Plan",
    },
    {
      key: "price",
      label: "Price",
      render: (plan) => plan.price || "—",
    },
    {
      key: "features",
      label: "Features",
      render: (plan) =>
        Array.isArray(plan.features) ? plan.features.length : 0,
    },
    {
      key: "active",
      label: "Status",
      render: (plan) => (plan.active ? "Active" : "Inactive"),
    },
    {
      key: "order",
      label: "Display Order",
      render: (plan) => plan.order ?? 0,
    },
    {
      key: "actions",
      label: "Actions",
      render: (plan) => (
        <div className="admin-table__actions">
          <button type="button" onClick={() => openEditForm(plan)}>
            Edit
          </button>

          <button type="button" onClick={() => handleDelete(plan)}>
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <section className="page pricing-page">
      <PanelHead
        title="Pricing Management"
        description="Create and manage course pricing plans."
        actionLabel={showForm ? "Back to Plans" : "Add Pricing Plan"}
        onAction={showForm ? closeForm : openCreateForm}
      />

      {error && (
        <div className="admin-error" role="alert">
          {error}
        </div>
      )}

      {showForm ? (
        <PricingForm
          initialData={editingPlan}
          onSubmit={handleSubmit}
          onCancel={closeForm}
          saving={saving}
        />
      ) : loading ? (
        <p>Loading pricing plans...</p>
      ) : (
        <DataTable
          columns={columns}
          rows={plans}
          emptyMessage="No pricing plans found. Create your first plan."
        />
      )}
    </section>
  );
}
