export const ADMIN_SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "courses", label: "Courses" },
  { id: "blogs", label: "Blog posts" },
  { id: "pricing", label: "Pricing" },
  { id: "projects", label: "Project lab" },
  { id: "enquiries", label: "Enquiries" },
  { id: "notifications", label: "Notifications" },
  { id: "reviews", label: "Reviews" },
];

export const slugify = (value = "") =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export const getArray = (value, ...keys) => {
  if (Array.isArray(value)) return value;

  for (const key of keys) {
    if (Array.isArray(value?.[key])) {
      return value[key];
    }
  }

  return [];
};
