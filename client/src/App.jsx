//app.jsx

import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import User from './pages/User'
import Admin from './pages/Admin'
import Signup from './pages/Signup'
import Login from './pages/Login'
import Chatbot from './pages/Chatbot'
import ProtectedRoute from './ProtectedRoute'
import AdminLogin from './pages/AdminLogin'


function App() {

  
  return (
    <Router>
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/login' element={<Login />} />
        <Route path='/signup' element={<Signup />} />
        <Route path='/admin-login' element={<AdminLogin />} />
        <Route path='/admin' element={<Admin />} />
        <Route path='/user' element={
          <ProtectedRoute>
            <User/>
          </ProtectedRoute>
          }/>
        
        <Route path='/chat' element={
          <ProtectedRoute>
            <Chatbot/>
          </ProtectedRoute>
          }></Route>
      </Routes>
    </Router>
  )
}

export default App