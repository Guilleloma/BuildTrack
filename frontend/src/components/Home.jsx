import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  console.log('Home component rendering');
  const navigate = useNavigate();

  useEffect(() => {
    console.log('Home component mounted');
  }, []);

  return (
    <div>
      <h1>Bienvenido a BuildTrack</h1>
      <button onClick={() => navigate('/login')}>Iniciar Sesión</button>
      <button onClick={() => navigate('/app/sandbox')}>Acceder al Sandbox</button>
    </div>
  );
};

export default Home; 
