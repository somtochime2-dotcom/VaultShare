import "./App.css";
import { useEffect, useState } from "react";

function App() {
  const [mode, setMode] = useState("login");
  const [loggedIn, setLoggedIn] = useState(false);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [user, setUser] = useState(null);
  const [files, setFiles] = useState([]);
  const [message, setMessage] = useState("");

  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadMessage, setUploadMessage] = useState("");

  // Check if a token already exists
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      loadProfile(token);
    }
  }, []);

  async function loadProfile(token) {
    try {
      const response = await fetch(
        "http://localhost:5000/api/profile",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        localStorage.removeItem("token");
        return;
      }

      const data = await response.json();

      setUser(data.user);
      setLoggedIn(true);

      loadFiles(token);
    } catch (error) {
      console.error(error);
    }
  }

  async function loadFiles(token) {
    try {
      const response = await fetch(
        "http://localhost:5000/api/files",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setFiles(data.files);
      }
    } catch (error) {
      console.error(error);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setMessage("Processing...");

    const endpoint =
      mode === "login"
        ? "http://localhost:5000/api/login"
        : "http://localhost:5000/api/register";

    const body =
      mode === "login"
        ? { email, password }
        : { username, email, password };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Something went wrong");
        return;
      }

      if (mode === "login") {
        localStorage.setItem("token", data.token);

        setUser(data.user);
        setLoggedIn(true);
        setMessage("");

        loadFiles(data.token);
      } else {
        setMessage(
          "Registration successful! You can now log in."
        );

        setMode("login");
      }
    } catch (error) {
      console.error(error);
      setMessage("Could not connect to VaultShare server.");
    }
  }

  function logout() {
    localStorage.removeItem("token");

    setLoggedIn(false);
    setUser(null);
    setFiles([]);
    setEmail("");
    setPassword("");
  }

  async function uploadFile() {
  if (!selectedFile) {
    setUploadMessage("Please select a file first.");
    return;
  }

  const token = localStorage.getItem("token");

  const formData = new FormData();
  formData.append("file", selectedFile);

  try {
    const response = await fetch(
      "http://localhost:5000/api/files/upload",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      setUploadMessage(data.message || "Upload failed.");
      return;
    }

    setUploadMessage("File uploaded successfully!");
    setSelectedFile(null);

    // Refresh the file list
    loadFiles(token);
  } catch (error) {
    console.error(error);
    setUploadMessage("Could not upload file.");
  }
  }


//making the download function active 
 async function downloadFile(fileId, filename) {
  const token = localStorage.getItem("token");

  try {
    const response = await fetch(
      `http://localhost:5000/api/files/${fileId}/download`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const data = await response.json();
      alert(data.message || "Download failed.");
      return;
    }

    const blob = await response.blob();

    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;

    document.body.appendChild(link);
    link.click();

    link.remove();
    window.URL.revokeObjectURL(url);

  } catch (error) {
    console.error("DOWNLOAD ERROR:", error);
    alert("Could not download file.");
  }
}

//adding the frontend function
async function deleteFile(fileId) {
  const token = localStorage.getItem("token");

  const confirmed = window.confirm(
    "Are you sure you want to delete this file?"
  );

  if (!confirmed) {
    return;
  }

  try {
    const response = await fetch(
      `http://localhost:5000/api/files/${fileId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Delete failed.");
      return;
    }

    // Refresh the file list
    loadFiles(token);

  } catch (error) {
    console.error("DELETE ERROR:", error);
    alert("Could not delete file.");
  }
}

  // Dashboard
 if (loggedIn) {
  return (
    <div className="vault-app">

      <header className="dashboard-header">
        <h1 className="logo">VaultShare</h1>

        <button
          className="logout-button"
          onClick={logout}
        >
          Logout
        </button>
      </header>

      <main className="dashboard">

        <section className="welcome">
          <h2>Welcome, {user?.username}</h2>
          <p>Your secure file workspace.</p>
        </section>

        <section className="upload-box">
          <h3>Upload a file</h3>

          <p>
            Select a file to securely upload to VaultShare.
          </p>

          <input
            type="file"
            onChange={(event) => {
              setSelectedFile(event.target.files[0]);
              setUploadMessage("");
            }}
          />

          <br />

          <button
            className="upload-button"
            onClick={uploadFile}
          >
            Upload File
          </button>

          <p>{uploadMessage}</p>
        </section>

        <section className="files-section">
          <h3>My Files</h3>

          {files.length === 0 ? (
            <p>You don't have any files yet.</p>
          ) : (
            <div className="file-list">

              {files.map((file) => (
                <div
                  className="file-card"
                  key={file.id}
                >

                  <span className="file-name">
                    📄 {file.filename}
                  </span>

                  <div className="file-actions">

                    <button
                      className="download-button"
                      onClick={() =>
                        downloadFile(
                          file.id,
                          file.filename
                        )
                      }
                    >
                      Download
                    </button>

                    <button
                      className="delete-button"
                      onClick={() =>
                        deleteFile(file.id)
                      }
                    >
                      Delete
                    </button>

                  </div>

                </div>
              ))}

            </div>
          )}
        </section>

      </main>
    </div>
  );
}

  // Login / Registration
return (
  <div className="auth-container">
    <div className="auth-box">

      <h1>VaultShare</h1>

      <p className="auth-subtitle">
        Secure file sharing, made simple.
      </p>

      <h2>
        {mode === "login"
          ? "Welcome back"
          : "Create your account"}
      </h2>

      <form onSubmit={handleSubmit}>

        {mode === "register" && (
          <div className="form-group">
            <label>Username</label>

            <input
              type="text"
              placeholder="Choose a username"
              value={username}
              onChange={(event) =>
                setUsername(event.target.value)
              }
              required
            />
          </div>
        )}

        <div className="form-group">
          <label>Email</label>

          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            required
          />
        </div>

        <div className="form-group">
          <label>Password</label>

          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            required
          />
        </div>

        <button
          className="auth-button"
          type="submit"
        >
          {mode === "login"
            ? "Login"
            : "Create Account"}
        </button>

      </form>

      <p>{message}</p>

      <div className="auth-switch">

        {mode === "login" ? (
          <>
            Don't have an account?

            <button
              onClick={() => {
                setMode("register");
                setMessage("");
              }}
            >
              Create one
            </button>
          </>
        ) : (
          <>
            Already have an account?

            <button
              onClick={() => {
                setMode("login");
                setMessage("");
              }}
            >
              Login
            </button>
          </>
        )}

      </div>

    </div>
  </div>
);
}

export default App;

