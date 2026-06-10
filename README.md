# No-Code ML 

A full-stack, easy-to-use platform for training, preprocessing, and deploying machine learning models without writing a single line of code. Designed for data science enthusiasts, analysts, and beginners, this tool lets you upload datasets, preview and preprocess them, obtain automatic recommendations, and train regression or classification models directly from a modern web UI.

---

##  Features

###  Backend (FastAPI & Polars)
- **High-Performance Data Ingestion**: Upload `.csv` datasets, which are automatically converted to `.parquet` format using Polars for high-speed processing and caching.
- **Robust Preprocessing Pipeline**:
  - Missing value strategies (e.g., dropping nulls, imputation).
  - Categorical column encoding.
  - Scaling numerical features (Standard or MinMax scaling).
- **Intelligent Suggestion Engine**: Automatically recommends suitable model types, key hyperparameters, and configuration options based on target columns and feature types.
- **On-the-Fly Training**:
  - Supports **Classification** & **Regression** tasks.
  - Powered by Scikit-Learn.
  - Customize hyperparameters directly from the API or frontend.
- **Model Storage & Export**: Downloads trained models as serialized `.joblib` files along with runtime feature/target metadata.

###  Frontend (React + TypeScript + Vite)
- **Interactive UI**: A modern interface for uploading datasets, previewing row values, and analyzing schema types.
- **Step-by-Step Guidance**: Guides you through selecting features, defining targets, choosing task types, preprocessing, and triggering model execution.
- **No-Code Flow**: Visual components that require absolutely no programming knowledge to build predictive models.

---

##  Project Structure

```text
├── backend/
│   ├── data/                 # Temporary and active dataset storage
│   ├── models/               # Serialized trained models (.joblib)
│   ├── main.py               # FastAPI application routing and entry point
│   ├── models.py             # Machine learning training configurations
│   ├── processor.py          # Data preprocessing engines (Polars & Scikit-Learn)
│   ├── suggestion_engine.py  # Automated recommendation logic
│   └── requirements.txt      # Python dependencies
│
├── frontend/
│   ├── src/                  # React components and logic
│   ├── index.html            # Main HTML wrapper
│   ├── package.json          # Node dependencies and scripts
│   └── vite.config.ts        # Vite build tool settings
│
└── dummy_dataset.csv         # Sample dataset for quick start testing
```

---

##  Getting Started

### Prerequisites
- **Python**: version `3.9` or higher
- **Node.js**: version `18` or higher
- **npm** or **yarn**

---

### Setup Backend

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment and activate it:
   ```bash
   # On Windows (PowerShell/CMD):
   python -m venv venv
   .\venv\Scripts\activate

   # On macOS/Linux:
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Start the FastAPI development server:
   ```bash
   uvicorn main:app --reload
   ```
   The API will be available at `http://127.0.0.1:8000`. You can access the interactive documentation at `http://127.0.0.1:8000/docs`.

---

### Setup Frontend

1. Navigate to the `frontend` directory:
   ```bash
   cd ../frontend
   ```

2. Install npm packages:
   ```bash
   npm install
   ```

3. Run the frontend development server:
   ```bash
   npm run dev
   ```
   Open your browser to `http://localhost:5173` (or the port specified in your terminal output).

---

##  Testing with Dummy Dataset

A `dummy_dataset.csv` is provided at the root of the workspace. You can upload this file to the platform to test:
1. Data preview and datatype inference.
2. Preprocessing configurations.
3. Feature and target column selection.
4. Classification or Regression training runs.

---

##  License


