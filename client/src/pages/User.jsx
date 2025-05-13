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
import axios from 'axios';

function User() {
  const [file, setFile] = useState(null);
  const [userFiles, setUserFiles] = useState([]);
  const [message, setMessage] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage('Please select a file first');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('/user/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        withCredentials: true
      });
      setMessage(response.data.message);
      fetchUserFiles();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error uploading file');
    }
  };

  const fetchUserFiles = async () => {
    try {
      const response = await axios.get('/user/files', {
        withCredentials: true
      });
      setUserFiles(response.data.files);
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };

  // Call fetchUserFiles on component mount
  React.useEffect(() => {
    fetchUserFiles();
  }, []);

  return (
    <div>
      <h2>File Storage</h2>
      
      <div>
        <h3>Upload File</h3>
        <input type="file" onChange={handleFileChange} />
        <button onClick={handleUpload}>Upload</button>
        {message && <p>{message}</p>}
      </div>

      <div>
        <h3>Your Files</h3>
        {userFiles.length === 0 ? (
          <p>No files found</p>
        ) : (
          <ul>
            {userFiles.map((file, index) => (
              <li key={index}>
                {file.filename} - {Math.round(file.size / 1024)} KB
                <button onClick={() => downloadFile(file.filename)}>Download</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );

  async function downloadFile(filename) {
    try {
      const response = await axios.get(`/user/download/${filename}`, {
        responseType: 'blob',
        withCredentials: true
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  }
}

export default User;
*/