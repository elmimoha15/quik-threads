import { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../lib/apiService';
import CreditsDisplay from '../components/generator/CreditsDisplay';
import StepIndicator from '../components/generator/StepIndicator';
import TopicStep from '../components/generator/TopicStep';
import ContentSourceStep from '../components/generator/ContentSourceStep';
import CustomizeStep from '../components/generator/CustomizeStep';
import { validateUrl, normalizeUrl, getPlatformDisplayName } from '../utils/urlValidator';
import { firestoreThreadService } from '../services/firestoreThreadService';

interface GeneratorProps {
  onNavigate: (page: string) => void;
}

export default function Generator({ onNavigate }: GeneratorProps) {
  const { currentUser, userProfile, usageData, refreshUsageData } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [topic, setTopic] = useState('');
  const [contentSource, setContentSource] = useState<'file' | 'url' | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [aiInstructions, setAiInstructions] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFile(file);
      setContentSource('file');
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setFile(file);
      setContentSource('file');
    }
  };

  const removeFile = () => {
    setFile(null);
    setContentSource(null);
  };

  const handleGenerate = async () => {
    if (!userProfile) {
      setError('Please log in to generate content');
      return;
    }

    if (!topic.trim()) {
      setError('Please provide a topic or idea for your X posts');
      return;
    }

    // Check if user has credits
    const maxCredits = usageData?.maxCredits || 0;
    const creditsUsed = usageData?.creditsUsed || 0;
    const remaining = usageData?.remaining !== undefined ? usageData.remaining : Math.max(0, maxCredits - creditsUsed);
    
    if (remaining <= 0) {
      setError('You have reached your monthly credit limit. Please upgrade your plan.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      let result;

      if (contentSource === 'file' && file) {
        // Upload file first, then process
        const uploadResult = await apiService.uploadFile(file, topic, aiInstructions);
        
        if (!uploadResult.success) {
          throw new Error(uploadResult.message || 'File upload failed');
        }

        // Now process the uploaded file
        result = await apiService.processUrl(uploadResult.fileUrl, topic, aiInstructions);
      } else if (contentSource === 'url' && url) {
        // Validate URL before processing
        const validation = validateUrl(url);
        
        if (!validation.isValid) {
          setError(validation.error || 'Invalid URL provided');
          setIsGenerating(false);
          return;
        }

        // Normalize URL (add https:// if missing)
        const normalizedUrl = normalizeUrl(url);
        
        console.log(`Processing ${getPlatformDisplayName(validation.platform)} URL: ${normalizedUrl}`);
        
        result = await apiService.processUrl(normalizedUrl, topic, aiInstructions);
      } else {
        // Topic-only generation - not implemented yet in backend
        setError('Please upload a file or provide a URL to generate content.');
        setIsGenerating(false);
        return;
      }

      if (result?.jobId) {
        // Store job data for Processing page
        const jobData = {
          jobId: result.jobId,
          title: topic || file?.name || 'Content Generation',
          type: contentSource || 'topic',
          fileName: file?.name || (contentSource === 'url' ? 'URL Content' : 'Topic'),
          url: contentSource === 'url' ? url : undefined,
          topic: topic,
          aiInstructions: aiInstructions,
          createdAt: new Date().toISOString(),
          status: result.status || 'processing'
        };
        
        localStorage.setItem('currentJob', JSON.stringify(jobData));
        
        // Save to Firestore instead of localStorage
        const newThread = {
          id: result.jobId,
          title: topic || file?.name || url || 'Content Generation',
          status: 'processing' as const,
          createdAt: new Date().toISOString(),
          contentSource: file?.name || url || topic,
        };
        
        try {
          await firestoreThreadService.addThread(currentUser!.uid, newThread);
          console.log('✅ Thread saved to Firestore');
        } catch (firestoreError) {
          console.error('Failed to save thread to Firestore:', firestoreError);
          // Don't block the generation, just log the error
        }
        
        toast.success('Thread generation started! You can navigate to other pages while it processes.', {
          duration: 4000,
          icon: '✨',
        });
        
        // Refresh usage data after successful job creation
        refreshUsageData();

        // Navigate to processing page immediately
        onNavigate('processing');
      }
    } catch (error: any) {
      console.error('Generation error:', error);
      
      // Handle tier restriction errors
      if (error.message && error.message.includes('exceeds your plan limit')) {
        setError(error.message);
      } else {
        setError(error.message || 'Failed to generate content. Please try again.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8faf9' }}>
      <Sidebar currentPage="dashboard" onNavigate={onNavigate} />

      <div className="ml-64 p-8">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h1 className="text-4xl font-bold mb-4" style={{ color: '#0f1a14' }}>Generate X Posts</h1>
                <p className="text-xl mb-6" style={{ color: '#6b7280' }}>
                  Transform your content into engaging X posts in minutes
                </p>
                <CreditsDisplay usage={usageData} onNavigate={onNavigate} />
              </div>

              <StepIndicator currentStep={currentStep} />

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 rounded-xl"
                  style={{
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)'
                  }}
                >
                  <p className="font-medium" style={{ color: '#ef4444' }}>{error}</p>
                </motion.div>
              )}

              {/* Step 1: Topic */}
              {currentStep === 1 && (
                <TopicStep
                  topic={topic}
                  setTopic={setTopic}
                  setCurrentStep={setCurrentStep}
                />
              )}

              {/* Step 2: Content Source */}
              {currentStep === 2 && (
                <ContentSourceStep
                  setContentSource={setContentSource}
                  file={file}
                  url={url}
                  setUrl={setUrl}
                  handleFileUpload={handleFileUpload}
                  handleFileDrop={handleFileDrop}
                  removeFile={removeFile}
                  setCurrentStep={setCurrentStep}
                />
              )}

              {/* Step 3: Customize Output */}
              {currentStep === 3 && (
                <CustomizeStep
                  topic={topic}
                  aiInstructions={aiInstructions}
                  setAiInstructions={setAiInstructions}
                  isGenerating={isGenerating}
                  usage={usageData}
                  handleGenerate={handleGenerate}
                  setCurrentStep={setCurrentStep}
                />
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
