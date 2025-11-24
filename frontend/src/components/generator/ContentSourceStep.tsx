import { motion } from 'framer-motion';
import { Upload, Link, FileText, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import { validateUrl, getPlatformDisplayName } from '../../utils/urlValidator';

interface ContentSourceStepProps {
  setContentSource: (source: 'file' | 'url' | null) => void;
  file: File | null;
  url: string;
  setUrl: (url: string) => void;
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleFileDrop: (event: React.DragEvent<HTMLDivElement>) => void;
  removeFile: () => void;
  setCurrentStep: (step: number) => void;
}

export default function ContentSourceStep({
  setContentSource,
  file,
  url,
  setUrl,
  handleFileUpload,
  handleFileDrop,
  removeFile,
  setCurrentStep
}: ContentSourceStepProps) {
  // Validate URL in real-time
  const urlValidation = url.trim() ? validateUrl(url) : null;
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-6"
    >
      {/* Topic Input */}
      <div className="bg-white p-8 rounded-2xl border border-slate-100" style={{
        boxShadow: 'var(--card-shadow)',
        borderColor: 'var(--card-border)'
      }}>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'var(--gradient-primary)' }}>
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Content Source</h3>
            <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>Select a content source</p>
          </div>
        </div>

        {/* Content Source - URL and File Upload Combined */}
        <div className="bg-white p-8 rounded-2xl border border-slate-100" style={{
          boxShadow: 'var(--card-shadow)',
          borderColor: 'var(--card-border)'
        }}>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--primary-100)' }}>
              <Link className="w-6 h-6" style={{ color: 'var(--primary)' }} />
            </div>
            <div>
              <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Content Source (Optional)</h3>
              <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>Add a URL or file to enhance your topic</p>
            </div>
          </div>

          {/* URL Input */}
          <div className="mb-6">
            <div className="relative">
              <Link className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--primary)' }} />
              <input
                type="url"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  // Automatically set content source to 'url' when URL is pasted
                  if (e.target.value.trim()) {
                    setContentSource('url');
                  } else if (!file) {
                    setContentSource(null);
                  }
                }}
                className="modern-input pl-14 text-lg py-4"
                placeholder="      Paste your YouTube, TikTok, Spotify, or podcast link here..."
              />
            </div>
            
            {/* URL Validation Feedback */}
            {urlValidation && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 flex items-center gap-2"
              >
                {urlValidation.isValid ? (
                  <>
                    <CheckCircle className="w-4 h-4" style={{ color: 'var(--success)' }} />
                    <span className="text-sm" style={{ color: 'var(--success)' }}>
                      Valid {getPlatformDisplayName(urlValidation.platform)} URL detected
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4" style={{ color: 'var(--error)' }} />
                    <span className="text-sm" style={{ color: 'var(--error)' }}>
                      {urlValidation.error}
                    </span>
                  </>
                )}
              </motion.div>
            )}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-6 my-6">
            <div className="flex-1 h-px" style={{ backgroundColor: 'var(--card-border)' }}></div>
            <span className="text-lg font-medium" style={{ color: 'var(--text-muted)' }}>OR</span>
            <div className="flex-1 h-px" style={{ backgroundColor: 'var(--card-border)' }}></div>
          </div>

          {/* File Upload */}
          {file ? (
            <div className="border-2 rounded-2xl p-8 text-center" style={{
              borderColor: 'var(--success)',
              backgroundColor: 'var(--success-light)'
            }}>
              <div className="flex items-center justify-center gap-4 mb-4">
                <CheckCircle className="w-10 h-10" style={{ color: 'var(--success)' }} />
                <div className="text-left">
                  <p className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>{file.name}</p>
                  <p className="text-lg" style={{ color: 'var(--success)' }}>File uploaded successfully</p>
                </div>
              </div>
              <button
                onClick={removeFile}
                className="mt-3 text-lg font-medium transition flex items-center gap-2 mx-auto hover:underline"
                style={{ color: 'var(--text-muted)' }}
              >
                <AlertCircle className="w-5 h-5" />
                Remove file
              </button>
            </div>
          ) : (
            <label
              onDragOver={(e) => e.preventDefault()}
              onDragEnter={(e) => e.preventDefault()}
              onDrop={(e) => handleFileDrop(e as any)}
              className="block border-2 border-dashed rounded-2xl p-10 text-center transition cursor-pointer"
              style={{
                borderColor: 'var(--card-border)',
                backgroundColor: 'var(--background-secondary)'
              }}
            >
              <input
                type="file"
                onChange={(e) => {
                  handleFileUpload(e);
                  setContentSource('file');
                }}
                accept="audio/*,video/*"
                className="hidden"
              />
              <Upload className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
              <p className="text-lg font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Drop files here or click to browse</p>
              <p className="text-lg" style={{ color: 'var(--text-muted)' }}>MP3, MP4, MOV up to 500MB</p>
            </label>
          )}
        </div>

        {/* Continue Button */}
        <motion.button
          onClick={() => setCurrentStep(3)}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-semibold text-lg transition bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          Continue to Customization
          <ArrowRight className="w-6 h-6" />
        </motion.button>
      </div>
    </motion.div>
  );
}
