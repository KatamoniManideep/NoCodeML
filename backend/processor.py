import polars as pl
from sklearn.preprocessing import OneHotEncoder, StandardScaler, MinMaxScaler
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression, LinearRegression
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, mean_squared_error, mean_absolute_error, r2_score
from typing import Dict, Any, Optional
import numpy as np

class DataEngine:

    @staticmethod
    def handle_missing(df: pl.DataFrame, strategy: str = 'drop') -> pl.DataFrame:
        
        float_cols = df.select(pl.col(pl.Float32, pl.Float64)).columns
        if float_cols:
            df = df.with_columns([pl.col(c).fill_nan(None) for c in float_cols])

        if strategy == 'drop':
            return df.drop_nulls()

        numeric_cols = df.select(pl.col(pl.NUMERIC_DTYPES)).columns
        cat_type = getattr(pl, 'String', getattr(pl, 'Utf8', None))
        cat_cols = df.select(pl.col(cat_type, pl.Categorical)).columns

        exprs = []
        if strategy == 'mean':
            exprs.extend([pl.col(col).fill_null(pl.col(col).mean()) for col in numeric_cols])
        elif strategy == 'median':
            exprs.extend([pl.col(col).fill_null(pl.col(col).median()) for col in numeric_cols])
        else:
            raise ValueError(f"Unknown missing value strategy: {strategy}")

        exprs.extend([pl.col(col).fill_null("missing") for col in cat_cols])

        return df.with_columns(exprs) if exprs else df


    @staticmethod
    def encode_categorical(df: pl.DataFrame, columns: list[str] | None) -> pl.DataFrame:
        if columns is None or not columns:
            return df

        valid_cols = [col for col in columns if col in df.columns]
        if not valid_cols:
            return df

        return df.to_dummies(columns=valid_cols)


    @staticmethod
    def scale_data(df: pl.DataFrame, columns: list[str] | None, method: str = 'Standard') -> pl.DataFrame:

        if columns is None or not columns:
            return df

        valid_cols = [col for col in columns if col in df.columns]
        if not valid_cols:
            return df
            
        exprs = []
        for col in valid_cols:
            if method == 'Standard':
                exprs.append(
                    ((pl.col(col) - pl.col(col).mean()) / pl.col(col).std()).alias(col)
                )
            elif method == 'MinMax':
                col_min = pl.col(col).min()
                col_max = pl.col(col).max()
                exprs.append(
                    ((pl.col(col) - col_min) / (col_max - col_min)).alias(col)
                )
            else:
                raise ValueError(f"Unknown scaling method: {method}")

        return df.with_columns(exprs)


    @staticmethod
    def get_summary(df: pl.DataFrame) -> dict:

        dtypes = {col: str(dtype) for col, dtype in zip(df.columns, df.dtypes)}

        null_counts = df.null_count().to_dicts()[0]

        numeric_df = df.select(pl.col(pl.NUMERIC_DTYPES))

        stats = {}

        if not numeric_df.is_empty():
            desc_df = numeric_df.describe()
            stats_list = desc_df.to_dicts()

            for col in numeric_df.columns:
                stats[col] = {}

                for row_stat in stats_list:
                    stat_name = row_stat['statistic']
                    stats[col][stat_name] = row_stat.get(col)

        return {
            "total_rows": df.height,
            "total_columns": df.width,
            "dtypes": dtypes,
            "null_counts": null_counts,
            "numeric_stats": stats
        }

class ModelEngine:
    @staticmethod
    def _detect_target_type(y: np.ndarray) -> str:
        if y.dtype.kind in ('U', 'S', 'O'):
            return 'classification'
        
        if y.dtype.kind == 'b':
            return 'classification'
        
        if y.dtype.kind == 'i' or y.dtype.kind == 'u':
            return 'classification'
        
        n_unique = len(np.unique(y[~np.isnan(y)])) if np.issubdtype(y.dtype, np.floating) else len(np.unique(y))
        unique_ratio = n_unique / len(y) if len(y) > 0 else 0
        
        if n_unique <= 20 and unique_ratio <= 0.05:
            return 'classification'
        
        return 'regression'

    @staticmethod
    def _validate_target_for_classification(y: np.ndarray, target_col: str) -> None:
        detected = ModelEngine._detect_target_type(y)
        if detected == 'regression':
            n_unique = len(np.unique(y[~np.isnan(y)])) if np.issubdtype(y.dtype, np.floating) else len(np.unique(y))
            raise ValueError(
                f"Target column '{target_col}' appears to be continuous "
                f"({n_unique} unique values, dtype={y.dtype}). "
                f"Classification requires discrete class labels. "
                f"Switch task_type to 'regression', or bin/encode the target column first."
            )

    @staticmethod
    def train_classification_model(df: pl.DataFrame, target_col: str, feature_cols: list[str], model_type: str, hyperparameters: Optional[Dict[str, Any]] = None) -> dict:
        if not target_col in df.columns:
            raise ValueError(f"Target column '{target_col}' not found in dataframe.")
            
        for col in feature_cols:
            if col not in df.columns:
                raise ValueError(f"Feature column '{col}' not found in dataframe.")
                
        df_clean = df.drop_nulls(subset=feature_cols + [target_col])
        
        X = df_clean.select(feature_cols).to_numpy()
        y = df_clean.select(target_col).to_numpy().ravel()
        
        ModelEngine._validate_target_for_classification(y, target_col)
        
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        if hyperparameters is None:
            params = {}
        else:
            params = hyperparameters

        
        if model_type == 'LogisticRegression':
            C = params.get('C', 1.0)
            model = LogisticRegression(C=C, max_iter=1000, random_state=42)
        elif model_type == 'RandomForestClassifier':
            n_estimators = params.get('n_estimators', 100)
            max_depth = params.get('max_depth', None)
            if max_depth is not None:
                max_depth=int(max_depth)
            model = RandomForestClassifier(n_estimators=n_estimators, max_depth=max_depth, random_state=42)
        else:
            raise ValueError(f"Unsupported model type: {model_type}")
            
        model.fit(X_train, y_train)
        
        y_pred = model.predict(X_test)
        
        accuracy = accuracy_score(y_test, y_pred)
        
        unique_classes = np.unique(y)
        avg_method = 'binary' if len(unique_classes) == 2 else 'weighted'
        
        precision = precision_score(y_test, y_pred, average=avg_method, zero_division=0)
        recall = recall_score(y_test, y_pred, average=avg_method, zero_division=0)
        f1 = f1_score(y_test, y_pred, average=avg_method, zero_division=0)
        
        return {
            "model": model_type,
            "hyperparameters": params,
            "classes": len(unique_classes),
            "metrics": {
                "accuracy": float(accuracy),
                "precision": float(precision),
                "recall": float(recall),
                "f1_score": float(f1)
            },
            "trained_model": model
        }

    @staticmethod
    def train_regression_model(df: pl.DataFrame, target_col: str, feature_cols: list[str], model_type: str, hyperparameters: Optional[Dict[str, Any]] = None) -> dict:
        if not target_col in df.columns:
            raise ValueError(f"Target column '{target_col}' not found in dataframe.")
            
        for col in feature_cols:
            if col not in df.columns:
                raise ValueError(f"Feature column '{col}' not found in dataframe.")
                
        df_clean = df.drop_nulls(subset=feature_cols + [target_col])
        
        X = df_clean.select(feature_cols).to_numpy()
        y = df_clean.select(target_col).to_numpy().ravel()
        
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        if hyperparameters is None:
            params = {}
        else:
            params = hyperparameters

        if model_type == 'LinearRegression':
            model = LinearRegression()
        elif model_type == 'RandomForestRegressor':
            n_estimators = params.get('n_estimators', 100)
            max_depth = params.get('max_depth', None)
            model = RandomForestRegressor(n_estimators=n_estimators, max_depth=max_depth, random_state=42)
        else:
            raise ValueError(f"Unsupported model type: {model_type}")
            
        model.fit(X_train, y_train)
        
        y_pred = model.predict(X_test)
        
        mse = mean_squared_error(y_test, y_pred)
        rmse = float(np.sqrt(mse))
        mae = mean_absolute_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)
        
        return {
            "model": model_type,
            "hyperparameters": params,
            "metrics": {
                "mse": float(mse),
                "rmse": rmse,
                "mae": float(mae),
                "r2_score": float(r2)
            },
            "trained_model": model
        }

