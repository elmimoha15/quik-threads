import { useState } from 'react';
import { Hero } from '../components/landing page/Hero';
import { HowItWorks } from '../components/landing page/HowItWorks';
import { DemoPreview } from '../components/landing page/DemoPreview';
import { StorySection } from '../components/landing page/StorySection';
import { WhyDifferent } from '../components/landing page/WhyDifferent';
import { Testimonials } from '../components/landing page/Testimonails';
import { FinalCTA } from '../components/landing page/FinalCTA';
import { Footer } from '../components/landing page/Footer';
import { WaitlistModal } from '../components/landing page/WaitlistModal';
import { Navigation } from '../components/landing page/Navigation';

interface LandingProps {
  onNavigate: (page: string) => void;
}

export default function Landing({ onNavigate }: LandingProps) {
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);

  const handleJoinWaitlist = () => {
    setIsWaitlistOpen(true);
  };

  const handleCloseWaitlist = () => {
    setIsWaitlistOpen(false);
  };

  const handleLogin = () => {
    onNavigate('login');
  };

  const handleSignup = () => {
    onNavigate('signup');
  };

  return (
    <>
      <Navigation onLogin={handleLogin} onSignup={handleSignup} />
      <Hero onJoinWaitlist={handleJoinWaitlist} />
      <HowItWorks />
      <DemoPreview />
      <StorySection />
      <WhyDifferent />
      <Testimonials />
      <FinalCTA onJoinWaitlist={handleJoinWaitlist} />
      <Footer />
      
      <WaitlistModal 
        isOpen={isWaitlistOpen} 
        onClose={handleCloseWaitlist} 
      />
    </>
  );
}
