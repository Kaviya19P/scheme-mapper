import React,{ useState } from "react";
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom'
import axios from "axios";

function Login() {
    const navigate = useNavigate()
    const [form, setForm] = useState({ email: "", password: "" });
    const [error, setError] = useState("");

    const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async e => {
      e.preventDefault();
      setError("");
      
      try {
        const res = await axios.post("/login", form);
         sessionStorage.setItem('user', JSON.stringify(res.data.user));
      
        console.log("Login successful, navigating to /user");
        
        navigate('/user');
      } catch (err) {
        console.error("Login error:", err);
        setError(err.response?.data?.message || "Login failed. Please try again.");
        alert(err.response.data.message);
      }
      
    };

    return (
      <div>
      <form onSubmit={handleSubmit}>
        <input name="email" placeholder="Email" onChange={handleChange}  required />
        <input name="password" type="password" placeholder="Password" onChange={handleChange} />
        <button type="submit">Login</button>
        <p>Don't have an account: <Link to="/signup">Register</Link></p>
      </form>
      </div>
    );
}

export default Login;
