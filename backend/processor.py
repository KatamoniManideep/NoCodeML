import polars as pl
from sklearn.preprocessing import OneHotEncoder, StandardScaler, MinMaxScaler
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from typing import Dict, Any, Optional
import numpy as np

class DataEngine:
    @staticmethod
    def handle_missing(df: pl.DataFrame, strategy: str = 'drop') -> pl.DataFrame:
        """Handles missing values in the dataframe."""
        if strategy == 'drop':
            return df.drop_nulls()
        

        numeric_cols = df.select(pl.col(pl.NUMERIC_DTYPES)).columns
        
        if not numeric_cols:
            return df

        if strategy == 'mean':
        
            exprs = [pl.col(col).fill_null(pl.col(col).mean()) for col in numeric_cols]
            return df.with_columns(exprs)
            
        elif strategy == 'median':
          
            exprs = [pl.col(col).fill_null(pl.col(col).median()) for col in numeric_cols]
            return df.with_columns(exprs)
            
        raise ValueError(f"Unknown missing value strategy: {strategy}")

    @staticmethod
    def encode_categorical(df: pl.DataFrame, columns: list[str]) -> pl.DataFrame:
        
        if not columns:
            return df
            
        for col in columns:
            if col not in df.columns:
                raise ValueError(f"Column '{col}' not found in dataframe")
                
        
        cat_data = df.select(columns).to_pandas()
        
     
        encoder = OneHotEncoder(sparse_output=False, handle_unknown='ignore')
        encoded_data = encoder.fit_transform(cat_data)
        
        
        feature_names = encoder.get_feature_names_out(columns)
        
        encoded_df = pl.DataFrame(encoded_data, schema=list(feature_names))
        
        return pl.concat([df.drop(columns), encoded_df], how="horizontal")

    @staticmethod
    def scale_data(df: pl.DataFrame, columns: list[str], method: str = 'Standard') -> pl.DataFrame:
        if not columns:
            return df
            
        if method == 'Standard':
            scaler = StandardScaler()
        elif method == 'MinMax':
            scaler = MinMaxScaler()
        else:
            raise ValueError(f"Unknown scaling method: {method}")
            
        scale_data = df.select(columns).to_numpy()
        
        scaled_data = scaler.fit_transform(scale_data)
        
        scaled_df = pl.DataFrame(scaled_data, schema=columns)
        
        return df.with_columns([pl.Series(col, scaled_df[col]) for col in columns])

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
                    val = row_stat.get(col)
                    stats[col][stat_name] = val
                    
        return {
            "total_rows": df.height,
            "total_columns": df.width,
            "dtypes": dtypes,
            "null_counts": null_counts,
            "numeric_stats": stats
        }

class ModelEngine:
    @staticmethod
    def train_classification_model(df: pl.DataFrame, target_col: str, feature_cols: list[str], model_type: str, hyperparameters: Optional[Dict[str, Any]] = None) -> dict:
        if not target_col in df.columns:
            raise ValueError(f"Target column '{target_col}' not found in dataframe.")
            
        for col in feature_cols:
            if col not in df.columns:
                raise ValueError(f"Feature column '{col}' not found in dataframe.")
                
        # Drop rows with nulls in features or target for simple model training
        df_clean = df.drop_nulls(subset=feature_cols + [target_col])
        
        X = df_clean.select(feature_cols).to_numpy()
        y = df_clean.select(target_col).to_numpy().ravel()
        
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
            model = RandomForestClassifier(n_estimators=n_estimators, max_depth=max_depth, random_state=42)
        else:
            raise ValueError(f"Unsupported model type: {model_type}")
            
        model.fit(X_train, y_train)
        
        y_pred = model.predict(X_test)
        
        accuracy = accuracy_score(y_test, y_pred)
        
        # Determine average parameter based on number of classes
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
            }
        }

