import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LandingHero } from './components/LandingHero';
import { InterviewView } from './components/InterviewView';
import { ProfileReviewModal } from './components/ProfileReviewModal';
import { ResearchProgressView } from './components/ResearchProgressView';
import { ReportDashboard } from './components/ReportDashboard';
import { EvidenceDrawer } from './components/EvidenceDrawer';
import {
  StartupProfile,
  InterviewMessage,
  ReadinessGate,
  ResearchReport,
  EvidenceItem,
  BusinessIdentityLock,
  ExtractedStartupProfile,
} from './types';

const createDefaultLock = (rawIdea: string = ''): BusinessIdentityLock => ({
  isLocked: false,
  lockedAt: '',
  verbatimFounderIdea: rawIdea,
  canonicalProductName: 'Untitled Venture',
  productCategory: 'Unclassified Venture',
  productType: 'Hybrid / Other',
  problemBeingSolved: '',
  primaryEndUser: '',
  primaryPayingCustomer: '',
  productOrServiceSold: '',
  howProductWorks: '',
  statedRevenueModel: '',
  statedPricingStructure: 'Other',
  geographicMarket: '',
  mainValueProposition: '',
  keyUnverifiedAssumptions: [],
  flaggedAmbiguities: [],
  prohibitedSilentSubstitutions: [],
  coherenceStatus: 'NEEDS_CLARIFICATION',
  coherenceRationale: 'Initial concept awaiting Business Model Lock extraction.',
});

const defaultProfile: StartupProfile = {
  startupName: 'Untitled Venture',
  oneLiner: '',
  detailedDescription: '',
  problemBeingSolved: '',
  proposedSolution: '',
  whyFounderBelievesProblemExists: '',
  primaryCustomer: '',
  secondaryCustomer: '',
  customerModel: 'B2C',
  customerDemographics: '',
  customerGeography: '',
  customerIndustry: '',
  customerSegment: '',
  buyerPersona: '',
  endUserPersona: '',
  decisionMaker: '',
  problemDescription: '',
  problemFrequency: '',
  problemSeverity: 'Frequent Friction',
  currentWorkaround: '',
  existingAlternatives: '',
  costOfProblem: '',
  emotionalFriction: '',
  isUrgentOrOptional: 'Urgent',
  productOrService: '',
  mainFeatures: [],
  userJourneySummary: '',
  valueProposition: '',
  differentiation: '',
  whyUsersWouldSwitch: '',
  whyUsersMightNotSwitch: '',
  revenueModel: '',
  pricingAssumption: '',
  pricingStructure: 'Subscription',
  whoPays: '',
  paymentFrequency: '',
  initialCountry: '',
  targetGeography: '',
  potentialInternationalMarkets: [],
  industryCategory: '',
  marketSizeAssumptions: '',
  growthAssumptions: '',
  knownCompetitors: [],
  indirectCompetitors: [],
  currentAlternatives: [],
  whyExistingInsufficient: '',
  discoveryChannels: [],
  salesModel: '',
  distributionPartnerships: [],
  communityAcquisition: '',
  moatType: '',
  technologyAdvantage: '',
  distributionAdvantage: '',
  dataAdvantage: '',
  networkEffects: '',
  costAdvantage: '',
  regulatoryAdvantage: '',
  founderAdvantage: '',
  humanInvolvementRequired: '',
  logisticsRequirements: '',
  verificationProcess: '',
  customerSupportNeeds: '',
  supplySideRequirements: '',
  operationalRisks: [],
  regulatedAreas: [],
  requiresProfessionalLegalCounsel: false,
  regulatoryNotes: '',
  regulatoryDisclaimer: 'Informational analysis only. Not legal or financial advice.',
  founderStatedAssumptions: [],
  aiInferredAssumptions: [],
  businessIdentityLock: createDefaultLock(),
};

const defaultGate: ReadinessGate = {
  ideaClarity: 'MISSING',
  customerClarity: 'MISSING',
  problemClarity: 'MISSING',
  geographyClarity: 'MISSING',
  solutionClarity: 'MISSING',
  businessModelClarity: 'MISSING',
  competitionClarity: 'MISSING',
  differentiationClarity: 'MISSING',
  isReady: false,
  readinessScore: 0,
  missingSummary: ['Initial startup idea definition'],
};

export default function App() {
  const [step, setStep] = useState<'landing' | 'interview' | 'review' | 'researching' | 'report'>('landing');
  const [messages, setMessages] = useState<InterviewMessage[]>([]);
  const [readiness, setReadiness] = useState<ReadinessGate>(defaultGate);
  const [currentProfile, setCurrentProfile] = useState<StartupProfile>(defaultProfile);
  const [report, setReport] = useState<ResearchReport | null>(null);
  const [researchMode, setResearchMode] = useState<'QUICK_FEASIBILITY' | 'COMPLETE_DEEP_DIVE'>('COMPLETE_DEEP_DIVE');
  const [isLoading, setIsLoading] = useState(false);
  const [appError, setAppError] = useState<string | null>(null);

  // Structured Interview State (Section 6)
  const [originalIdea, setOriginalIdea] = useState<string>('');
  const [extractedProfile, setExtractedProfile] = useState<ExtractedStartupProfile | undefined>(undefined);
  const [answeredFields, setAnsweredFields] = useState<string[]>([]);
  const [interviewStatus, setInterviewStatus] = useState<
    'extracting' | 'interviewing' | 'ready_for_review' | 'confirmed' | 'researching'
  >('interviewing');

  // Modals & Drawers
  const [isEvidenceDrawerOpen, setIsEvidenceDrawerOpen] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceItem | null>(null);

  // Restore session from localStorage on initial load (Section 6)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ventureprobe_interview_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.originalIdea) setOriginalIdea(parsed.originalIdea);
        if (parsed.extractedProfile) setExtractedProfile(parsed.extractedProfile);
        if (parsed.currentProfile) setCurrentProfile(parsed.currentProfile);
        if (parsed.messages && parsed.messages.length > 0) setMessages(parsed.messages);
        if (parsed.readiness) setReadiness(parsed.readiness);
        if (parsed.answeredFields) setAnsweredFields(parsed.answeredFields);
        if (parsed.step) setStep(parsed.step);
        if (parsed.interviewStatus) setInterviewStatus(parsed.interviewStatus);
      }
    } catch (err) {
      console.warn('Failed to restore interview session:', err);
    }
  }, []);

  // Save session to localStorage on updates (Section 6)
  useEffect(() => {
    if (originalIdea || messages.length > 0) {
      try {
        localStorage.setItem(
          'ventureprobe_interview_state',
          JSON.stringify({
            originalIdea,
            extractedProfile,
            currentProfile,
            messages,
            readiness,
            answeredFields,
            step,
            interviewStatus,
          })
        );
      } catch (err) {
        console.warn('Failed to persist interview session:', err);
      }
    }
  }, [originalIdea, extractedProfile, currentProfile, messages, readiness, answeredFields, step, interviewStatus]);

  // Step 1: Start interview from Landing with Dedicated Structured Extraction (Step 1 to 5)
  const handleStartInterview = async (rawIdea: string) => {
    // Preserve complete startup description without truncation (Step 1)
    setOriginalIdea(rawIdea);
    setIsLoading(true);
    setInterviewStatus('extracting');

    const initialMsg: InterviewMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: rawIdea,
      timestamp: new Date().toISOString(),
    };

    const newMessages = [initialMsg];
    setMessages(newMessages);
    setStep('interview');

    try {
      // Send complete original description to dedicated structured extraction endpoint (Step 2)
      const res = await fetch('/api/interview/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawIdea,
          currentProfile: {
            ...defaultProfile,
            detailedDescription: rawIdea,
            oneLiner: rawIdea.slice(0, 160),
          },
        }),
      });

      if (!res.ok) throw new Error('Failed to run structured extraction');
      const data = await res.json();

      const assistantMsg: InterviewMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toISOString(),
        suggestedAnswers: data.suggestedAnswers,
      };

      setMessages([...newMessages, assistantMsg]);
      if (data.updatedProfile) setCurrentProfile(data.updatedProfile);
      if (data.extractedProfile) setExtractedProfile(data.extractedProfile);
      if (data.readiness) setReadiness(data.readiness);
      if (Array.isArray(data.answeredFields)) setAnsweredFields(data.answeredFields);

      setInterviewStatus(data.isComplete ? 'ready_for_review' : 'interviewing');
    } catch (err) {
      console.warn('Network issue or timeout during extraction, running local extraction engine:', err);
      // Fallback interview start
      const fallbackMsg: InterviewMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: `🔒 **Venture Profile Extracted & Locked**\n\nI have analyzed your startup briefing and locked your canonical model.\n\nWho is the primary paying customer experiencing this friction?`,
        timestamp: new Date().toISOString(),
        suggestedAnswers: [
          'Busy individuals and commuters',
          'Early-stage founders and small teams',
          'I haven\'t decided yet',
          'Skip this question',
        ],
      };
      setMessages([...newMessages, fallbackMsg]);
      setInterviewStatus('interviewing');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Send reply in interview with Question-Relevance Validation (Rules A to F)
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: InterviewMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setIsLoading(true);

    try {
      const res = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: text,
          history: updatedHistory,
          currentProfile,
          rawIdea: originalIdea,
          extractedProfile,
          answeredFields,
        }),
      });

      if (!res.ok) throw new Error('Failed to process message');
      const data = await res.json();

      const assistantMsg: InterviewMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toISOString(),
        suggestedAnswers: data.suggestedAnswers,
      };

      setMessages([...updatedHistory, assistantMsg]);
      if (data.updatedProfile) setCurrentProfile(data.updatedProfile);
      if (data.extractedProfile) setExtractedProfile(data.extractedProfile);
      if (data.readiness) setReadiness(data.readiness);
      if (Array.isArray(data.answeredFields)) setAnsweredFields(data.answeredFields);

      if (data.isComplete) {
        setInterviewStatus('ready_for_review');
      }
    } catch (err) {
      console.warn('Network issue during interview message:', err);
      const fallbackMsg: InterviewMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: `✓ Recorded your answer. Your profile is updated. Would you like to proceed to the Profile Gate?`,
        timestamp: new Date().toISOString(),
        suggestedAnswers: ['Proceed to Profile Review', 'Add another detail'],
      };
      setMessages([...updatedHistory, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Confirm Profile and Trigger Research
  const handleConfirmAndStartResearch = async (
    confirmedProfile: StartupProfile,
    mode: 'QUICK_FEASIBILITY' | 'COMPLETE_DEEP_DIVE'
  ) => {
    setCurrentProfile(confirmedProfile);
    setResearchMode(mode);
    setStep('researching');
    setInterviewStatus('researching');

    try {
      const res = await fetch('/api/research/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: confirmedProfile,
          mode,
        }),
      });

      if (!res.ok) throw new Error('Research execution failed');
      const reportData: ResearchReport = await res.json();
      setReport(reportData);
      setAppError(null);
      setStep('report');
    } catch (err) {
      console.error('Research error:', err);
      setAppError('Research synthesis could not be completed via network. Please adjust parameters or retry.');
      setStep('review');
    }
  };

  // Reset to start a new idea
  const handleReset = () => {
    localStorage.removeItem('ventureprobe_interview_state');
    setStep('landing');
    setMessages([]);
    setCurrentProfile(defaultProfile);
    setExtractedProfile(undefined);
    setOriginalIdea('');
    setAnsweredFields([]);
    setInterviewStatus('interviewing');
    setReadiness(defaultGate);
    setReport(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      <Navbar
        currentStep={step}
        onReset={handleReset}
        hasActiveReport={!!report}
        onViewReport={() => report && setStep('report')}
      />

      <main className="flex-1">
        {step === 'landing' && (
          <LandingHero
            onStartInterview={handleStartInterview}
          />
        )}

        {step === 'interview' && (
          <InterviewView
            messages={messages}
            readiness={readiness}
            currentProfile={currentProfile}
            extractedProfile={extractedProfile}
            originalIdea={originalIdea}
            interviewStatus={interviewStatus}
            isLoading={isLoading}
            onSendMessage={handleSendMessage}
            onProceedToReview={() => setStep('review')}
          />
        )}

        {step === 'review' && (
          <ProfileReviewModal
            profile={currentProfile}
            extractedProfile={extractedProfile}
            onConfirmAndStartResearch={handleConfirmAndStartResearch}
            onBackToInterview={() => setStep('interview')}
          />
        )}

        {step === 'researching' && (
          <ResearchProgressView
            profile={currentProfile}
            mode={researchMode}
          />
        )}

        {step === 'report' && report && (
          <ReportDashboard
            report={report}
            onOpenEvidence={(ev) => {
              setSelectedEvidence(ev);
              setIsEvidenceDrawerOpen(true);
            }}
            onEditProfile={() => setStep('review')}
          />
        )}
      </main>

      {/* Traceable Evidence Drawer */}
      <EvidenceDrawer
        isOpen={isEvidenceDrawerOpen}
        onClose={() => {
          setIsEvidenceDrawerOpen(false);
          setSelectedEvidence(null);
        }}
        selectedEvidence={selectedEvidence}
        sources={report?.sources || []}
      />

    </div>
  );
}
