import React,{ useState } from "react";
import { useNavigate } from 'react-router-dom'
import axios from "axios";

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
      <div>
      <form onSubmit={handleSubmit}>
        <input name="code" placeholder="Code" onChange={handleChange}  required />
        <input name="password" type="password" placeholder="Password" onChange={handleChange} />
        <button type="submit">Login</button>
      </form>
      </div>
    );
}

export default AdminLogin;
