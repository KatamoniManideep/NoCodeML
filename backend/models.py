import base64
import io
import matplotlib.pyplot as plt
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, confusion_matrix, ConfusionMatrixDisplay
from sklearn.model_selection import train_test_split
import polars as pl
import numpy as np

def train_model(data, target, model_type, params):
    
    
   
    if isinstance(data, pl.DataFrame) and isinstance(target, str):
        X = data.drop(target).to_numpy()
        y = data[target].to_numpy()
    elif hasattr(data, "drop") and isinstance(target, str): 
        X = data.drop(columns=[target]).values
        y = data[target].values
    else:
      
        X = data
        y = target
        
 
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
  
    if model_type == 'RandomForest':
        model = RandomForestClassifier(**params)
    else:
        raise ValueError(f"Unsupported model_type: {model_type}")
        

    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    accuracy = float(accuracy_score(y_test, y_pred))
    
    
    cm = confusion_matrix(y_test, y_pred, labels=model.classes_)
    disp = ConfusionMatrixDisplay(confusion_matrix=cm, display_labels=model.classes_)
   
    fig, ax = plt.subplots()
    disp.plot(cmap='Blues', ax=ax)
    

    buf = io.BytesIO()
    plt.savefig(buf, format='png', bbox_inches='tight')
    plt.close(fig) 
    buf.seek(0)
    plot_base64 = base64.b64encode(buf.read()).decode('utf-8')
    
    return accuracy, plot_base64
