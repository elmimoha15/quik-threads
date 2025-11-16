interface ThreadSelectorProps {
  threads: any[];
  selectedThread: number;
  setSelectedThread: (index: number) => void;
}

export default function ThreadSelector({ threads, selectedThread, setSelectedThread }: ThreadSelectorProps) {
  if (threads.length <= 1) return null;

  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold mb-3 text-foreground">Choose a Thread Option</h2>
      <div className="flex gap-2 flex-wrap">
        {threads.map((_, index) => (
          <button
            key={index}
            onClick={() => setSelectedThread(index)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              selectedThread === index
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Thread {index + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
