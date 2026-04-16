import { useEffect, useState } from "react";
import {
  fetchMyAssignments,
  cancelAssignment,
  updateAssignment,
} from "./api";

function StudentAssignmentsList({ token, refreshKey }) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    title: "",
    subject: "",
    description: "",
    budget: "",
    deadline: "",
  });

  async function loadMyAssignments() {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const data = await fetchMyAssignments(token);
      setAssignments(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMyAssignments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, refreshKey]);

  async function handleCancel(id) {
    setError("");
    setMessage("");
    try {
      const updated = await cancelAssignment(id, token);
      setMessage(`Cancelled assignment #${updated.id}`);

      setAssignments((prev) =>
        prev.map((a) => (a.id === id ? updated : a))
      );
    } catch (err) {
      setError(err.message);
    }
  }

  function startEditing(assignment) {
    setEditingId(assignment.id);
    setEditForm({
      title: assignment.title || "",
      subject: assignment.subject || "",
      description: assignment.description || "",
      budget: assignment.budget?.toString() || "",
      deadline: assignment.deadline || "",
    });
    setMessage("");
    setError("");
  }

  function cancelEditing() {
    setEditingId(null);
  }

  async function handleSaveEdit(e) {
    e.preventDefault();
    if (!editingId) return;

    setError("");
    setMessage("");

    const updates = {
      title: editForm.title,
      subject: editForm.subject,
      description: editForm.description,
      budget: editForm.budget ? Number(editForm.budget) : undefined,
      deadline: editForm.deadline,
    };

    try {
      const updated = await updateAssignment(editingId, updates, token);
      setMessage(`Updated assignment #${updated.id}`);

      setAssignments((prev) =>
        prev.map((a) => (a.id === updated.id ? updated : a))
      );
      setEditingId(null);
    } catch (err) {
      setError(err.message);
    }
  }

  function getStatusColor(status) {
    if (status === "completed") return "green";
    if (status === "cancelled") return "gray";
    if (status === "accepted") return "orange";
    return "black"; // open or anything else
  }

  return (
    <div style={{ marginTop: "1.5rem", maxWidth: 800 }}>
      <h2>My Assignments</h2>

      {message && <p style={{ color: "green" }}>{message}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {loading && <p>Loading your assignments...</p>}

      {!loading && assignments.length === 0 && (
        <p>You haven&apos;t created any assignments yet.</p>
      )}

      <ul style={{ listStyle: "none", padding: 0 }}>
        {assignments.map((a) => (
          <li key={a.id} className="card">
            {editingId === a.id ? (
              /* ---------- EDIT MODE ---------- */
              <form onSubmit={handleSaveEdit}>
                <h3 style={{ margin: "0 0 0.25rem" }}>
                  Editing #{a.id}
                </h3>

                <div style={{ marginBottom: "0.5rem" }}>
                  <label>
                    Title:{" "}
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={(e) =>
                        setEditForm((f) => ({
                          ...f,
                          title: e.target.value,
                        }))
                      }
                      required
                    />
                  </label>
                </div>

                <div style={{ marginBottom: "0.5rem" }}>
                  <label>
                    Subject:{" "}
                    <input
                      type="text"
                      value={editForm.subject}
                      onChange={(e) =>
                        setEditForm((f) => ({
                          ...f,
                          subject: e.target.value,
                        }))
                      }
                      required
                    />
                  </label>
                </div>

                <div style={{ marginBottom: "0.5rem" }}>
                  <label>
                    Description:{" "}
                    <textarea
                      rows={3}
                      style={{ width: "100%" }}
                      value={editForm.description}
                      onChange={(e) =>
                        setEditForm((f) => ({
                          ...f,
                          description: e.target.value,
                        }))
                      }
                      required
                    />
                  </label>
                </div>

                <div style={{ marginBottom: "0.5rem" }}>
                  <label>
                    Budget (₹):{" "}
                    <input
                      type="number"
                      value={editForm.budget}
                      onChange={(e) =>
                        setEditForm((f) => ({
                          ...f,
                          budget: e.target.value,
                        }))
                      }
                      required
                    />
                  </label>
                </div>

                <div style={{ marginBottom: "0.5rem" }}>
                  <label>
                    Deadline:{" "}
                    <input
                      type="date"
                      value={editForm.deadline}
                      onChange={(e) =>
                        setEditForm((f) => ({
                          ...f,
                          deadline: e.target.value,
                        }))
                      }
                      required
                    />
                  </label>
                </div>

                <button type="submit" style={{ marginRight: "0.5rem" }}>
                  Save
                </button>
                <button type="button" onClick={cancelEditing}>
                  Cancel
                </button>
              </form>
            ) : (
              /* ---------- VIEW MODE ---------- */
              <>
                <h3 style={{ margin: "0 0 0.25rem" }}>
                  #{a.id} — {a.title}
                </h3>

                <p style={{ margin: "0.25rem 0" }}>
                  <b>Status:</b>{" "}
                  <span style={{ color: getStatusColor(a.status) }}>
                    {a.status}
                  </span>
                </p>

                <p style={{ margin: "0.25rem 0" }}>
                  <b>Subject:</b> {a.subject}
                </p>
                <p style={{ margin: "0.25rem 0" }}>
                  <b>Budget:</b> ₹{a.budget}
                </p>
                <p style={{ margin: "0.25rem 0" }}>
                  <b>Deadline:</b> {a.deadline}
                </p>
                <p style={{ margin: "0.25rem 0" }}>{a.description}</p>

                {a.writer_id && (
                  <p style={{ margin: "0.25rem 0" }}>
                    <b>Assigned writer ID:</b> {a.writer_id}
                  </p>
                )}

                {a.submission_text && (
                  <p style={{ margin: "0.25rem 0" }}>
                    <b>Writer submission:</b> {a.submission_text}
                  </p>
                )}

                {a.status === "open" && (
                  <div style={{ marginTop: "0.5rem" }}>
                    <button
                      onClick={() => startEditing(a)}
                      style={{ marginRight: "0.5rem" }}
                    >
                      Edit
                    </button>
                    <button onClick={() => handleCancel(a.id)}>
                      Cancel Assignment
                    </button>
                  </div>
                )}
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default StudentAssignmentsList;
