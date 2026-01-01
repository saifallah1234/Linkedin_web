import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import SignupUser from './pages/SignupUser'

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* 2. Define the route */}
          <Route path="/signup-user" element={<SignupUser />} />
          
          {/* Other routes... */}
          <Route path="/" element={<h1>Home Page</h1>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;