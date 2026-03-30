import React, { useState } from 'react';
import UploadForm from './components/UploadForm';
import DataTable from './components/DataTable';
import PreprocessingForm from './components/PreprocessingForm';
import ModelSelectionForm from './components/ModelSelectionForm';

interface DatasetInfo {
  filename: string;
  rows: number;
  columns: number;
  column_names: string[];
}

function App() {
  const [dataset, setDataset] = useState<DatasetInfo | null>(null);

  return (
    <div className="min-h-screen bg-[#fafafa] text-zinc-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <header className="bg-white/80 backdrop-blur-md border-b border-zinc-200 sticky top-0 z-10 transition-all">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-md bg-zinc-900 flex items-center justify-center text-white text-xs font-bold leading-none">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
            </div>
            <h1 className="text-[15px] font-semibold text-zinc-900 tracking-tight">No-Code ML</h1>
          </div>
          {dataset && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <div className="text-[13px] font-medium text-zinc-600 bg-zinc-100/80 px-2.5 py-1 rounded-md border border-zinc-200/50">
                {dataset.filename}
              </div>
            </div>
          )}
        </div>
      </header>
      
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-in fade-in duration-500">
        {!dataset ? (
          <div className="pt-20 pb-16 flex flex-col items-center">
            <div className="text-center mb-10 space-y-4">
              <h2 className="text-[40px] leading-tight font-bold tracking-[-0.02em] text-zinc-900">
                Machine learning, <br className="hidden sm:block"/>simplified.
              </h2>
              <p className="text-[17px] text-zinc-500 max-w-[480px] mx-auto leading-relaxed">
                Upload your dataset, configure preprocessing, and train powerful models without writing a single line of code.
              </p>
            </div>
            <div className="w-full">
              <UploadForm onUploadSuccess={setDataset} />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-zinc-200/80 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h2 className="text-[15px] font-semibold text-zinc-900 tracking-tight">Dataset Overview</h2>
                <p className="text-[13px] text-zinc-500 mt-0.5">Summary of your active data</p>
              </div>
              <div className="flex gap-8 text-[13px]">
                <div className="flex flex-col">
                  <span className="text-zinc-500 mb-0.5">Rows</span>
                  <span className="font-semibold text-zinc-900 font-mono">{dataset.rows.toLocaleString()}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-zinc-500 mb-0.5">Columns</span>
                  <span className="font-semibold text-zinc-900 font-mono">{dataset.columns}</span>
                </div>
              </div>
            </div>
            
            <DataTable columns={dataset.column_names} />
            
            <PreprocessingForm onPreprocessSuccess={(newDataset) => {
              setDataset({...dataset, rows: newDataset.rows, columns: newDataset.columns, column_names: newDataset.column_names});
            }} />
            
            <ModelSelectionForm columns={dataset.column_names} />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
