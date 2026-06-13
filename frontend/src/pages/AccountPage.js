import { useState } from "react";
import { api } from "../apiClient";
import { setToken } from "../session";

// Handles login and registration in a single card with toggle
export default function AccountPage({ user, setUser }) {
  const [showRegister, setShowRegister] = useState(false);
  const [signupForm, setSignupForm] = useState({ username: "", password: "", name: "", surname: "" });
  const [signinForm, setSigninForm] = useState({ username: "", password: "" });
  const [message, setMessage] = useState("");

  function saveAuthData(data) {
    const token = data?.token || "";
    if (token) setToken(token);
    setUser(data?.user || null);
  }

  // Registers a new user and switches back to the login form on success
  async function handleSignup() {
    try {
      const body = {
        username: signupForm.username.trim(),
        password: signupForm.password,
        name: signupForm.name.trim(),
        surname: signupForm.surname.trim(),
      };
      if (!body.username || !body.password || !body.name || !body.surname) {
        setMessage("Please fill in all registration fields.");
        return;
      }
      await api.signup(body);
      setMessage("Registration complete. You can now log in.");
      setShowRegister(false);
      setSignupForm({ username: "", password: "", name: "", surname: "" });
    } catch (err) {
      setMessage(`Signup error: ${err.message}`);
    }
  }

  // Logs in the user and saves the token
  async function handleSignin() {
    try {
      const body = {
        username: signinForm.username.trim(),
        password: signinForm.password,
      };
      if (!body.username || !body.password) {
        setMessage("Please enter your username and password.");
        return;
      }
      const data = await api.signin(body);
      saveAuthData(data);
      setMessage("Login successful.");
    } catch (err) {
      setMessage(`Signin error: ${err.message}`);
    }
  }

  return (
    <section>
      <div className="section-header">
        <h2>Account</h2>
        <p>Sign up or log in to access all features</p>
      </div>

      {message && <div className="card mb-md">{message}</div>}

      {user && (
        <div className="card mb-md">
          You are logged in as <strong>{user.username}</strong>. To log out, click your name in the top right corner.
        </div>
      )}

      <div className="login-wrapper">
        <div className="card login-card">

          {!showRegister ? (
            <>
              <h3>Login</h3>
              <div className="form-group">
                <input
                  className="form-input"
                  placeholder="Username"
                  value={signinForm.username}
                  onChange={(e) => setSigninForm({ ...signinForm, username: e.target.value })}
                />
                <input
                  className="form-input"
                  type="password"
                  placeholder="Password"
                  value={signinForm.password}
                  onChange={(e) => setSigninForm({ ...signinForm, password: e.target.value })}
                />
                <button className="btn btn-primary" onClick={handleSignin}>
                  Login
                </button>
                <div className="login-divider">Don't have an account?</div>
                <button className="btn btn-secondary" onClick={() => { setShowRegister(true); setMessage(""); }}>
                  Register
                </button>
              </div>
            </>
          ) : (
            <>
              <h3>Create an account</h3>
              <div className="form-group">
                <input
                  className="form-input"
                  placeholder="First name"
                  value={signupForm.name}
                  onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                />
                <input
                  className="form-input"
                  placeholder="Last name"
                  value={signupForm.surname}
                  onChange={(e) => setSignupForm({ ...signupForm, surname: e.target.value })}
                />
                <input
                  className="form-input"
                  placeholder="Username"
                  value={signupForm.username}
                  onChange={(e) => setSignupForm({ ...signupForm, username: e.target.value })}
                />
                <input
                  className="form-input"
                  type="password"
                  placeholder="Password"
                  value={signupForm.password}
                  onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                />
                <button className="btn btn-primary" onClick={handleSignup}>
                  Sign up
                </button>
                <div className="login-divider">Already have an account?</div>
                <button className="btn btn-secondary" onClick={() => { setShowRegister(false); setMessage(""); }}>
                  Back to Login
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
