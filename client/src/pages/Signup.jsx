import React,{ useState } from "react";
import axios from "axios";
import { useNavigate, Link } from 'react-router-dom'
import { FaUser, FaEnvelope, FaLock } from "react-icons/fa";
import '../styles/signup.css'

function Signup() {
    const navigate = useNavigate()
    const [form, setForm] = useState({ name: "", email: "", password: "" });
    const [error, setError] = useState("");

    const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async e => {
      e.preventDefault();
      try {
        const response = await fetch('/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(form)
        });

        const result = await response.json();

        if (response.status === 201) {
          sessionStorage.setItem('user', JSON.stringify(result.user));
          navigate('/user');
        } else {
          const data = await response.json();
          alert(data.message);
        }
      } catch (err) {
        console.error('Signup failed:', err);
      }
    };

    return (
      <div  className="login-background">
      <form className="login-glass" onSubmit={handleSubmit}>
      <h2>Create Account</h2>
      {error && <div style={{ color: "red", marginBottom: "1rem" }}>{error}</div>}
        <div className="input-group">
          <FaUser className="icon" />
        <input name="name" placeholder="User name" onChange={handleChange} required />
        </div>
        <div className="input-group">
          <FaEnvelope className="icon" />
        <input name="email" placeholder="Email" onChange={handleChange} required />
        </div>
        <div className="input-group">
          <FaLock className="icon" />
        <input name="password" type="password" placeholder="Password" onChange={handleChange} required />
        </div>
        <button type="submit">Sign Up</button>
        <div className="register-text">
          Already have an account? <Link to="/login">Login</Link>
        </div>
      </form>
      </div>
    );
  }

export default Signup;
