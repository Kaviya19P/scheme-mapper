//User.jsx


import React, { useState } from 'react';
import '../styles/user.css'

function User() {
  const [formData, setFormData] = useState({
    age: '',
    income: '',
    residence: '',
    gender: '',
    occupation: ''
  });

  const [eligibleSchemes, setEligibleSchemes] = useState([]);

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await fetch('/user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        age: parseInt(formData.age),
        income: parseInt(formData.income),
      }),
    });

    const data = await res.json();
    setEligibleSchemes(data.eligible_schemes);
  };

  return (
    <div className='user-container'>
      <h2>Check Scheme Eligibility</h2>
      <form onSubmit={handleSubmit}>
        <input name="age" value={formData.age} onChange={handleChange} placeholder="Age" />
        <input name="income" value={formData.income} onChange={handleChange} placeholder="Income" />
        <input name="residence" value={formData.residence} onChange={handleChange} placeholder="Residence (urban/rural)" />
        <input name="gender" value={formData.gender} onChange={handleChange} placeholder="Gender" />
        <input name="occupation" value={formData.occupation} onChange={handleChange} placeholder="Occupation" />
        <button type="submit">Check</button>
      </form>

      <div>
        <h3>Eligible Schemes:</h3>
        {eligibleSchemes.length > 0 ? (
          <ul>
            {eligibleSchemes.map((scheme, i) => (
              <li key={i}>
                <strong>{scheme.name}</strong>: {scheme.description}
              </li>
            ))}
          </ul>
        ) : (
          <p>No eligible schemes found.</p>
        )}
      </div>
    </div>
  );
}

export default User;
