// src/api.js
const API_URL = "http://127.0.0.1:8000";

// ---------- AUTH ----------
export async function signup({ username, email, password, role }) {
  const res = await fetch(`${API_URL}/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, email, password, role }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Signup failed");
  }

  return res.json();
}

export async function login({ email, password }) {
  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Login failed");
  }

  return res.json(); // { access_token, role, user, ... }
}

export async function getMe(token) {
  const res = await fetch(`${API_URL}/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch profile");
  }

  return res.json();
}

// ---------- STUDENT: CREATE ASSIGNMENT ----------
export async function createAssignment(assignment, token) {
  const res = await fetch(`${API_URL}/assignments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(assignment),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Failed to create assignment");
  }

  return res.json(); // created assignment
}

// ---------- WRITER: VIEW + ACCEPT ASSIGNMENTS ----------
export async function fetchOpenAssignments(token) {
  const res = await fetch(`${API_URL}/assignments`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Failed to load assignments");
  }

  return res.json(); // list[AssignmentOut]
}

export async function acceptAssignment(id, token) {
  const res = await fetch(`${API_URL}/assignments/${id}/accept`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Failed to accept assignment");
  }

  return res.json(); // updated assignment
}

// ---------- WRITER: MY WORK + COMPLETE / SUBMIT ----------
export async function fetchMyWork(token) {
  const res = await fetch(`${API_URL}/my-work`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Failed to load my work");
  }

  return res.json();
}

export async function completeAssignment(id, token) {
  const res = await fetch(`${API_URL}/assignments/${id}/complete`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Failed to complete assignment");
  }

  return res.json();
}

export async function submitAssignment(id, text, token) {
  const res = await fetch(`${API_URL}/assignments/${id}/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Failed to submit assignment");
  }

  return res.json();
}

// ---------- STUDENT: MY ASSIGNMENTS, CANCEL, UPDATE ----------
export async function fetchMyAssignments(token) {
  const res = await fetch(`${API_URL}/my-assignments`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Failed to load your assignments");
  }

  return res.json();
}

export async function cancelAssignment(id, token) {
  const res = await fetch(`${API_URL}/assignments/${id}/cancel`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Failed to cancel assignment");
  }

  return res.json();
}

export async function updateAssignment(id, updates, token) {
  const res = await fetch(`${API_URL}/assignments/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updates),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Failed to update assignment");
  }

  return res.json();
}
