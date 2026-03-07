import { Routes, Route } from 'react-router-dom';

function App() {
  return (
    <div className="app">
      <header>
        <h1>Sport Booking</h1>
        <nav>
          <a href="/">Home</a>
          <a href="/fields">Fields</a>
          <a href="/tournaments">Tournaments</a>
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<h2>Welcome to Sport Booking</h2>} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
