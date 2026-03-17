import polars as pl
from sklearn.preprocessing import OneHotEncoder, StandardScaler, MinMaxScaler
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
