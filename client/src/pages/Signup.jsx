import React,{ useState } from "react";
import axios from "axios";
import { useNavigate } from 'react-router-dom'

function Signup() {
    const navigate = useNavigate()
  const [form, setForm] = useState({ name: "", email: "", password: "" });

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
        // Signup successful
        navigate('/user');
      } else {
        const data = await response.json();
        alert(data.message); // Show backend error
      }
    } catch (err) {
      console.error('Signup failed:', err);
    }
  };

  return (
    <div>
    <form onSubmit={handleSubmit}>
      <input name="name" placeholder="User name" onChange={handleChange} required />
      <input name="email" placeholder="Email" onChange={handleChange} required />
      <input name="password" type="password" placeholder="Password" onChange={handleChange} required />
      <button type="submit">Sign Up</button>
    </form>
    </div>
  );
}

export default Signup;
