import React, { useState } from 'react';
import { Activity, BarChart2, Download, Zap } from 'lucide-react';

interface ModelSelectionFormProps {
  columns: string[];
}

const ModelSelectionForm: React.FC<ModelSelectionFormProps> = ({ columns }) => {
  const [taskType, setTaskType] = useState<'classification' | 'regression'>('classification');
  const [targetColumn, setTargetColumn] = useState<string>('');
  const [featureColumns, setFeatureColumns] = useState<string[]>([]);
  
  const [modelType, setModelType] = useState<string>('LogisticRegression');
  
  const [lrC, setLrC] = useState<number>(1.0);
  const [rfEstimators, setRfEstimators] = useState<number>(100);
  const [rfMaxDepth, setRfMaxDepth] = useState<number | ''>('');

  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState('');
  const [modelName, setModelName] = useState<string>('');
  const [downloadUrl, setDownloadUrl] = useState<string>('');

  const handleTaskTypeChange = (type: 'classification' | 'regression') => {
    setTaskType(type);
    setModelType(type === 'classification' ? 'LogisticRegression' : 'LinearRegression');
    setResults(null);
    setModelName('');
    setDownloadUrl('');
  };

  const handleFeatureToggle = (col: string) => {
    if (featureColumns.includes(col)) {
      setFeatureColumns(featureColumns.filter(c => c !== col));
    } else {
      setFeatureColumns([...featureColumns, col]);
    }
  };

  const trainModel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetColumn) {
      setError('Please select a target column.');
      return;
    }
    if (featureColumns.length === 0) {
      setError('Please select at least one feature column.');
      return;
    }

    setIsLoading(true);
    setError('');
    setResults(null);
    setModelName('');
    setDownloadUrl('');

    const hyperparameters: any = {};
    if (modelType === 'LogisticRegression') {
      hyperparameters['C'] = lrC;
    } else if (modelType === 'RandomForestClassifier' || modelType === 'RandomForestRegressor') {
      hyperparameters['n_estimators'] = rfEstimators;
      if (rfMaxDepth !== '') {
        hyperparameters['max_depth'] = Number(rfMaxDepth);
      }
    }

    try {
      const response = await fetch('http://localhost:8000/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_type: taskType,
          target_column: targetColumn,
          feature_columns: featureColumns,
          model_type: modelType,
          hyperparameters: hyperparameters
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Training failed');
      }

      setResults(data.results);
      setModelName(data.model_name || '');
      setDownloadUrl(data.download_url || '');
    } catch (err: any) {
      setError(err.message || 'An error occurred during training.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-zinc-200/80">
      <div className="mb-8">
        <h2 className="text-[15px] font-semibold text-zinc-900 tracking-tight">Model Training</h2>
        <p className="text-[13px] text-zinc-500 mt-1">Configure and train your machine learning model</p>
      </div>
      
      {error && (
        <div className="mb-6 bg-red-50 text-red-600 p-3 rounded-lg text-[13px] font-medium border border-red-100/50">
          {error}
        </div>
      )}

      <div className="mb-8 bg-zinc-50 p-1 rounded-lg inline-flex border border-zinc-100">
        <button
          type="button"
          onClick={() => handleTaskTypeChange('classification')}
          className={`px-4 py-1.5 text-[13px] font-medium rounded-md transition-all ${taskType === 'classification' ? 'bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] border border-zinc-200/50 text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'}`}
        >
          Classification
        </button>
        <button
          type="button"
          onClick={() => handleTaskTypeChange('regression')}
          className={`px-4 py-1.5 text-[13px] font-medium rounded-md transition-all ${taskType === 'regression' ? 'bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] border border-zinc-200/50 text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'}`}
        >
          Regression
        </button>
      </div>

      <form onSubmit={trainModel} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-[13px] font-medium text-zinc-700 mb-2">Target Variable</label>
            <select
              value={targetColumn}
              onChange={(e) => setTargetColumn(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 text-zinc-900 text-[13px] rounded-lg focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 block p-2.5 transition-all outline-none"
            >
              <option value="">-- Select Target --</option>
              {columns.map(col => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-zinc-700 mb-2">Algorithm</label>
            <select
              value={modelType}
              onChange={(e) => setModelType(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 text-zinc-900 text-[13px] rounded-lg focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 block p-2.5 transition-all outline-none"
            >
              {taskType === 'classification' ? (
                <>
                  <option value="LogisticRegression">Logistic Regression</option>
                  <option value="RandomForestClassifier">Random Forest Classification</option>
                </>
              ) : (
                <>
                  <option value="LinearRegression">Linear Regression</option>
                  <option value="RandomForestRegressor">Random Forest Regression</option>
                </>
              )}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[13px] font-medium text-zinc-700 mb-2">Features</label>
          <div className="flex flex-wrap gap-2.5">
            {columns.filter(c => c !== targetColumn).map(col => (
              <label key={col} className={`flex items-center space-x-2 px-3 py-2 rounded-lg border cursor-pointer transition-all ${featureColumns.includes(col) ? 'bg-zinc-900 border-zinc-900 text-white shadow-sm' : 'bg-white border-zinc-200 hover:border-zinc-300 text-zinc-700'}`}>
                <input
                  type="checkbox"
                  checked={featureColumns.includes(col)}
                  onChange={() => handleFeatureToggle(col)}
                  className="hidden"
                />
                <span className="text-[13px] font-medium">{col}</span>
              </label>
            ))}
          </div>
        </div>

        {(modelType === 'LogisticRegression' || modelType === 'RandomForestClassifier' || modelType === 'RandomForestRegressor') && (
          <div className="p-5 bg-zinc-50 rounded-xl border border-zinc-200/80">
            <h3 className="text-[13px] font-semibold text-zinc-900 mb-4">Hyperparameters</h3>
            {modelType === 'LogisticRegression' && (
              <div>
                <label className="block text-[12px] font-medium text-zinc-600 mb-1.5">Inverse Regularization (C)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.01"
                  value={lrC}
                  onChange={(e) => setLrC(parseFloat(e.target.value))}
                  className="w-full sm:w-64 bg-white border border-zinc-200 text-zinc-900 text-[13px] rounded-lg focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 block p-2 outline-none transition-all"
                />
              </div>
            )}
            {(modelType === 'RandomForestClassifier' || modelType === 'RandomForestRegressor') && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[12px] font-medium text-zinc-600 mb-1.5">Number of Estimators</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={rfEstimators}
                    onChange={(e) => setRfEstimators(parseInt(e.target.value))}
                    className="w-full bg-white border border-zinc-200 text-zinc-900 text-[13px] rounded-lg focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 block p-2 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-zinc-600 mb-1.5">Max Depth</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={rfMaxDepth}
                    onChange={(e) => setRfMaxDepth(e.target.value === '' ? '' : parseInt(e.target.value))}
                    placeholder="None"
                    className="w-full bg-white border border-zinc-200 text-zinc-900 text-[13px] rounded-lg focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 block p-2 outline-none transition-all"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <div className="pt-6 border-t border-zinc-100 flex items-center justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2.5 text-[13px] font-medium text-white bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-800 focus:ring-4 focus:outline-none focus:ring-zinc-200 rounded-lg text-center shadow-[0_1px_2px_rgba(0,0,0,0.12)] disabled:opacity-70 transition-all flex items-center gap-2"
          >
            {isLoading ? <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-[1.5px] border-white"></div> : <Zap className="w-4 h-4" />}
            {isLoading ? 'Training...' : 'Train Model'}
          </button>
        </div>
      </form>

      {results && (
        <div className="mt-8 p-6 bg-[#fafafa] rounded-xl border border-zinc-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] animate-in fade-in slide-in-from-bottom-2 duration-500">
          <h3 className="text-[14px] font-semibold text-zinc-900 mb-5 flex items-center">
            <Activity className="w-4 h-4 mr-2 text-zinc-700" />
            Training Results
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
            {taskType === 'classification' ? (
              <>
                <MetricCard title="Accuracy" value={`${(results.metrics.accuracy * 100).toFixed(1)}%`} />
                <MetricCard title="Precision" value={`${(results.metrics.precision * 100).toFixed(1)}%`} />
                <MetricCard title="Recall" value={`${(results.metrics.recall * 100).toFixed(1)}%`} />
                <MetricCard title="F1 Score" value={`${(results.metrics.f1_score * 100).toFixed(1)}%`} />
              </>
            ) : (
              <>
                <MetricCard title="R² Score" value={results.metrics.r2_score.toFixed(3)} />
                <MetricCard title="RMSE" value={results.metrics.rmse.toFixed(3)} />
                <MetricCard title="MSE" value={results.metrics.mse.toFixed(3)} />
                <MetricCard title="MAE" value={results.metrics.mae.toFixed(3)} />
              </>
            )}
          </div>
          <div className="flex items-center justify-between gap-4 bg-white p-3 rounded-lg border border-zinc-100">
            <div className="flex items-center gap-4 text-[12px] text-zinc-500">
              <span className="flex items-center"><BarChart2 className="w-3.5 h-3.5 mr-1.5" /> {results.model}</span>
              {taskType === 'classification' && <span>Classes: {results.classes}</span>}
            </div>
            {downloadUrl && (
              <a
                href={`http://localhost:8000${downloadUrl}`}
                download={modelName}
                className="inline-flex items-center gap-2 px-4 py-2 text-[13px] font-medium text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.12)] transition-all"
              >
                <Download className="w-4 h-4" />
                Download Model
              </a>
            )}
          </div>
          {modelName && (
            <p className="mt-3 text-[12px] text-zinc-400 font-mono truncate" title={modelName}>
              {modelName}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

const MetricCard = ({ title, value }: { title: string, value: string }) => (
  <div className="bg-white p-4 rounded-lg border border-zinc-100 shadow-sm flex flex-col justify-center">
    <p className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider mb-1">{title}</p>
    <p className="text-[20px] font-semibold text-zinc-900 tracking-tight">{value}</p>
  </div>
);

export default ModelSelectionForm;
