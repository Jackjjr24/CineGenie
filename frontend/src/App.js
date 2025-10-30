import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import Projects from './pages/Projects';
import Storyboard from './pages/Storyboard';

function App() {
  return (
    <div className="App">
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/storyboard/:projectId" element={<Storyboard />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;