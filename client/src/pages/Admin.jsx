//admin.jsx

import React, {useState} from 'react'
import axios from 'axios'
import '../styles/admin.css'

function Admin() {
  const [formData, setFormData] = useState({ name: '', description: ''  });

  const [eligibility, setEligibility] = useState([
  { attribute: '', operator: '', value: '' }
]);


  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleEligibilityChange = (index, field, value) => {
  setEligibility(prev => {
    const updated = [...prev];
    updated[index][field] = value;
    return updated;
  });
};

const addEligibility = () => {
  setEligibility(prev => [...prev, { attribute: '', operator: '', value: '' }]);
};

const removeEligibility = (index) => {
  setEligibility(prev => prev.filter((_, i) => i !== index));
};


  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const parsedEligibility = eligibility.map(rule => ({
      attribute: rule.attribute,
      operator: rule.operator,
      value: isNaN(rule.value) ? rule.value.toLowerCase() : Number(rule.value)
    }));

    await axios.post('/admin', {
      name: formData.name,
      description: formData.description,
      eligibility: parsedEligibility
    });

    alert("Data saved to Firestore!");
    setFormData({ name: '', description: '' });
    setEligibility([{ attribute: '', operator: '', value: '' }]);
  } catch (error) {
    console.error("Error saving to Firestore:", error);
    }
    
  };

  return (
    
  <div className='admin-container'>
    <h2>Add New Scheme</h2>
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        name="name"
        placeholder="Scheme Name"
        value={formData.name}
        onChange={handleChange}
        required
      />
      <br /><br />
      <textarea
        name="description"
        placeholder="Scheme Description"
        value={formData.description}
        onChange={handleChange}
        required
      />
      <br /><br />
      <h3>Eligibility Rules</h3>
      {eligibility.map((rule, index) => (
        <div key={index} style={{ marginBottom: '1rem' }}>
          <input
            type="text"
            placeholder="Attribute"
            value={rule.attribute}
            onChange={(e) => handleEligibilityChange(index, 'attribute', e.target.value)}
            required
          />
          <select
            value={rule.operator}
            onChange={(e) => handleEligibilityChange(index, 'operator', e.target.value)}
            required
          >
            <option value="">Select Operator</option>
            <option value="==">==</option>
            <option value="!=">!=</option>
            <option value=">">&gt;</option>
            <option value="<">&lt;</option>
            <option value=">=">&gt;=</option>
            <option value="<=">&lt;=</option>
          </select>
          <input
            type="text"
            placeholder="Value"
            value={rule.value}
            onChange={(e) => handleEligibilityChange(index, 'value', e.target.value)}
            required
          />
          <button type="button" onClick={() => removeEligibility(index)}>Remove</button>
        </div>
      ))}
      <button type="button" className='add-rule-btn' onClick={addEligibility}>+ Add Rule</button>
      <br /><br />
      <button type="submit">Submit Scheme</button>
    </form>
  </div>
);

  
}

export default Admin