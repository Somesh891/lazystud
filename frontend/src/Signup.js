import { useState } from "react";
import { signup } from "./api";

function Signup() {
  const [username, setUsername] = useState("");
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student"); // default
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);
    try {
      const res = await signup({ username, email, password, role });
      setMessage(res.message || "Signup successful!");
      setUsername("");
      setEmail("");
      setPassword("");
      setRole("student");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 320, margin: "1rem auto" }}>
      <h2>Signup</h2>
      {message && <p style={{ color: "green" }}>{message}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <div style={{ marginBottom: "0.5rem" }}>
        <label>Username</label>
        <input
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
          style={{ width: "100%" }}
        />
      </div>

      <div style={{ marginBottom: "0.5rem" }}>
        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          style={{ width: "100%" }}
        />
      </div>

      <div style={{ marginBottom: "0.5rem" }}>
        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          style={{ width: "100%" }}
        />
      </div>

      <div style={{ marginBottom: "0.5rem" }}>
        <label>Role</label>
        <select
          value={role}
          onChange={e => setRole(e.target.value)}
          style={{ width: "100%" }}
        >
          <option value="student">Student</option>
          <option value="writer">Writer</option>
        </select>
      </div>

      <button type="submit" disabled={loading}>
        {loading ? "Signing up..." : "Signup"}
      </button>
    </form>
  );
}

export default Signup;
