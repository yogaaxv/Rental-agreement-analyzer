import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { FileText, Shield, Menu, X } from 'lucide-react';
import './Navbar.css';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  function toggleMenu() {
    setMenuOpen((prev) => !prev);
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <header className="navbar" role="banner">
      <div className="navbar-inner">
        {/* Logo */}
        <NavLink to="/" className="navbar-brand" onClick={closeMenu} aria-label="Rental Agreement Analyzer home">
          <FileText size={24} aria-hidden="true" />
          <span>Rental Agreement Analyzer</span>
        </NavLink>

        {/* Desktop Nav */}
        <nav className="navbar-nav desktop-nav" aria-label="Main navigation">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
          >
            Home
          </NavLink>
          <NavLink
            to="/history"
            className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
          >
            Analysis History
          </NavLink>
        </nav>

        {/* Security Indicator */}
        <div className="navbar-right">
          <span className="security-badge" aria-label="Secure and Private">
            <Shield size={14} aria-hidden="true" />
            <span>Secure &amp; Private</span>
          </span>

          {/* Hamburger */}
          <button
            className="hamburger-btn"
            onClick={toggleMenu}
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
          >
            {menuOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {menuOpen && (
        <nav id="mobile-nav" className="mobile-nav" aria-label="Mobile navigation">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `mobile-nav-link ${isActive ? 'nav-link-active' : ''}`}
            onClick={closeMenu}
          >
            Home
          </NavLink>
          <NavLink
            to="/history"
            className={({ isActive }) => `mobile-nav-link ${isActive ? 'nav-link-active' : ''}`}
            onClick={closeMenu}
          >
            Analysis History
          </NavLink>
        </nav>
      )}
    </header>
  );
}
