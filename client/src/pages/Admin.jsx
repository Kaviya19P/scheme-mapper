//admin.jsx

import React, { useState } from 'react';
import axios from 'axios';
import '../styles/admin.css';

function Admin() {
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [eligibility, setEligibility] = useState([
    { attribute: '', operator: '==', value: '' }
  ]);

  const attributeOptions = [
    'gender',
    'age',
    'state',
    'residence',
    'community',
    'differently abled',
    'occupation',
    'income'
  ];

  const valueOptions = {
    gender: ['male', 'female', 'other'],
    residence: ['rural', 'urban'],
    'differently abled': ['yes', 'no'],
    state: ['Tamil Nadu', 'Kerala', 'Andhra Pradesh', 'Karnataka', 'Maharashtra', 'Delhi', 'Gujarat'],
    occupation: ['student', 'farmer', 'police', 'engineer', 'doctor', 'teacher', 'business'],
    community: ['Open Category', 'Backward Class', "Denotified Community", 'Most Backward Class', 'Scheduled Caste', 'Scheduled Tribe']
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleEligibilityChange = (index, field, value) => {
    setEligibility(prev => {
      const updated = [...prev];
      
      if (field === 'attribute') {
        updated[index] = { 
          ...updated[index], 
          [field]: value, 
          operator: '==',
          value: '' 
        };
      } else {
        updated[index][field] = value;
      }
      
      return updated;
    });
  };

  const addEligibility = () => {
    setEligibility(prev => [...prev, { attribute: '', operator: '==', value: '' }]);
  };

  const removeEligibility = (index) => {
    setEligibility(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const parsedEligibility = eligibility.map(rule => {
        let parsedValue = rule.value;

        if (rule.attribute === 'age' || rule.attribute === 'income') {
          parsedValue = Number(rule.value);
        }
        
        return {
          attribute: rule.attribute,
          operator: rule.operator,
          value: parsedValue
        };
      });

      await axios.post('/admin', {
        name: formData.name,
        description: formData.description,
        eligibility: parsedEligibility
      });
      
      alert("Data saved!");
      setFormData({ name: '', description: '' });
      setEligibility([{ attribute: '', operator: '==', value: '' }]);
    } catch (error) {
      console.error("Error saving data:", error);
    }
  };

  const renderValueInput = (rule, index) => {
    const attribute = rule.attribute;
    
    if (!attribute) return null;
    
    if (attribute === 'age') {
      return (
        <select
          value={rule.value}
          onChange={(e) => handleEligibilityChange(index, 'value', e.target.value)}
          required
        >
          <option value="">Select Age</option>
          {[...Array(111)].map((_, i) => (
            <option key={i} value={i}>{i}</option>
          ))}
        </select>
      );
    } else if (attribute === 'income') {
      return (
        <input
          type="number"
          placeholder="Enter Income"
          value={rule.value}
          onChange={(e) => handleEligibilityChange(index, 'value', e.target.value)}
          required
        />
      );
    } else if (valueOptions[attribute]) {
      return (
        <select
          value={rule.value}
          onChange={(e) => handleEligibilityChange(index, 'value', e.target.value)}
          required
        >
          <option value="">Select {attribute}</option>
          {valueOptions[attribute].map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      );
    }
    return (
      <input
        type="text"
        placeholder="Value"
        value={rule.value}
        onChange={(e) => handleEligibilityChange(index, 'value', e.target.value)}
        required
      />
    );
  };

  const renderOperatorField = (rule, index) => {
    if (rule.attribute === 'income' || rule.attribute === 'age') {
      return (
        <select
          value={rule.operator}
          onChange={(e) => handleEligibilityChange(index, 'operator', e.target.value)}
          required
        >
          <option value="==">==</option>
          <option value="!=">!=</option>
          <option value=">">&gt;</option>
          <option value="<">&lt;</option>
          <option value=">=">&gt;=</option>
          <option value="<=">&lt;=</option>
        </select>
      );
    }
    return null;
  };


  return (
    <div className="admin-container">
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
          <div key={index} className="eligibility-rule" style={{ marginBottom: '1rem' }}>
            <select
              value={rule.attribute}
              onChange={(e) => handleEligibilityChange(index, 'attribute', e.target.value)}
              required
            >
              <option value="">Select Attribute</option>
              {attributeOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            {renderOperatorField(rule, index)}
            {renderValueInput(rule, index)}
            
            <button type="button" onClick={() => removeEligibility(index)}>Remove</button>
          </div>
        ))}
        <button type="button" className="add-rule-btn" onClick={addEligibility}>+ Add Rule</button>
        <br /><br />
        <button type="submit">Submit Scheme</button>
      </form>
    </div>
  );
}

export default Admin;