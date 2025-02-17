import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div>
      <h1>Bienvenido a BuildTrack</h1>
      <button onClick={() => navigate('/login')}>Iniciar Sesión</button>
      <button onClick={() => navigate('/sandbox')}>Acceder al Sandbox</button>
    </div>
  );
};

export default Home; 
