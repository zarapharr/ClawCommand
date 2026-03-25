import { FactoryFloorRefactored } from '@/components/factory-floor/FactoryFloorRefactored';

export function FactoryFloorPageRefactored() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <FactoryFloorRefactored onProjectClick={(projectId) => {
          console.log('Project clicked:', projectId);
        }} />
      </div>
    </div>
  );
}
