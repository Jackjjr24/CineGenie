import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Projects from './pages/Projects';
import Storyboard from './pages/Storyboard';

function App() {
  return (
    <div className="App">
      <Routes>
        {/* Auth Routes - No Header */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* App Routes - With Header */}
        <Route path="/*" element={
          <>
            <Header />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/dashboard" element={<Projects />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/storyboard/:projectId" element={<Storyboard />} />
              </Routes>
            </main>
          </>
        } />
      </Routes>
    </div>
  );
}

export default App;