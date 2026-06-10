from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import polars as pl
import os
import shutil
import joblib
from datetime import datetime
from processor import DataEngine, ModelEngine
from suggestion_engine import SuggestionEngine

app = FastAPI(title="No-Code DS Platform API")


origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:5175",
    "http://127.0.0.1:5175",
    "http://localhost:5176",
    "http://127.0.0.1:5176",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_DIR = "data"
MODELS_DIR = "models"
ACTIVE_FILE = os.path.join(DATA_DIR, "active_dataset.parquet")

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(MODELS_DIR, exist_ok=True)


@app.get("/")
def read_root():
    return {"message": "No-Code DS API running"}

class PreprocessRequest(BaseModel):
    missing_strategy: str = "drop"
    encode_columns: List[str] = []
    scale_columns: List[str] = []
    scale_method: str = "Standard"

@app.post("/preprocess")
def preprocess_data(req: PreprocessRequest):
    if not os.path.exists(ACTIVE_FILE):
        raise HTTPException(status_code=404, detail="No dataset uploaded")
        
    try:
        df = pl.read_parquet(ACTIVE_FILE)
        
        df = DataEngine.handle_missing(df, strategy=req.missing_strategy)
        
        if req.encode_columns:
            df = DataEngine.encode_categorical(df, columns=req.encode_columns)
            
        if req.scale_columns:
            df = DataEngine.scale_data(df, columns=req.scale_columns, method=req.scale_method)
            
        df.write_parquet(ACTIVE_FILE)
        
        return {
            "status": "success",
            "message": "Data preprocessed successfully",
            "rows": df.height,
            "columns": df.width,
            "column_names": df.columns
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class SuggestionRequest(BaseModel):
    target_column: str
    feature_columns: List[str]
    task_type: str = "classification"

@app.post("/suggestions")
def get_suggestions(req: SuggestionRequest):
    if not os.path.exists(ACTIVE_FILE):
        raise HTTPException(status_code=404, detail="No dataset uploaded")

    try:
        df = pl.read_parquet(ACTIVE_FILE)
        suggestions = SuggestionEngine.generate(
            df=df,
            target_col=req.target_column,
            feature_cols=req.feature_columns,
            task_type=req.task_type,
        )
        return {"status": "success", "suggestions": suggestions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class TrainRequest(BaseModel):
    task_type: str
    target_column: str
    feature_columns: List[str]
    model_type: str
    hyperparameters: Optional[Dict[str, Any]] = None

@app.post("/train")
def train_model(req: TrainRequest):
    if not os.path.exists(ACTIVE_FILE):
        raise HTTPException(status_code=404, detail="No dataset uploaded")
        
    try:
        df = pl.read_parquet(ACTIVE_FILE)
        
        if req.task_type == "classification":
            results = ModelEngine.train_classification_model(
                df=df,
                target_col=req.target_column,
                feature_cols=req.feature_columns,
                model_type=req.model_type,
                hyperparameters=req.hyperparameters
            )
        elif req.task_type == "regression":
            results = ModelEngine.train_regression_model(
                df=df,
                target_col=req.target_column,
                feature_cols=req.feature_columns,
                model_type=req.model_type,
                hyperparameters=req.hyperparameters
            )
        else:
            raise ValueError("task_type must be either 'classification' or 'regression'")
        
        trained_model = results.pop("trained_model")
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        model_filename = f"{req.model_type}_{timestamp}.joblib"
        model_path = os.path.join(MODELS_DIR, model_filename)
        
        model_artifact = {
            "model": trained_model,
            "metadata": {
                "feature_columns": req.feature_columns,
                "target_column": req.target_column,
                "model_type": req.model_type,
                "task_type": req.task_type,
                "trained_at": timestamp,
            }
        }
        joblib.dump(model_artifact, model_path)
        
        return {
            "status": "success",
            "model_name": model_filename,
            "model_path": model_path,
            "download_url": f"/download-model/{model_filename}",
            "results": results
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/download-model/{model_name}")
def download_model(model_name: str):
    model_path = os.path.join(MODELS_DIR, model_name)
    
    if not os.path.exists(model_path):
        raise HTTPException(status_code=404, detail=f"Model '{model_name}' not found")
    
    return FileResponse(
        path=model_path,
        filename=model_name,
        media_type="application/octet-stream"
    )





@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):

    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files allowed")

    temp_path = os.path.join(DATA_DIR, f"temp_{file.filename}")

    try:
        
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        
        df = pl.read_csv(temp_path)

       
        df.write_parquet(ACTIVE_FILE)

        os.remove(temp_path)

        return {
            "status": "success",
            "filename": file.filename,
            "rows": df.height,
            "columns": df.width,
            "column_names": df.columns
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@app.get("/preview")
def preview_data():

    if not os.path.exists(ACTIVE_FILE):
        raise HTTPException(status_code=404, detail="No dataset uploaded")

    try:
        df = pl.read_parquet(ACTIVE_FILE)

        preview = df.head(20)

        return {
            "status": "success",
            "columns": df.columns,
            "data": preview.to_dicts()
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@app.get("/dataset/info")
def dataset_info():

    if not os.path.exists(ACTIVE_FILE):
        raise HTTPException(status_code=404, detail="No dataset uploaded")

    try:
        df = pl.read_parquet(ACTIVE_FILE)

        column_info = [
            {
                "name": c,
                "dtype": str(df[c].dtype),
                "null_count": df[c].null_count()
            }
            for c in df.columns
        ]

        return {
            "rows": df.height,
            "columns": df.width,
            "column_info": column_info
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@app.get("/columns")
def get_columns():

    if not os.path.exists(ACTIVE_FILE):
        raise HTTPException(status_code=404, detail="No dataset uploaded")

    try:
        df = pl.read_parquet(ACTIVE_FILE)

        numeric = [
            c for c in df.columns
            if df[c].dtype.is_numeric()
        ]

        categorical = [
            c for c in df.columns
            if not df[c].dtype.is_numeric()
        ]

        return {
            "numerical_columns": numeric,
            "categorical_columns": categorical
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))