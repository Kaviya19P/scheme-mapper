//User.jsx

/*import React, { useState } from 'react';
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

export default User; */

import React, { useState, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import Tesseract from "tesseract.js";

// Setup PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/legacy/build/pdf.worker.mjs",
  import.meta.url
).toString();

const User = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const canvasRef = useRef(null);

  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "",
    caste: "",
    community: "",
    income: "",
    location: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  const [eligibleSchemes, setEligibleSchemes] = useState([]);

  // Render first page of PDF to canvas
  const renderPDFPageToCanvas = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 2 });

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({ canvasContext: context, viewport }).promise;
    return canvas;
  };

  // OCR function
  const runOCR = async (image) => {
    setLoading(true);
    try {
      const {
        data: { text },
      } = await Tesseract.recognize(image, "eng", {
        logger: (m) => console.log(m),
      });
      return text.replace(/\s{2,}/g, " ").trim();
    } catch (err) {
      setError("OCR failed");
      return "";
    } finally {
      setLoading(false);
    }
  };

  // Utility to extract value after keywords or patterns
  const extractAfter = (text, keywords) => {
    for (let keyword of keywords) {
      const regex = new RegExp(`${keyword}\\s*[:\\-]?\\s*(.+)`, "i");
      const match = text.match(regex);
      if (match) {
        const value = match[1].split("\n")[0].trim();
        if (value.length > 1 && value.length < 100) return value;
      }
    }
    return "";
  };

  const parseText = (text, docType) => {
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (docType === "aadhar") {
      // Robust Name Extraction
      let name = "";
      const namePrefixRegex =
        /\b(Mr|Mrs|Miss|Ms|Selvi|Shri|Smt|Dr|Sri|Md|Prof)\.?\s+([A-Za-z\s]+)/i;
      for (let line of lines) {
        const match = line.match(namePrefixRegex);
        if (match) {
          name = match[0].trim();
          break;
        }
      }
      if (!name) {
        name = extractAfter(text, [
          "name",
          "full name",
          "applicant name",
          "applicant",
          "Name",
          "Full Name",
          "Applicant Name",
        ]);
      }
      // Aadhaar fallback: find line above 'Year of Birth', 'DOB', or 'Gender'
      if (!name) {
        let idx = -1;
        for (let i = 0; i < lines.length; i++) {
          if (
            /(year of birth|dob|date of birth|gender)/i.test(lines[i])
          ) {
            idx = i;
            break;
          }
        }
        if (idx > 0) {
          // Search up to 2 lines above for a "name-like" line
          for (let j = idx - 1; j >= Math.max(0, idx - 2); j--) {
            if (
              /^[A-Za-z ]{3,}$/.test(lines[j]) &&
              lines[j].split(" ").length >= 2 &&
              !/(government|aadhaar|india|unique|authority|male|female|dob|year|address|father|mother|son|daughter|birth|card|no|number|gender|date)/i.test(
                lines[j]
              )
            ) {
              name = lines[j].trim();
              break;
            }
          }
        }
      }
      // Last fallback: first "name-like" line in the document
      if (!name) {
        for (let line of lines) {
          if (
            /^[A-Za-z ]{3,}$/.test(line) &&
            line.split(" ").length >= 2 &&
            !/(government|aadhaar|india|unique|authority|male|female|dob|year|address|father|mother|son|daughter|birth|card|no|number|gender|date)/i.test(
              line
            )
          ) {
            name = line.trim();
            break;
          }
        }
      }

      // Age extraction
      let age = "";
      const ageRegexes = [
        /age\s*[:\-]?\s*(\d{1,3})/i,
        /(\d{1,3})\s*years?/i,
      ];
      for (let regex of ageRegexes) {
        for (let line of lines) {
          const match = line.match(regex);
          if (match) {
            age = match[1];
            break;
          }
        }
        if (age) break;
      }
      // Try to calculate age from DOB
      if (!age) {
        const dobRegex = /(?:dob|date of birth)\s*[:\-]?\s*(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i;
        for (let line of lines) {
          const match = line.match(dobRegex);
          if (match) {
            const dobParts = match[1].split(/[\/\-]/);
            let year = parseInt(dobParts[2]);
            let month = parseInt(dobParts[1]) - 1;
            let day = parseInt(dobParts[0]);
            let dob = new Date(year, month, day);
            let today = new Date();
            let calcAge = today.getFullYear() - dob.getFullYear();
            if (
              today.getMonth() < dob.getMonth() ||
              (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())
            ) {
              calcAge--;
            }
            if (calcAge > 0 && calcAge < 120) {
              age = String(calcAge);
            }
            break;
          }
        }
      }

      // Gender extraction
      let gender = "";
      const genderRegexes = [
        /gender\s*[:\-]?\s*(male|female|other)/i,
        /sex\s*[:\-]?\s*(male|female|other)/i,
        /\b(male|female|other)\b/i,
        /\b(M|F|O)\b/i,
      ];
      for (let regex of genderRegexes) {
        for (let line of lines) {
          const match = line.match(regex);
          if (match) {
            gender = match[1].length === 1
              ? (match[1].toUpperCase() === "M" ? "Male" : match[1].toUpperCase() === "F" ? "Female" : "Other")
              : match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
            break;
          }
        }
        if (gender) break;
      }

      setFormData((prev) => ({
        ...prev,
        name: name || prev.name,
        age: age || prev.age,
        gender: gender || prev.gender,
      }));
    }

    if (docType === "community") {
      // Caste and community extraction
      let caste = "";
      let community = "";
      let location = "";

      // Caste extraction
      const belongsToCommunityRegex = /belongs\s+to\s+([a-zA-Z\s]+?)\s+Community/i;
      const belongsToRegex = /belongs\s+to\s+([a-zA-Z]+)/i;
      let match = text.match(belongsToCommunityRegex);
      if (match) {
        caste = match[1].trim();
      } else {
        match = text.match(belongsToRegex);
        if (match) caste = match[1].trim();
      }

      // Community extraction
      const recognizedAsRegex = /recogniz(?:ed|es|ing)\s+as\s+(an?|the)?\s*([a-zA-Z ]+?)(?:\s+as\s+per|\s+vide|\s+under|\s+by|\s+in|\s+order|,|\.)/i;
      match = text.match(recognizedAsRegex);
      if (match) {
        community = match[2].trim();
      } else {
        const classifiedAsRegex = /classified\s+as\s+(an?|the)?\s*([a-zA-Z ]+?)(?:\s+as\s+per|\s+vide|\s+under|\s+by|\s+in|\s+order|,|\.)/i;
        match = text.match(classifiedAsRegex);
        if (match) community = match[2].trim();
      }
      if (!community) {
        const communityKeywords = [
          "Most Backward Class",
          "Backward Class",
          "Scheduled Caste",
          "Scheduled Tribe",
          "Denotified Community",
          "Open Category",
          "General",
          "MBC",
          "BC",
          "OBC",
          "SC",
          "ST",
          "DNC",
          "OC"
        ];
        for (let keyword of communityKeywords) {
          if (text.toLowerCase().includes(keyword.toLowerCase())) {
            community = keyword;
            break;
          }
        }
      }

      // Location extraction (village/town/ward/city)
      const locationKeywords = [
        "village",
        "town",
        "city",
        "ward",
        "municipality",
        "panchayat",
        "corporation",
        "district"
      ];
      for (let keyword of locationKeywords) {
        const regex = new RegExp(`${keyword}\\s*[:\\-]?\\s*([a-zA-Z0-9\\s]+)`, "i");
        const match = text.match(regex);
        if (match) {
          location = `${keyword.charAt(0).toUpperCase() + keyword.slice(1)}: ${match[1].trim()}`;
          break;
        }
      }
      // Fallback: look for any line with "village"/"town"/"ward"/"city"
      if (!location) {
        for (let line of lines) {
          for (let keyword of locationKeywords) {
            if (line.toLowerCase().includes(keyword)) {
              location = line.trim();
              break;
            }
          }
          if (location) break;
        }
      }

      setFormData((prev) => ({
        ...prev,
        caste: caste || prev.caste,
        community: community || prev.community,
        location: location || prev.location,
      }));
    }

    if (docType === "income") {
      let income = "";
      const incomeRegexes = [
        /income\s*(?:in|is|of)?\s*(?:rs\.?|inr)?\s*[:\-]?\s*([\d,]+)/i,
        /annual income\s*(?:in|is|of)?\s*(?:rs\.?|inr)?\s*[:\-]?\s*([\d,]+)/i,
        /rupees\s*[:\-]?\s*([\d,]+)/i,
        /salary\s*[:\-]?\s*([\d,]+)/i,
        /Rs\.?\s?([\d,]+)[\s\/]?(annum|per\syear|year)?/i,
      ];
      for (const regex of incomeRegexes) {
        const match = text.match(regex);
        if (match) {
          income = match[1].replace(/,/g, "");
          break;
        }
      }
      if (!income) {
        const incomeLines = lines.filter(
          (line) =>
            line.toLowerCase().includes("income") ||
            line.toLowerCase().includes("rupees")
        );
        for (const line of incomeLines) {
          const match = line.match(/(?:Rs\.?|INR)\s?([\d,]+)/i);
          if (match) {
            income = match[1].replace(/,/g, "");
            break;
          }
        }
      }

      setFormData((prev) => ({
        ...prev,
        income: income || prev.income,
      }));
    }
  };

  const handleFileChange = async (e, docType) => {
    setError("");
    const file = e.target.files[0];
    if (!file) return;

    try {
      let ocrText = "";

      if (file.type === "application/pdf") {
        const canvas = await renderPDFPageToCanvas(file);
        ocrText = await runOCR(canvas);
      } else if (file.type.startsWith("image/")) {
        const imageUrl = URL.createObjectURL(file);
        ocrText = await runOCR(imageUrl);
        URL.revokeObjectURL(imageUrl);
      } else {
        setError("Unsupported file type");
        return;
      }

      if (!ocrText) {
        setError("No readable text found in OCR");
        return;
      }

      parseText(ocrText, docType);
    } catch (err) {
      setError("File processing error: " + err.message);
    }
  };

  const handleNext = () => step < 4 && setStep(step + 1);
  const handlePrevious = () => step > 1 && setStep(step - 1);
  const handleSubmit = async (e) => {
    
    e.preventDefault();

    try {
      const response = await fetch('/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });
      
      const result = await response.json();
      console.log(result);
      setEligibleSchemes(result.eligible_schemes);

    } catch (error) {
      console.error('Error submitting data:', error);
    }
  };

  return (
    <div>
      <h2>Scheme Eligibility Checker</h2>
      {error && <p style={{ color: "red" }}>⚠️ {error}</p>}
      {loading && <p>🔄 Processing document...</p>}
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {step === 1 && (
        <>
          <h3>Step 1: Upload Aadhaar</h3>
          <input
            type="file"
            accept="application/pdf,image/*"
            onChange={(e) => handleFileChange(e, "aadhar")}
          />
          <p>
            <strong>Name:</strong> {formData.name || "-"}
          </p>
          <p>
            <strong>Age:</strong> {formData.age || "-"}
          </p>
          <p>
            <strong>Gender:</strong> {formData.gender || "-"}
          </p>
        </>
      )}

      {step === 2 && (
        <>
          <h3>Step 2: Upload Community Certificate</h3>
          <input
            type="file"
            accept="application/pdf,image/*"
            onChange={(e) => handleFileChange(e, "community")}
          />
          <p>
            <strong>Caste:</strong> {formData.caste || "-"}
          </p>
          <p>
            <strong>Community:</strong> {formData.community || "-"}
          </p>
          <p>
            <strong>Location:</strong> {formData.location || "-"}
          </p>
        </>
      )}

      {step === 3 && (
        <>
          <h3>Step 3: Upload Income Certificate</h3>
          <input
            type="file"
            accept="application/pdf,image/*"
            onChange={(e) => handleFileChange(e, "income")}
          />
          <p>
            <strong>Income:</strong> {formData.income || "-"}
          </p>
        </>
      )}

      {step === 4 && (
        <>
          <h3>Step 4: Review & Submit</h3>
          
          <p>
            <strong>Age:</strong> {formData.age || "-"}
          </p>
          <p>
            <strong>Gender:</strong> {formData.gender || "-"}
          </p>
          
          <p>
            <strong>Community:</strong> {formData.community || "-"}
          </p>
          
          <p>
            <strong>Income:</strong> {formData.income || "-"}
          </p>
        </>
      )}

      <div>
        {step > 1 && <button onClick={handlePrevious}>Previous</button>}
        {step < 4 && <button onClick={handleNext}>Next</button>}
        {step === 4 && <button onClick={handleSubmit}>Submit</button>}
      </div>

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
};

export default User;