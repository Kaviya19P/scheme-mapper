//home.jsx

import React from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/Home.css'
import logo from '../assets/logo.jpeg'

function Home() {
    const navigate = useNavigate()
    return (
      <div className="home-background">
        <div className="home-glass-card">
          <img src={logo} alt="Nam Sarathi Logo" className="logo-animated" />
          <h1 className="home-title">Nam Sarathi</h1>
          <p className="home-subtitle">Mapping Government Schemes to Beneficiaries</p>
  
          <div className="button-wrapper">
            <button className="primary-btn user" onClick={() => navigate('/login')}>User Portal</button>
            <button className="primary-btn admin" onClick={() => navigate('/admin-login')}>Admin Portal</button>
          </div>
        </div>
      </div>
    )
}

export default Home