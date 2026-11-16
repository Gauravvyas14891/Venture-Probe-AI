import React, { useState } from 'react';
import { Menu, X, RotateCcw, ArrowRight } from 'lucide-react';

interface NavbarProps {
  currentStep: 'landing' | 'interview' | 'review' | 'researching' | 'report';
  onReset: () => void;
  hasActiveReport: boolean;
  onViewReport?: () => void;
  onLoadSampleReport?: () => void;
  onStartFromHeader?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentStep,
  onReset,
  hasActiveReport,
  onViewReport,
  onLoadSampleReport,
  onStartFromHeader,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'Process', href: '#process' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'FAQ', href: '#faq' },
  ];

  const handleNavClick = (href: string) => {
    setMobileMenuOpen(false);
    if (currentStep !== 'landing') {
      onReset();
      setTimeout(() => {
        document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
      }, 60);
    } else {
      document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleValidateClick = () => {
    setMobileMenuOpen(false);
    if (onStartFromHeader) {
      onStartFromHeader();
    } else {
      const el = document.getElementById('idea-composer');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const textarea = el.querySelector('textarea');
        textarea?.focus();
      }
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#d3d4c8] bg-[#f1f3e6]/95 backdrop-blur-sm">
      <div className="mx-auto flex h-[72px] max-w-[1200px] items-center justify-between gap-8 px-6">
        {/* Zone 1: Single-line Brand Wordmark */}
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#3f6212] rounded-[8px]"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            className="shrink-0 text-[#3f6212]"
          >
            <path d="M12 2L21 7.2V16.8L12 22L3 16.8V7.2L12 2Z" fill="currentColor" fillOpacity="0.16" stroke="currentColor" strokeWidth="1.75" />
            <path d="M12 6.5L16.5 14.5H7.5L12 6.5Z" fill="currentColor" />
          </svg>
          <span className="text-[19px] font-extrabold tracking-[-0.02em] text-[#000000]">
            VentureProbe
          </span>
        </button>

        {/* Zone 2: Navigation Links (Landing) OR Step Context (Workspace) */}
        {currentStep === 'landing' ? (
          <nav
            aria-label="Primary"
            className="hidden md:flex items-center gap-8 text-[15px] font-medium text-[#333333]"
          >
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(link.href);
                }}
                className="whitespace-nowrap shrink-0 py-1 hover:text-[#000000] hover:underline underline-offset-4 decoration-[#3f6212] transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#3f6212] rounded"
              >
                {link.label}
              </a>
            ))}
          </nav>
        ) : (
          <div className="hidden lg:flex items-center gap-2 text-xs font-medium text-[#4d4c4c] whitespace-nowrap">
            <span className={currentStep === 'interview' ? 'text-[#3f6212] font-bold' : ''}>
              1. Idea Brief
            </span>
            <span aria-hidden="true">·</span>
            <span className={currentStep === 'interview' ? 'text-[#000000] font-bold' : ''}>
              2. Analyst Interview
            </span>
            <span aria-hidden="true">·</span>
            <span className={currentStep === 'review' ? 'text-[#000000] font-bold' : ''}>
              3. Profile Gate
            </span>
            <span aria-hidden="true">·</span>
            <span className={currentStep === 'researching' ? 'text-[#3f6212] font-bold' : ''}>
              4. Deep Research
            </span>
            <span aria-hidden="true">·</span>
            <span className={currentStep === 'report' ? 'text-[#3f6212] font-bold' : ''}>
              5. Report
            </span>
          </div>
        )}

        {/* Zone 3: Actions + Mobile Menu Button */}
        <div className="flex items-center gap-3 shrink-0">
          {currentStep === 'landing' ? (
            <>
              <div className="hidden md:flex items-center gap-3">
                {onLoadSampleReport && (
                  <button
                    type="button"
                    onClick={onLoadSampleReport}
                    className="whitespace-nowrap shrink-0 rounded-[8px] border border-[#d3d4c8] bg-transparent px-4 py-2 text-sm font-semibold text-[#000000] hover:bg-[#e9eade] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3f6212]"
                  >
                    Sample Report
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleValidateClick}
                  className="whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 rounded-[8px] bg-[#3f6212] px-4 py-2 text-sm font-semibold text-[#fcfcfd] hover:bg-[#365314] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3f6212]"
                >
                  <span>Validate Idea</span>
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                className="md:hidden inline-flex h-11 w-11 items-center justify-center rounded-[8px] border border-[#d3d4c8] text-[#000000] hover:bg-[#e9eade] transition-colors"
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2.5">
              {hasActiveReport && currentStep !== 'report' && onViewReport && (
                <button
                  type="button"
                  onClick={onViewReport}
                  className="whitespace-nowrap shrink-0 rounded-[8px] border border-[#3f6212] bg-[#3f6212]/10 px-3.5 py-2 text-xs font-semibold text-[#3f6212] hover:bg-[#3f6212]/20 transition-colors"
                >
                  View Report
                </button>
              )}
              <button
                type="button"
                onClick={onReset}
                className="whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 rounded-[8px] border border-[#d3d4c8] bg-[#e9eade] px-3.5 py-2 text-xs font-semibold text-[#000000] hover:bg-[#d3d4c8]/60 transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>New Idea</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Narrow-Screen Navigation Drawer */}
      {currentStep === 'landing' && mobileMenuOpen && (
        <div className="md:hidden border-t border-[#d3d4c8] bg-[#f1f3e6] px-6 py-5 space-y-4">
          <nav aria-label="Mobile" className="flex flex-col space-y-3 text-base font-medium text-[#000000]">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(link.href);
                }}
                className="py-2 border-b border-[#d3d4c8]/70 hover:text-[#3f6212] transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="flex flex-col gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleValidateClick}
              className="w-full rounded-[8px] bg-[#3f6212] px-4 py-3 text-sm font-semibold text-[#fcfcfd] hover:bg-[#365314] transition-colors"
            >
              Validate Idea
            </button>
            {onLoadSampleReport && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLoadSampleReport();
                }}
                className="w-full rounded-[8px] border border-[#d3d4c8] bg-transparent px-4 py-3 text-sm font-semibold text-[#000000] hover:bg-[#e9eade] transition-colors"
              >
                Sample Report
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
