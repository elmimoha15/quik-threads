import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, CheckCircle, ArrowRight } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { apiService } from '../lib/apiService';

interface ProcessingProps {
  onNavigate: (page: string) => void;
}

export default function Processing({ onNavigate }: ProcessingProps) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [jobData, setJobData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get job data from localStorage
    const currentJobData = localStorage.getItem('currentJob');
    if (!currentJobData) {
      onNavigate('generator');
      return;
    }

    const data = JSON.parse(currentJobData);
    setJobData(data);
    
    // Start polling job status
    const pollJobStatus = async () => {
      try {
        const jobStatus = await apiService.getJob(data.jobId);
        
        // Update progress based on job status
        let newProgress = jobStatus.progress || 0;
        let step = '';
        
        switch (jobStatus.status) {
          case 'processing':
            newProgress = Math.max(newProgress, 10);
            step = 'Queuing your request...';
            break;
          case 'transcribing':
            newProgress = Math.max(newProgress, 25);
            step = 'Transcribing audio...';
            break;
          case 'generating':
            newProgress = Math.max(newProgress, 75);
            step = 'Crafting engaging tweets...';
            break;
          case 'completed':
            newProgress = 100;
            step = 'Complete!';
            
            // Store completed job data
            localStorage.setItem('completedJob', JSON.stringify(jobStatus));
            localStorage.removeItem('currentJob');
            
            // Redirect to editor after completion
            setTimeout(() => {
              onNavigate('editor');
            }, 1000);
            break;
          case 'failed':
            setError(jobStatus.error || 'Generation failed. Please try again.');
            step = 'Generation failed';
            break;
          default:
            step = 'Processing...';
        }
        
        setProgress(newProgress);
        setCurrentStep(step);
        
      } catch (error: any) {
        console.error('Error polling job status:', error);
        setError('Failed to check job status. Please refresh the page.');
      }
    };

    // Initial poll
    pollJobStatus();

    // Poll every 2 seconds
    const interval = setInterval(pollJobStatus, 2000);

    return () => clearInterval(interval);
  }, [onNavigate]);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar currentPage="processing" onNavigate={onNavigate} />

      <div className="ml-64 p-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl font-bold mb-2 text-foreground">
              {error ? 'Generation Failed' : 'Generating Your Thread'}
            </h1>
            <p className="text-muted-foreground">
              {error 
                ? 'Something went wrong during generation' 
                : jobData 
                  ? `Processing: ${jobData.title}` 
                  : 'This will take just a few seconds. Feel free to explore other pages!'
              }
            </p>
          </motion.div>

          {/* Error Display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-6 rounded-xl border border-red-200 bg-red-50"
            >
              <p className="text-red-600 font-medium text-center">{error}</p>
              <div className="mt-4 flex justify-center gap-4">
                <button
                  onClick={() => onNavigate('generator')}
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
                >
                  Try Again
                </button>
                <button
                  onClick={() => onNavigate('dashboard')}
                  className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
                >
                  Go to Dashboard
                </button>
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border rounded-xl p-12 shadow-sm hover:shadow-md transition-all"
          >
            <div className="text-center">
              {/* Animated Spinner */}
              <div className="w-24 h-24 mx-auto mb-6 relative">
                <div className="absolute inset-0 border-4 border-border rounded-full"></div>
                <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                {progress === 100 ? (
                  <CheckCircle className="absolute inset-0 m-auto w-10 h-10 text-green-500" />
                ) : (
                  <Sparkles className="absolute inset-0 m-auto w-10 h-10 text-primary" />
                )}
              </div>

              {/* Current Step */}
              <h2 className="text-2xl font-bold text-foreground mb-6">{currentStep}</h2>

              {/* Progress Bar */}
              <div className="max-w-2xl mx-auto mb-4">
                <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                  <motion.div
                    className="bg-gradient-to-r from-primary to-blue-600 h-3 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>

              {/* Progress Percentage */}
              <p className="text-lg text-muted-foreground mb-8">{Math.round(progress)}% complete</p>

              {/* Info Cards */}
              <div className="grid md:grid-cols-3 gap-4 mt-12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="p-4 rounded-xl bg-muted/50 border border-border"
                >
                  <div className="text-3xl mb-2">🎯</div>
                  <p className="text-sm text-muted-foreground">AI is analyzing your content structure</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="p-4 rounded-xl bg-muted/50 border border-border"
                >
                  <div className="text-3xl mb-2">✨</div>
                  <p className="text-sm text-muted-foreground">Crafting engaging tweets for maximum impact</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="p-4 rounded-xl bg-muted/50 border border-border"
                >
                  <div className="text-3xl mb-2">🚀</div>
                  <p className="text-sm text-muted-foreground">Optimizing for Twitter's best practices</p>
                </motion.div>
              </div>

              {/* Navigation Hint */}
              {progress < 100 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="mt-8 p-4 rounded-xl bg-primary/10 border border-primary/20"
                >
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span>You can navigate to other pages while this processes in the background</span>
                  </div>
                </motion.div>
              )}

              {/* Complete State */}
              {progress === 100 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-8"
                >
                  <button
                    onClick={() => onNavigate('editor')}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl font-medium transition flex items-center gap-2 mx-auto"
                  >
                    View Your Thread
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
