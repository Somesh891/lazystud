import { useEffect, useState } from "react";
import {
  fetchOpenAssignments,
  acceptAssignment,
  fetchMyWork,
  submitAssignment,
} from "./api";

function WriterDashboard({ token }) {
  const [assignments, setAssignments] = useState([]); // open assignments
  const [myWork, setMyWork] = useState([]); // accepted/completed
  const [loadingOpen, setLoadingOpen] = useState(true);
  const [loadingMyWork, setLoadingMyWork] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submissionDrafts, setSubmissionDrafts] = useState({}); // id -> draft text

  async function loadOpen() {
    setLoadingOpen(true);
    try {
      const data = await fetchOpenAssignments(token);
      setAssignments(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingOpen(false);
    }
  }

  async function loadMyWork() {
    setLoadingMyWork(true);
    try {
      const data = await fetchMyWork(token);
      setMyWork(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingMyWork(false);
    }
  }

  useEffect(() => {
    setError("");
    setMessage("");
    loadOpen();
    loadMyWork();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function handleAccept(id) {
    setError("");
    setMessage("");
    try {
      const updated = await acceptAssignment(id, token);
      setMessage(`Accepted assignment #${updated.id}`);

      // remove from open list
      setAssignments((prev) => prev.filter((a) => a.id !== id));

      // add to myWork
      setMyWork((prev) => [...prev, updated]);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSubmitWork(id) {
    setError("");
    setMessage("");

    const text = submissionDrafts[id] || "";

    if (!text.trim()) {
      setError("Please enter some submission text before submitting.");
      return;
    }

    try {
      const updated = await submitAssignment(id, text, token);
      setMessage(`Submitted and completed assignment #${updated.id}`);

      // update myWork list
      setMyWork((prev) =>
        prev.map((a) => (a.id === id ? updated : a))
      );
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div style={{ marginTop: "1.5rem", maxWidth: 800 }}>
      {message && <p style={{ color: "green" }}>{message}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <h2>Available Assignments</h2>

      {loadingOpen && <p>Loading assignments...</p>}

      {!loadingOpen && assignments.length === 0 && (
        <p>No open assignments right now.</p>
      )}

      <ul style={{ listStyle: "none", padding: 0 }}>
        {assignments.map((a) => (
          <li key={a.id} className="card">
            <h3 style={{ margin: "0 0 0.25rem" }}>
              #{a.id} — {a.title}
            </h3>
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

            <button onClick={() => handleAccept(a.id)}>
              Accept Assignment
            </button>
          </li>
        ))}
      </ul>

      <hr style={{ margin: "2rem 0" }} />

      <h2>My Work</h2>

      {loadingMyWork && <p>Loading my work...</p>}

      {!loadingMyWork && myWork.length === 0 && (
        <p>You haven&apos;t accepted any assignments yet.</p>
      )}

      <ul style={{ listStyle: "none", padding: 0 }}>
        {myWork.map((a) => (
          <li
            key={a.id}
            style={{
              border: "1px solid #ccc",
              marginBottom: "0.75rem",
              padding: "0.75rem",
              borderRadius: 4,
            }}
          >
            <h3 style={{ margin: "0 0 0.25rem" }}>
              #{a.id} — {a.title}
            </h3>
            <p style={{ margin: "0.25rem 0" }}>
              <b>Status:</b> {a.status}
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

            {a.submission_text && (
              <p style={{ margin: "0.25rem 0" }}>
                <b>Your submitted work:</b> {a.submission_text}
              </p>
            )}

            {a.status === "accepted" && (
              <div style={{ marginTop: "0.5rem" }}>
                <p style={{ margin: "0 0 0.25rem" }}>
                  <b>Submit your work:</b>
                </p>
                <textarea
                  rows={4}
                  style={{ width: "100%", marginBottom: "0.5rem" }}
                  value={submissionDrafts[a.id] || ""}
                  onChange={(e) =>
                    setSubmissionDrafts((prev) => ({
                      ...prev,
                      [a.id]: e.target.value,
                    }))
                  }
                  placeholder="Write your answer / solution here..."
                />
                <button onClick={() => handleSubmitWork(a.id)}>
                  Submit &amp; Mark Completed
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default WriterDashboard;
