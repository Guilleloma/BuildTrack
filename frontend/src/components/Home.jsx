import React from 'react';
import { useHistory } from 'react-router-dom';

const Home = () => {
  const history = useHistory();

  return (
    <div>
      <h1>Bienvenido a BuildTrack</h1>
      <button onClick={() => history.push('/login')}>Iniciar Sesión</button>
      <button onClick={() => history.push('/sandbox')}>Acceder al Sandbox</button>
    </div>
  );
};

export default Home; 