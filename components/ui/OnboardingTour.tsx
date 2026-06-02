'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  HelpCircle,
  TrendingUp,
  Map,
  Compass,
  Zap,
  CheckCircle,
  Award
} from 'lucide-react';

interface TourStep {
  title: string;
  badge: string;
  description: string;
  visual: React.ReactNode;
  tip: string;
}

export function OnboardingTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Check if user has already completed the tour
    const hasCompletedTour = localStorage.getItem('cf360_tour_completed');
    if (!hasCompletedTour) {
      // Auto-open after a short delay for new users
      const timer = setTimeout(() => setIsOpen(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const completeTour = () => {
    localStorage.setItem('cf360_tour_completed', 'true');
    setIsOpen(false);
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      completeTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const steps: TourStep[] = [
    {
      title: 'Welcome to CashFlow360',
      badge: 'Getting Started',
      description: 'Your analytics-first, non-custodial SME Treasury Intelligence platform built on Arc. Sourced directly from on-chain event logs with sub-second finality.',
      visual: (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: 180,
          background: 'linear-gradient(135deg, var(--ph-red-light) 0%, rgba(255,122,51,0.05) 100%)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-active)',
          gap: 12
        }}>
          <div style={{
            width: 50,
            height: 50,
            borderRadius: '50%',
            background: 'var(--ph-red)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-glow)'
          }}>
            <Award size={24} style={{ color: 'white' }} />
          </div>
          <div style={{ fontWeight: 800, fontSize: 16 }}>SME Stablecoins Stack</div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Powered by USDC as Native Gas on Arc</div>
        </div>
      ),
      tip: 'This tour takes 60 seconds to fully understand the features. Highly recommended for first-time treasury managers!'
    },
    {
      title: 'D3 Cash Flow Sankey Map',
      badge: 'Visual Cash Flows',
      description: 'Interact with your cash flows through an advanced D3.js money movement map. Trace source addresses, routing channels, and target vendor categories in a unified visual map.',
      visual: (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-around',
          height: 180,
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          padding: 16,
          border: '1px solid var(--border-primary)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, background: 'var(--ph-red-light)', color: 'var(--ph-red)', padding: '2px 6px', borderRadius: 4 }}>Inflow</span>
            <div style={{ flex: 1, borderTop: '2px dashed var(--ph-green)', opacity: 0.3, margin: '0 8px' }} />
            <span style={{ fontSize: 11, background: 'var(--bg-surface)', padding: '2px 6px', borderRadius: 4 }}>Treasury Vault</span>
            <div style={{ flex: 1, borderTop: '2px dashed var(--ph-red)', opacity: 0.3, margin: '0 8px' }} />
            <span style={{ fontSize: 11, background: 'rgba(247,165,1,0.12)', color: 'var(--ph-yellow)', padding: '2px 6px', borderRadius: 4 }}>Operations</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, color: 'var(--text-tertiary)', fontSize: 10 }}>
            <Map size={12} /> Click any node inside the Cash Flow page to highlight that specific stream!
          </div>
        </div>
      ),
      tip: 'Navigate to the Flow Map tab to trace real-time client payments directly to their exact vendor categories.'
    },
    {
      title: 'Runway Projection & What-Ifs',
      badge: 'Future Analytics',
      description: 'Calculate your business cash runway. Drag scenario sliders to simulate what-if revenue drops, extra staff hires, or CCTP cross-chain bridge injections to guarantee business survivability.',
      visual: (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          height: 180,
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          padding: 16,
          border: '1px solid var(--border-primary)',
          gap: 12
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Revenue Scenario</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ph-red)' }}>-20%</span>
          </div>
          <div style={{ width: '100%', height: 6, background: 'var(--bg-elevated)', borderRadius: 3, position: 'relative' }}>
            <div style={{ width: '40%', height: '100%', background: 'var(--ph-red)', borderRadius: 3 }} />
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'white', position: 'absolute', top: -3, left: '40%', boxShadow: '0 1px 3px rgba(0,0,0,0.5)' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-tertiary)' }}>
            <span>Runway Alert</span>
            <span style={{ color: 'var(--ph-yellow)', fontWeight: 600 }}>45 days remaining</span>
          </div>
        </div>
      ),
      tip: 'Simulate potential downturns inside the Runway Calculator page before committing to major expenses.'
    },
    {
      title: 'Multi-Chain Treasury Radar',
      badge: 'Unified Liquidity',
      description: 'Your treasury is rarely on a single chain. The Treasury Radar queries ERC-20 stablecoin contracts in parallel across Ethereum, Base, Arbitrum, and Arc to visualize unified balances.',
      visual: (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: 180,
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          padding: 16,
          border: '1px solid var(--border-primary)',
          position: 'relative'
        }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', border: '1px solid var(--border-active)', display: 'flex', alignItems: 'center', justifySelf: 'center', position: 'relative', animation: 'spin 12s linear infinite' }}>
            <div style={{ width: 6, height: 6, background: 'var(--ph-red)', borderRadius: '50%', position: 'absolute', top: 10, left: 10 }} />
            <div style={{ width: 6, height: 6, background: 'var(--ph-green)', borderRadius: '50%', position: 'absolute', bottom: 10, right: 10 }} />
          </div>
          <div style={{ position: 'absolute', fontSize: 11, fontWeight: 700, color: 'white' }}>
            4 chains
          </div>
        </div>
      ),
      tip: 'Check the Radar regularly to monitor for idle funds on high-fee networks like Ethereum Sepolia.'
    },
    {
      title: 'Circle CCTP Cross-Chain Bridge',
      badge: 'Zero Slippage Bridge',
      description: 'Transfer USDC securely across chains using Circle CCTP (Cross-Chain Transfer Protocol). Burns USDC on the source chain and mints it 1:1 on the target chain with zero slippage.',
      visual: (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: 180,
          background: 'linear-gradient(135deg, rgba(29,74,255,0.08) 0%, rgba(182,42,217,0.05) 100%)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid rgba(29,74,255,0.2)',
          padding: 16,
          gap: 12
        }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Base</span>
            <div style={{ width: 30, height: 2, background: 'var(--text-tertiary)', borderTop: '2px dotted var(--ph-red)' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ph-red)' }}>Arc</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', textAlign: 'center' }}>
            CCTP Steps: Burn ➔ Attestation ➔ Mint (100% Secure)
          </div>
        </div>
      ),
      tip: 'Go to the Send & Bridge tab to start your first zero-slippage cross-chain transfer.'
    }
  ];

  const currentStepData = steps[currentStep];

  return (
    <>
      {/* Help icon trigger */}
      <button 
        onClick={() => {
          setCurrentStep(0);
          setIsOpen(true);
        }}
        className="btn btn-secondary" 
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        title="Launch Interactive Tour"
      >
        <HelpCircle size={14} />
        Quick Guide
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="modal-overlay" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
          }}>
            <motion.div 
              className="card"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{ width: '100%', maxWidth: '500px', margin: '20px', overflow: 'visible', position: 'relative' }}
            >
              {/* Close Button */}
              <button 
                className="btn btn-ghost btn-sm" 
                onClick={completeTour}
                style={{ position: 'absolute', top: 12, right: 12, zIndex: 10 }}
              >
                <X size={16} />
              </button>

              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Header info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="badge badge-purple" style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {currentStepData.badge}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                    Step {currentStep + 1} of {steps.length}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {currentStepData.title}
                  </h3>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {currentStepData.description}
                  </p>
                </div>

                {/* Main Visual */}
                <div>
                  {currentStepData.visual}
                </div>

                {/* Helpful Tip */}
                <div style={{ 
                  background: 'var(--bg-elevated)', 
                  borderLeft: '3px solid var(--ph-red)', 
                  padding: '10px 12px', 
                  borderRadius: '0 var(--radius-md) var(--radius-md) 0',
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5
                }}>
                  <strong style={{ color: 'var(--text-primary)' }}>💡 Pro-Tip:</strong> {currentStepData.tip}
                </div>

                {/* Navigation Controls */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginTop: 8,
                  paddingTop: 12,
                  borderTop: '1px solid var(--border-secondary)'
                }}>
                  {/* Dots Indicator */}
                  <div style={{ display: 'flex', gap: 6 }}>
                    {steps.map((_, i) => (
                      <div 
                        key={i} 
                        style={{
                          width: i === currentStep ? 16 : 6,
                          height: 6,
                          borderRadius: 3,
                          background: i === currentStep ? 'var(--ph-red)' : 'var(--text-tertiary)',
                          opacity: i === currentStep ? 1 : 0.4,
                          transition: 'all 200ms ease'
                        }}
                      />
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    {currentStep > 0 && (
                      <button className="btn btn-secondary btn-sm" onClick={prevStep}>
                        <ChevronLeft size={14} /> Back
                      </button>
                    )}
                    <button className="btn btn-primary btn-sm" onClick={nextStep}>
                      {currentStep === steps.length - 1 ? 'Get Started' : 'Next'} <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
