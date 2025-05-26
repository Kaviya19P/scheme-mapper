  import React,{ useState } from "react";
  import { useNavigate } from 'react-router-dom'
  import axios from "axios";
  import { FaUserShield, FaLock } from "react-icons/fa";
  import '../styles/adminLogin.css'

  function AdminLogin() {
      const navigate = useNavigate()
      const [form, setForm] = useState({ code: "", password: "" });
      const [error, setError] = useState("");
      const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

      const handleSubmit = async e => {
        e.preventDefault();
        setError("");
        
        try {
          const res = await axios.post("/admin-login", form);
          sessionStorage.setItem('admin', JSON.stringify(res.data.admin));        
          console.log("Login successful, navigating to /admin");          
          navigate('/admin');
        } catch (err) {
          console.error("Login error:", err);
          setError(err.response?.data?.message || "Login failed. Please try again.");
          alert(err.response.data.message);
        }        
      };

      return (
        <div className="admin-login-wrapper">
        <form onSubmit={handleSubmit} className="admin-login-card">
        <h2 className="admin-title"><FaUserShield /> Admin Login</h2>
        {error && <div className="error-box">{error}</div>}
        <div className="input-group">
        <FaUserShield className="icon" />
          <input name="code" placeholder="Code" onChange={handleChange}  required />
          </div>
          <div className="input-group">
            <FaLock className="icon" />
          <input name="password" type="password" placeholder="Password" onChange={handleChange} />
          </div>
          <button type="submit" className="login-btn">Login</button>
        </form>
        </div>
      );
  }

  export default AdminLogin;
