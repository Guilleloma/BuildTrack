import React from 'react';
import './App.css';
import Auth from './Auth';
import Projects from './Projects';
import Payments from './Payments';

function App() {
  return (
    <div className="App">
      <Auth />
      <Projects />
      <Payments />
    </div>
  );
}

export default App;
