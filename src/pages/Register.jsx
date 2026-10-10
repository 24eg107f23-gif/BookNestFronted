import { useState } from "react";

function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "STUDENT",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        "http://localhost:8080/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.text();

      if (response.ok) {
        setMessage("Registration successful! You can now login.");

        setFormData({
          name: "",
          email: "",
          password: "",
          role: "STUDENT",
        });
      } else {
        setMessage(data || "Registration failed.");
      }
    } catch (error) {
      setMessage(
        "Cannot connect to backend. Make sure Spring Boot is running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f5f7fb",
      }}
    >
      <div
        style={{
          width: "400px",
          padding: "30px",
          background: "white",
          borderRadius: "12px",
          boxShadow: "0 5px 25px rgba(0,0,0,0.1)",
        }}
      >
        <h1 style={{ textAlign: "center" }}>BookNest</h1>

        <h2 style={{ textAlign: "center" }}>Create Account</h2>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            required
            style={inputStyle}
          />

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
            style={inputStyle}
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            style={inputStyle}
          />

          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            style={inputStyle}
          >
            <option value="STUDENT">Student</option>
            <option value="ADMIN">Admin</option>
          </select>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px",
              background: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "16px",
            }}
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        {message && (
          <p
            style={{
              marginTop: "20px",
              textAlign: "center",
            }}
          >
            {message}
          </p>
        )}

        <p style={{ textAlign: "center", marginTop: "20px" }}>
          Already have an account?{" "}
          <a href="/login">Login</a>
        </p>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "12px",
  marginBottom: "15px",
  boxSizing: "border-box",
  border: "1px solid #ccc",
  borderRadius: "8px",
  fontSize: "15px",
};

export default Register;