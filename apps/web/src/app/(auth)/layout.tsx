import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShieldCheck, Layers, Lock, GraduationCap, Users, CheckCircle2 } from 'lucide-react';
import { RivoLogo } from '@/components/ui/rivo-logo';

export const metadata = {
  title: 'Authentication — Rivo School Digital Ecosystem',
  description: 'Secure authentication gateway for school administrators, faculty, and institutional staff.',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-shell">
      {/* ── Panoramic Background Layer ─────────────────────── */}
      <div className="auth-bg-layer" aria-hidden="true">
        <Image
          src="/images/auth-campus-bg.jpg"
          alt="Rivo 3D Campus"
          fill
          priority
          sizes="100vw"
          className="auth-bg-img"
        />
        <div className="auth-bg-overlay" />
      </div>

      {/* ── Left Decorative & Governance Panel ──────────────── */}
      <aside className="auth-panel">
        <div className="auth-panel__scrim" aria-hidden="true" />
        
        <div className="auth-panel__content">
          {/* Brand Header */}
          <div className="auth-panel__brand">
            <Link href="/" className="auth-panel__brand-link">
              <div className="auth-panel__logo-wrapper">
                <RivoLogo variant="icon" size="md" className="auth-panel__logo-icon" />
              </div>
              <div className="auth-panel__brand-name">
                <span className="auth-panel__wordmark">RIVO</span>
                <span className="auth-panel__badge">SCHOOL OS</span>
              </div>
            </Link>
            <p className="auth-panel__tagline">
              Institutional Digital Ecosystem &amp; Management Infrastructure
            </p>
          </div>

          {/* Central Governance Narrative */}
          <div className="auth-panel__body">
            <div className="auth-panel__headline-group">
              <p className="auth-panel__eyebrow">
                <span className="auth-panel__eyebrow-dot" />
                TRUSTED BY MODERN SCHOOLS
              </p>
              <h1 className="auth-panel__headline">
                Administrative &amp; Academic <span className="auth-panel__headline-accent">Governance</span>
              </h1>
              <p className="auth-panel__subtext">
                A secure, centralized and modern platform designed for school leadership, campus management, and academic compliance.
              </p>
            </div>

            {/* Feature Cards matching reference */}
            <div className="auth-panel__features">
              <div className="auth-feature-card">
                <div className="auth-feature-card__icon auth-feature-card__icon--emerald">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="auth-feature-card__content">
                  <h3 className="auth-feature-card__title">Role-Based Access Governance</h3>
                  <p className="auth-feature-card__desc">
                    Strict separation between school administration, faculty responsibilities, and institutional data.
                  </p>
                </div>
              </div>

              <div className="auth-feature-card">
                <div className="auth-feature-card__icon auth-feature-card__icon--purple">
                  <Layers className="w-5 h-5 text-indigo-400" />
                </div>
                <div className="auth-feature-card__content">
                  <h3 className="auth-feature-card__title">Unified Multi-Campus Architecture</h3>
                  <p className="auth-feature-card__desc">
                    Centralized academic sessions, faculty catalog, and exam roll allocation across branches.
                  </p>
                </div>
              </div>

              <div className="auth-feature-card">
                <div className="auth-feature-card__icon auth-feature-card__icon--orange">
                  <Lock className="w-5 h-5 text-amber-400" />
                </div>
                <div className="auth-feature-card__content">
                  <h3 className="auth-feature-card__title">Encrypted Session Security</h3>
                  <p className="auth-feature-card__desc">
                    Inactivity protection, tokenized credentials, and configurable password policies.
                  </p>
                </div>
              </div>
            </div>

            {/* Stats Row matching reference */}
            <div className="auth-panel__stats">
              <div className="auth-stat-item">
                <div className="auth-stat-item__icon">
                  <GraduationCap className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="auth-stat-item__meta">
                  <span className="auth-stat-item__value">500+</span>
                  <span className="auth-stat-item__label">Schools</span>
                </div>
              </div>

              <div className="auth-stat-item">
                <div className="auth-stat-item__icon">
                  <Users className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="auth-stat-item__meta">
                  <span className="auth-stat-item__value">1M+</span>
                  <span className="auth-stat-item__label">Students</span>
                </div>
              </div>

              <div className="auth-stat-item">
                <div className="auth-stat-item__icon">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="auth-stat-item__meta">
                  <span className="auth-stat-item__value">99.9%</span>
                  <span className="auth-stat-item__label">Uptime</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Pill */}
          <footer className="auth-panel__footer">
            <div className="auth-panel__footer-badge">
              <div className="auth-panel__footer-icon">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <span>Rivo School OS</span>
              <span className="auth-panel__footer-sep">|</span>
              <span>Single-Tenant Security</span>
              <span className="auth-panel__footer-sep">|</span>
              <span>Made for Education</span>
            </div>
          </footer>
        </div>
      </aside>

      {/* ── Right Form Area ─────────────────────────────────── */}
      <main className="auth-form-area">
        {/* Mobile Header */}
        <div className="auth-mobile-header">
          <Link href="/" className="auth-mobile-header__brand">
            <RivoLogo variant="icon" size="sm" />
            <span className="auth-mobile-header__wordmark">RIVO</span>
          </Link>
          <span className="auth-mobile-header__badge">School OS</span>
        </div>

        {/* Floating Decorative Glass Badge on Desktop Right */}
        <div className="auth-floating-shield-badge" aria-hidden="true">
          <div className="auth-floating-shield-badge__icon">
            <ShieldCheck className="w-6 h-6 text-sky-500" />
          </div>
          <div className="auth-floating-shield-badge__lines">
            <span className="auth-floating-shield-badge__bold">Secure</span>
            <span>Reliable</span>
            <span>Future Ready</span>
          </div>
        </div>

        {/* Form Container */}
        <div className="auth-form-container">
          {children}
        </div>
      </main>

      <style>{`
        /* ════════════════════════════════════════════════
           AUTH SHELL — INSTITUTIONAL CINEMATIC SYSTEM
        ════════════════════════════════════════════════ */
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600;700&display=swap');

        .auth-shell {
          position: relative;
          min-height: 100svh;
          width: 100%;
          display: flex;
          flex-direction: column;
          font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
          overflow-x: hidden;
          background: #090f1e;
        }

        /* ── Panoramic Background Layer ─────────────── */
        .auth-bg-layer {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
        }

        .auth-bg-img {
          object-fit: cover;
          object-position: center 30%;
          filter: brightness(0.97) contrast(1.03);
        }

        .auth-bg-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            180deg,
            rgba(6, 11, 23, 0.45) 0%,
            rgba(6, 11, 23, 0.25) 50%,
            rgba(6, 11, 23, 0.6) 100%
          );
        }

        /* ── Left Panel ─────────────────────────────── */
        .auth-panel {
          position: relative;
          z-index: 10;
          display: none;
          flex-direction: column;
          color: #ffffff;
        }

        .auth-panel__scrim {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg,
            rgba(6, 11, 23, 0.96) 0%,
            rgba(6, 11, 23, 0.92) 55%,
            rgba(6, 11, 23, 0.70) 80%,
            rgba(6, 11, 23, 0.15) 100%
          );
          pointer-events: none;
        }

        .auth-panel__content {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          height: 100%;
          padding: 3rem 3.5rem;
        }

        /* Brand */
        .auth-panel__brand {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .auth-panel__brand-link {
          display: inline-flex;
          align-items: center;
          gap: 0.875rem;
          text-decoration: none;
          outline: none;
          width: fit-content;
        }

        .auth-panel__logo-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 6px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(10px);
          box-shadow: 0 8px 24px -4px rgba(14, 165, 233, 0.35);
        }

        .auth-panel__brand-name {
          display: flex;
          align-items: center;
          gap: 0.625rem;
        }

        .auth-panel__wordmark {
          font-family: 'JetBrains Mono', monospace;
          font-size: 1.625rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: #ffffff;
        }

        .auth-panel__badge {
          display: inline-flex;
          align-items: center;
          padding: 3px 9px;
          border-radius: 6px;
          background: rgba(14, 165, 233, 0.16);
          border: 1px solid rgba(56, 189, 248, 0.35);
          color: #38bdf8;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .auth-panel__tagline {
          font-size: 12px;
          color: #94a3b8;
          max-width: 32ch;
          line-height: 1.55;
          letter-spacing: 0.01em;
          margin: 0;
        }

        /* Central Body */
        .auth-panel__body {
          display: flex;
          flex-direction: column;
          gap: 1.75rem;
          margin: auto 0;
          padding: 2rem 0;
          max-width: 480px;
        }

        .auth-panel__headline-group {
          display: flex;
          flex-direction: column;
          gap: 0.625rem;
        }

        .auth-panel__eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #22d3ee;
          margin: 0;
        }

        .auth-panel__eyebrow-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #22d3ee;
          box-shadow: 0 0 10px #22d3ee;
        }

        .auth-panel__headline {
          font-size: 2.125rem;
          font-weight: 800;
          line-height: 1.2;
          letter-spacing: -0.03em;
          color: #ffffff;
          margin: 0;
        }

        .auth-panel__headline-accent {
          background: linear-gradient(135deg, #38bdf8 0%, #06b6d4 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .auth-panel__subtext {
          font-size: 13.5px;
          color: #cbd5e1;
          line-height: 1.65;
          margin: 0;
        }

        /* Feature Cards */
        .auth-panel__features {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .auth-feature-card {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          padding: 1rem 1.125rem;
          border-radius: 14px;
          background: rgba(15, 23, 42, 0.65);
          border: 1px solid rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(16px);
          transition: all 250ms ease;
        }

        .auth-feature-card:hover {
          background: rgba(15, 23, 42, 0.85);
          border-color: rgba(56, 189, 248, 0.25);
          transform: translateX(3px);
        }

        .auth-feature-card__icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border-radius: 10px;
          flex-shrink: 0;
        }

        .auth-feature-card__icon--emerald {
          background: rgba(16, 185, 129, 0.16);
          border: 1px solid rgba(16, 185, 129, 0.28);
        }

        .auth-feature-card__icon--purple {
          background: rgba(99, 102, 241, 0.16);
          border: 1px solid rgba(99, 102, 241, 0.28);
        }

        .auth-feature-card__icon--orange {
          background: rgba(245, 158, 11, 0.16);
          border: 1px solid rgba(245, 158, 11, 0.28);
        }

        .auth-feature-card__content {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }

        .auth-feature-card__title {
          font-size: 13.5px;
          font-weight: 700;
          color: #f8fafc;
          margin: 0;
          letter-spacing: -0.01em;
        }

        .auth-feature-card__desc {
          font-size: 11.5px;
          color: #94a3b8;
          line-height: 1.5;
          margin: 0;
        }

        /* Stats Row */
        .auth-panel__stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.875rem;
          padding: 1rem 1.125rem;
          border-radius: 14px;
          background: rgba(15, 23, 42, 0.55);
          border: 1px solid rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(12px);
        }

        .auth-stat-item {
          display: flex;
          align-items: center;
          gap: 0.625rem;
        }

        .auth-stat-item__icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.08);
          flex-shrink: 0;
        }

        .auth-stat-item__meta {
          display: flex;
          flex-direction: column;
        }

        .auth-stat-item__value {
          font-family: 'JetBrains Mono', monospace;
          font-size: 15px;
          font-weight: 800;
          color: #ffffff;
          line-height: 1.15;
          letter-spacing: -0.02em;
        }

        .auth-stat-item__label {
          font-size: 10.5px;
          font-weight: 600;
          color: #94a3b8;
          text-transform: capitalize;
        }

        /* Footer Pill */
        .auth-panel__footer {
          padding-top: 1.5rem;
        }

        .auth-panel__footer-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.625rem;
          padding: 0.375rem 0.875rem;
          border-radius: 9999px;
          background: rgba(15, 23, 42, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(12px);
          font-size: 11px;
          color: #94a3b8;
          letter-spacing: 0.02em;
        }

        .auth-panel__footer-icon {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .auth-panel__footer-sep {
          color: rgba(255, 255, 255, 0.2);
        }

        /* ── Right Form Area ─────────────────────────────── */
        .auth-form-area {
          position: relative;
          z-index: 10;
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem 1.25rem;
          min-height: 100svh;
        }

        /* Floating glass badge on desktop right */
        .auth-floating-shield-badge {
          display: none;
          position: absolute;
          top: 3.5rem;
          right: 3.5rem;
          z-index: 2;
          background: rgba(255, 255, 255, 0.75);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.9);
          box-shadow:
            0 20px 40px -10px rgba(14, 165, 233, 0.15),
            0 1px 3px rgba(0, 0, 0, 0.05);
          border-radius: 16px;
          padding: 0.75rem 1rem;
          align-items: center;
          gap: 0.75rem;
        }

        .auth-floating-shield-badge__icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: linear-gradient(135deg, rgba(2, 132, 199, 0.12) 0%, rgba(56, 189, 248, 0.2) 100%);
          border: 1px solid rgba(56, 189, 248, 0.3);
        }

        .auth-floating-shield-badge__lines {
          display: flex;
          flex-direction: column;
          font-size: 10.5px;
          font-weight: 600;
          color: #475569;
          line-height: 1.35;
          letter-spacing: 0.02em;
        }

        .auth-floating-shield-badge__bold {
          font-weight: 700;
          color: #0369a1;
        }

        /* Mobile Header */
        .auth-mobile-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          max-width: 32rem;
          margin-bottom: 1.5rem;
          padding: 0.75rem 1.25rem;
          background: rgba(15, 23, 42, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(12px);
          border-radius: 12px;
        }

        .auth-mobile-header__brand {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          text-decoration: none;
        }

        .auth-mobile-header__wordmark {
          font-family: 'JetBrains Mono', monospace;
          font-size: 1.25rem;
          font-weight: 800;
          color: #ffffff;
        }

        .auth-mobile-header__badge {
          display: inline-flex;
          padding: 2px 7px;
          border-radius: 4px;
          background: rgba(14, 165, 233, 0.18);
          border: 1px solid rgba(56, 189, 248, 0.35);
          color: #38bdf8;
          font-family: 'JetBrains Mono', monospace;
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .auth-form-container {
          width: 100%;
          max-width: 32rem;
          position: relative;
          z-index: 5;
        }

        /* ── Responsive Viewports ─────────────────────── */
        @media (min-width: 1024px) {
          .auth-shell {
            flex-direction: row;
          }
          .auth-panel {
            display: flex;
            width: 48%;
            max-width: 600px;
            min-height: 100svh;
          }
          .auth-mobile-header {
            display: none;
          }
          .auth-form-area {
            padding: 3rem 2.5rem;
            justify-content: center;
          }
          .auth-floating-shield-badge {
            display: flex;
          }
        }

        @media (min-width: 1366px) {
          .auth-panel {
            width: 50%;
            max-width: 660px;
          }
          .auth-panel__content {
            padding: 3.5rem 4rem;
          }
          .auth-panel__headline {
            font-size: 2.375rem;
          }
          .auth-form-container {
            max-width: 33.5rem;
          }
        }
      `}</style>
    </div>
  );
}

