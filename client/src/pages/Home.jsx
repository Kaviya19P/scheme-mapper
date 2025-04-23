//home.jsx

import React from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/Home.css'

function Home() {
    const navigate = useNavigate()
  return (
    <div className='home-container'>
        <h1>Nam Sarathi: Mapping Government Schemes to beneficiaries</h1>
        <button onClick={() => navigate('/login')}>User</button>
        <button onClick={() => navigate('/admin')}>Admin</button>
    </div>
  )
}

export default Home