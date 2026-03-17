import React, { useState } from 'react';
import UploadForm from './components/UploadForm';
import DataTable from './components/DataTable';

interface DatasetInfo {
  filename: string;
  rows: number;
  columns: number;
  column_names: string[];
}

function App() {
  const [dataset, setDataset] = useState<DatasetInfo | null>(null);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white font-bold">DS</div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">No-Code ML</h1>
          </div>
          {dataset && (
            <div className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              Active: {dataset.filename}
            </div>
          )}
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {!dataset ? (
          <div className="pt-12">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-4">Build models without writing code.</h2>
              <p className="text-xl text-gray-500 max-w-2xl mx-auto">Upload your data, pre-process, and train traditional ML models in minutes using our intuitive interface.</p>
            </div>
            <UploadForm onUploadSuccess={setDataset} />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold mb-1 text-gray-800">Dataset Overview</h2>
                <p className="text-sm text-gray-500">View and verify your uploaded data</p>
              </div>
              <div className="flex gap-6 text-sm">
                <div className="flex flex-col">
                  <span className="text-gray-400">Rows</span>
                  <span className="font-semibold text-lg">{dataset.rows.toLocaleString()}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-400">Columns</span>
                  <span className="font-semibold text-lg">{dataset.columns}</span>
                </div>
              </div>
            </div>
            
            <DataTable columns={dataset.column_names} />
            
            <div className="pt-8 text-center text-gray-500 italic">
              (Model Configuration UI pending...)
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
