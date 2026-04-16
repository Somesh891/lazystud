import { useState } from "react";
import Signup from "./Signup";
import Login from "./Login";
import { getMe } from "./api";
import StudentAssignmentForm from "./StudentAssignmentForm";
import StudentAssignmentsList from "./StudentAssignmentsList";
import WriterDashboard from "./WriterDashboard";

function App() {
  const [auth, setAuth] = useState({
    token: null,
    role: null,
    username: null,
  });

  const [assignmentRefresh, setAssignmentRefresh] = useState(0);

  const loggedIn = Boolean(auth.token);

  async function handleCheckMe() {
    try {
      const data = await getMe(auth.token);
      alert(`You are ${data.username} (${data.role})`);
    } catch (err) {
      alert("Token invalid / expired. Try logging in again.");
    }
  }

  function handleLogout() {
    setAuth({ token: null, role: null, username: null });
  }

  return (
    <div className="container">
      <h1>LazyStud</h1>

      {!loggedIn && (
        <>
          <Signup />
          <hr />
          <Login onLoginSuccess={setAuth} />
        </>
      )}

      {loggedIn && (
        <>
          <p>
            Logged in as <b>{auth.username}</b> ({auth.role})
          </p>
          <button onClick={handleCheckMe}>Check /me</button>{" "}
          <button onClick={handleLogout}>Logout</button>

          {/* Student vs writer dashboards */}
          {auth.role === "student" && (
            <>
              <p>Student dashboard</p>
              <StudentAssignmentForm
                token={auth.token}
                onCreated={() =>
                  setAssignmentRefresh((prev) => prev + 1)
                }
              />
              <StudentAssignmentsList
                token={auth.token}
                refreshKey={assignmentRefresh}
              />
            </>
          )}

          {auth.role === "writer" && (
            <>
              <p>Writer dashboard</p>
              <WriterDashboard token={auth.token} />
            </>
          )}
        </>
      )}
    </div>
  );
}

export default App;
