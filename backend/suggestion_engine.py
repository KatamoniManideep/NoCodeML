import polars as pl
import numpy as np
from typing import Dict, List, Any


class SuggestionEngine:

    @staticmethod
    def detect_task_type(df: pl.DataFrame, target_col: str) -> str:
        col = df[target_col]
        if not col.dtype.is_numeric():
            return "classification"
        n_unique = col.n_unique()
        unique_ratio = n_unique / df.height if df.height > 0 else 0
        if n_unique <= 20 and unique_ratio <= 0.05:
            return "classification"
        return "regression"

    @staticmethod
    def detect_missing(df: pl.DataFrame, feature_cols: List[str]) -> Dict[str, int]:
        missing = {}
        for col in feature_cols:
            count = df[col].null_count()
            if df[col].dtype.is_float():
                count += df[col].is_nan().sum()
            if count > 0:
                missing[col] = int(count)
        return missing

    @staticmethod
    def detect_categorical(df: pl.DataFrame, feature_cols: List[str]) -> List[str]:
        return [c for c in feature_cols if not df[c].dtype.is_numeric()]

    @staticmethod
    def detect_skewness(df: pl.DataFrame, feature_cols: List[str]) -> Dict[str, float]:
        skewed = {}
        for col in feature_cols:
            if df[col].dtype.is_numeric():
                vals = df[col].drop_nulls().to_numpy().astype(float)
                if len(vals) > 2:
                    mean = np.mean(vals)
                    std = np.std(vals)
                    if std > 0:
                        skew = float(np.mean(((vals - mean) / std) ** 3))
                        if abs(skew) > 1.0:
                            skewed[col] = round(skew, 2)
        return skewed

    @staticmethod
    def detect_imbalance(df: pl.DataFrame, target_col: str) -> bool:
        counts = df[target_col].value_counts()
        if counts.height < 2:
            return False
        count_col = "count" if "count" in counts.columns else counts.columns[1]
        values = counts[count_col].to_list()
        ratio = min(values) / max(values) if max(values) > 0 else 1
        return ratio < 0.3

    @staticmethod
    def suggest_models(task_type: str) -> List[Dict[str, str]]:
        if task_type == "classification":
            return [
                {"name": "LogisticRegression", "reason": "Simple baseline classifier, works well on linearly separable data"},
                {"name": "RandomForestClassifier", "reason": "Handles non-linear relationships and feature interactions"},
            ]
        return [
            {"name": "LinearRegression", "reason": "Simple baseline for linear relationships"},
            {"name": "RandomForestRegressor", "reason": "Captures non-linear patterns without extensive tuning"},
        ]

    @staticmethod
    def suggest_preprocessing(
        missing: Dict[str, int],
        categorical: List[str],
        skewed: Dict[str, float],
    ) -> List[Dict[str, str]]:
        steps = []
        if missing:
            cols = ", ".join(missing.keys())
            steps.append({"step": "Handle missing values", "reason": f"Columns with nulls: {cols}. Models cannot handle missing data."})
        if categorical:
            cols = ", ".join(categorical)
            steps.append({"step": "Encode categorical columns", "reason": f"Convert {cols} to numeric. Most ML models require numeric input."})
        if skewed:
            cols = ", ".join(skewed.keys())
            steps.append({"step": "Apply scaling", "reason": f"Skewed columns detected: {cols}. Scaling improves model convergence."})
        else:
            steps.append({"step": "Apply feature scaling", "reason": "Standardizing features improves model performance and training speed."})
        return steps

    @staticmethod
    def generate_warnings(
        df: pl.DataFrame,
        target_col: str,
        feature_cols: List[str],
        task_type: str,
        detected_type: str,
        missing: Dict[str, int],
        imbalanced: bool,
    ) -> List[str]:
        warnings = []
        if task_type != detected_type:
            warnings.append(
                f"Selected task type '{task_type}' may not match the target column. "
                f"Detected type is '{detected_type}'."
            )
        if missing:
            total = sum(missing.values())
            warnings.append(f"{total} missing values found across {len(missing)} feature column(s). Train may fail or lose rows.")
        if imbalanced and detected_type == "classification":
            warnings.append("Target classes are imbalanced (minority/majority ratio < 0.3). Consider resampling or using class weights.")
        if df.height < 50:
            warnings.append(f"Dataset has only {df.height} rows. Results may be unreliable with very small datasets.")
        return warnings

    @staticmethod
    def generate(df: pl.DataFrame, target_col: str, feature_cols: List[str], task_type: str) -> Dict[str, Any]:
        detected_type = SuggestionEngine.detect_task_type(df, target_col)
        missing = SuggestionEngine.detect_missing(df, feature_cols)
        categorical = SuggestionEngine.detect_categorical(df, feature_cols)
        skewed = SuggestionEngine.detect_skewness(df, feature_cols)
        imbalanced = SuggestionEngine.detect_imbalance(df, target_col)

        return {
            "task_type": detected_type,
            "models": SuggestionEngine.suggest_models(detected_type),
            "preprocessing": SuggestionEngine.suggest_preprocessing(missing, categorical, skewed),
            "warnings": SuggestionEngine.generate_warnings(
                df, target_col, feature_cols, task_type, detected_type, missing, imbalanced
            ),
        }
