import React,{ useState } from "react";
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom'
import axios from "axios";

function Login() {
    const navigate = useNavigate()
  const [form, setForm] = useState({ email: "", password: "" });

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const res = await axios.post("/login", form);
      //alert(res.data.message);
    } catch (err) {
      alert(err.response.data.message);
    }
  };

  return (
    <div>
    <form onSubmit={handleSubmit}>
      <input name="email" placeholder="Email" onChange={handleChange} required />
      <input name="password" type="password" placeholder="Password" onChange={handleChange} required />
      <button type="submit" onClick={() => navigate('/user')}>Login</button>
      <p>Don't have an account: <Link to="/signup">Register</Link></p>
    </form>
    </div>
  );
}

export default Login;
