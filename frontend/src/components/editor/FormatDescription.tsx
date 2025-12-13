import { FORMAT_LABELS, FormatType } from './FormatSelector';

interface FormatDescriptionProps {
  selectedFormat: FormatType;
}

export default function FormatDescription({ selectedFormat }: FormatDescriptionProps) {
  const currentFormatData = FORMAT_LABELS[selectedFormat];
  
  return (
    <div className="mb-8 p-6 rounded-2xl bg-white" style={{ 
      border: '1px solid #e5e7eb',
      boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)'
    }}>
      <div className="flex items-center gap-4">
        <div 
          className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: currentFormatData.bgColor }}
        >
          <currentFormatData.icon className="w-7 h-7" style={{ color: currentFormatData.color }} />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-lg mb-1" style={{ color: '#0f1a14' }}>{currentFormatData.name}</h3>
          <p className="text-sm" style={{ color: '#6b7280' }}>{currentFormatData.description}</p>
        </div>
      </div>
    </div>
  );
}
