//admin.jsx

import React, { useState } from 'react';
import axios from 'axios';
import '../styles/admin.css';

function Admin() {
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [eligibility, setEligibility] = useState([
    { attribute: '', operator: '', value: '' }
  ]);

  // Define attribute options
  const attributeOptions = [
    'gender',
    'age',
    'state',
    'residence',
    'category',
    'differently abled',
    'occupation',
    'income'
  ];

  // Define value options based on attributes
  const valueOptions = {
    gender: ['male', 'female', 'other'],
    residence: ['rural', 'urban'],
    'differently abled': ['yes', 'no'],
    state: ['Tamil Nadu', 'Kerala', 'Andhra Pradesh', 'Karnataka', 'Maharashtra', 'Delhi', 'Gujarat'],
    occupation: ['student', 'farmer', 'police', 'engineer', 'doctor', 'teacher', 'business'],
    category: ['OC', 'BC', 'BCM', 'MBC', 'SC', 'ST']
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
      
      // Reset value when attribute changes
      if (field === 'attribute') {
        updated[index] = { 
          ...updated[index], 
          [field]: value, 
          value: updated[index].attribute === 'category' ? [] : '' 
        };
      } else {
        updated[index][field] = value;
      }
      
      return updated;
    });
  };

  const handleCategoryChange = (index, value) => {
    setEligibility(prev => {
      const updated = [...prev];
      
      // Toggle the category value in the array
      if (updated[index].value.includes(value)) {
        updated[index].value = updated[index].value.filter(item => item !== value);
      } else {
        updated[index].value = [...updated[index].value, value];
      }
      
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
      const parsedEligibility = eligibility.map(rule => {
        let parsedValue = rule.value;

        // Parse numeric values for age and income
        if (rule.attribute === 'age' || rule.attribute === 'income') {
          parsedValue = Number(rule.value);
        }
        
        // For category (which is an array), keep it as is
        
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
      
      alert("Data saved to Firestore!");
      setFormData({ name: '', description: '' });
      setEligibility([{ attribute: '', operator: '', value: '' }]);
    } catch (error) {
      console.error("Error saving to Firestore:", error);
    }
  };

  // Render appropriate input based on selected attribute
  const renderValueInput = (rule, index) => {
    const attribute = rule.attribute;
    
    if (!attribute) return null;
    
    if (attribute === 'age') {
      // Age dropdown from 0 to 110
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
      // Text input for income
      return (
        <input
          type="number"
          placeholder="Enter Income"
          value={rule.value}
          onChange={(e) => handleEligibilityChange(index, 'value', e.target.value)}
          required
        />
      );
    } else if (attribute === 'category') {
      // Multi-select checkboxes for category
      return (
        <div className="category-checkboxes">
          {valueOptions.category.map((option) => (
            <div key={option} className="checkbox-item">
              <input
                type="checkbox"
                id={`category-${index}-${option}`}
                checked={Array.isArray(rule.value) && rule.value.includes(option)}
                onChange={() => handleCategoryChange(index, option)}
              />
              <label htmlFor={`category-${index}-${option}`}>{option}</label>
            </div>
          ))}
        </div>
      );
    } else if (valueOptions[attribute]) {
      // Dropdown for other attributes with predefined options
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
    
    // Default fallback to text input
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
            
            <select
              value={rule.operator}
              onChange={(e) => handleEligibilityChange(index, 'operator', e.target.value)}
              required
              disabled={rule.attribute === 'category'} // Disable operator for category as we're handling multi-select
            >
              <option value="">Select Operator</option>
              <option value="==">==</option>
              <option value="!=">!=</option>
              <option value=">">&gt;</option>
              <option value="<">&lt;</option>
              <option value=">=">&gt;=</option>
              <option value="<=">&lt;=</option>
            </select>
            
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