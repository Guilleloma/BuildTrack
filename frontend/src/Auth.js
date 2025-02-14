import React, { useState } from 'react';

function Auth() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(true);
  const [message, setMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    const endpoint = isRegistering ? '/register' : '/login';
    try {
      const response = await fetch(`http://127.0.0.1:3000${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });
      if (response.ok) {
        const data = await response.json();
        setMessage(`${data.message}. Token: ${data.token}`);
      } else {
        const errorData = await response.json();
        setMessage(`Error: ${errorData.error}`);
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  return (
    <div style={{ margin: '2rem' }}>
      <h2>{isRegistering ? 'Register' : 'Login'}</h2>
      <form onSubmit={handleSubmit} style={{ marginBottom: '1rem' }}>
        <div>
          <label>Username: </label>
          <input 
            type="text" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            required 
          />
        </div>
        <div>
          <label>Password: </label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
        </div>
        <button type="submit">{isRegistering ? 'Register' : 'Login'}</button>
      </form>
      <button onClick={() => setIsRegistering(!isRegistering)}>
        Switch to {isRegistering ? 'Login' : 'Register'}
      </button>
      {message && <p>{message}</p>}
    </div>
  );
}

export default Auth; 