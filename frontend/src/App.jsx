import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Home from './pages/Home.jsx';
import Analysis from './pages/Analysis.jsx';
import History from './pages/History.jsx';

export default function App() {
  return (
    <div className="app-layout">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/analysis/:id" element={<Analysis />} />
        <Route path="/history" element={<History />} />
      </Routes>
    </div>
  );
}
