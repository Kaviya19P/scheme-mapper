//User.jsx

import React, { useState } from 'react';
import {Link} from 'react-router-dom'
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
       <div className='user-header'>
        <h2>Check Scheme Eligibility</h2>
        <nav>
          <Link to="/user" className='active'>User Dashboard</Link>
          <Link to="/chat">Chat with Assistant</Link>
        </nav>
      </div>
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

/*
import React, { useState } from 'react';
import Tesseract from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';

const User = () => {
  const [pdfFile, setPdfFile] = useState(null);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [submitStatus, setSubmitStatus] = useState('');
  const [formValues, setFormValues] = useState({
    name: '',
    fatherName: '',
    address: '',
    income: '',
    issueDate: '',
    certificateNo: '',
  });

  const handleFileChange = (e) => {
    setPdfFile(e.target.files[0]);
  };

  const handlePDF = async () => {
    if (!pdfFile) return;

    setLoadingMessage('Loading PDF...');
    try {
      const pdf = await pdfjsLib.getDocument(URL.createObjectURL(pdfFile)).promise;
      const page = await pdf.getPage(1);

      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({ canvasContext: context, viewport: viewport }).promise;

      setLoadingMessage('Running OCR...');
      const { data: { text } } = await Tesseract.recognize(canvas, 'eng');
      setLoadingMessage('Form filled! Please verify.');

      const fields = extractFields(text);
      setFormValues(fields);
    } catch (error) {
      setLoadingMessage('Error processing the PDF.');
      console.error(error);
    }
  };

  const extractFields = (text) => {
    const nameMatch = text.match(/Thiru\s([A-Za-z\s]+)\sson/i);
    const fatherMatch = text.match(/son\s+of\s+Thiru\s+([A-Za-z\s]+)\s+residing/i);
    const addressMatch = extractAddress(text);
    const incomeMatch = text.match(/income.*?is\s+(Rs\.?\s*[\d,]+)/i);
    const certWithDateMatch = text.match(/(TN-\d{13}).*?Date[:\s]*(\d{2}-\d{2}-\d{4})/i);

    return {
      name: nameMatch ? nameMatch[1].trim() : "Not Found",
      fatherName: fatherMatch ? fatherMatch[1].trim() : "Not Found",
      address: addressMatch ? addressMatch : "Not Found",
      income: incomeMatch ? incomeMatch[1].trim() : "Not Found",
      issueDate: certWithDateMatch ? certWithDateMatch[2] : "Not Found",
      certificateNo: certWithDateMatch ? certWithDateMatch[1] : "Not Found",
    };
  };

  const extractAddress = (text) => {
    const addressPattern = /(?:Door No\.\s*\d+\/\d+\/\d+,?[\w\s,/-]+(?:Tamil Nadu))/;
    const match = text.match(addressPattern);
    return match ? match[0] : "";
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Add form submission logic here
    console.log('Form Submitted:', formValues);
  };

  try {
    // Call the /user endpoint with the form data
    const response = await axios.post('/user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formValues),
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Form submitted successfully:', data);
    setSubmitStatus('Form submitted successfully!');
  } catch (error) {
    console.error('Error submitting form:', error);
    setSubmitStatus('Error submitting form. Please try again.');
  }
};

  return (
    <div className="container">
      <h2>Upload Income Certificate (PDF)</h2>
      <input
        type="file"
        accept="application/pdf"
        onChange={handleFileChange}
      />
      <button onClick={handlePDF}>Extract and Fill</button>

      <p>{loadingMessage}</p>

      <form id="registrationForm" onSubmit={handleSubmit}>
        <input
          type="text"
          value={formValues.name}
          onChange={(e) => setFormValues({ ...formValues, name: e.target.value })}
          placeholder="Name"
        />
        <input
          type="text"
          value={formValues.fatherName}
          onChange={(e) => setFormValues({ ...formValues, fatherName: e.target.value })}
          placeholder="Father's Name"
        />
        <textarea
          value={formValues.address}
          onChange={(e) => setFormValues({ ...formValues, address: e.target.value })}
          placeholder="Address"
        />
        <input
          type="text"
          value={formValues.income}
          onChange={(e) => setFormValues({ ...formValues, income: e.target.value })}
          placeholder="Annual Income"
        />
        <input
          type="text"
          value={formValues.issueDate}
          onChange={(e) => setFormValues({ ...formValues, issueDate: e.target.value })}
          placeholder="Date of Issue"
        />
        <input
          type="text"
          value={formValues.certificateNo}
          onChange={(e) => setFormValues({ ...formValues, certificateNo: e.target.value })}
          placeholder="Certificate No"
        />
        <button type="submit">Submit</button>
      </form>
      {submitStatus && <p className="status-message">{submitStatus}</p>}
    </div>
  );

export default User;

*/
