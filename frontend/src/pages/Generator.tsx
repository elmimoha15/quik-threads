import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../lib/apiService';
import CreditsDisplay from '../components/generator/CreditsDisplay';
import StepIndicator from '../components/generator/StepIndicator';
import TopicStep from '../components/generator/TopicStep';
import ContentSourceStep from '../components/generator/ContentSourceStep';
import CustomizeStep from '../components/generator/CustomizeStep';
import { validateUrl, normalizeUrl, getPlatformDisplayName } from '../utils/urlValidator';

interface GeneratorProps {
  onNavigate: (page: string) => void;
}

export default function Generator({ onNavigate }: GeneratorProps) {
  const { userProfile } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [topic, setTopic] = useState('');
  const [contentSource, setContentSource] = useState<'file' | 'url' | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [aiInstructions, setAiInstructions] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<any>(null);
  const [loadingUsage, setLoadingUsage] = useState(false);

  useEffect(() => {
    const fetchUsage = async () => {
      if (!userProfile) return;

      setLoadingUsage(true);
      try {
        const usageData = await apiService.getUsage();
        setUsage(usageData);
      } catch (error) {
        console.error('Error fetching usage:', error);
      } finally {
        setLoadingUsage(false);
      }
    };

    fetchUsage();
  }, [userProfile]);

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
    const maxCredits = usage?.maxCredits || 0;
    const creditsUsed = usage?.creditsUsed || 0;
    const remaining = usage?.remaining !== undefined ? usage.remaining : Math.max(0, maxCredits - creditsUsed);
    
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
        
        // Navigate to processing page
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
    <div className="min-h-screen bg-background">
      <Sidebar currentPage="dashboard" onNavigate={onNavigate} />

      <div className="ml-64 p-8">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h1 className="text-4xl font-bold mb-4 text-foreground">Generate X Posts</h1>
                <p className="text-xl text-muted-foreground mb-6">
                  Transform your content into engaging X posts in minutes
                </p>
                <CreditsDisplay usage={usage} onNavigate={onNavigate} />
              </div>

              <StepIndicator currentStep={currentStep} />

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 rounded-xl border border-red-200 bg-red-50"
                >
                  <p className="text-red-600 font-medium">{error}</p>
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
                  usage={usage}
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
