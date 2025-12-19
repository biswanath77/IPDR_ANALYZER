import os
import joblib
import numpy as np


class ModelWrapper:
    def __init__(self, model_path, scaler_path=None, numeric_cols_path=None, le_path=None):
        # Load model and optional artifacts. Paths are expected to be absolute in the container (/app/outputs/...)
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model file not found: {model_path}")
        self.model = joblib.load(model_path)

        self.scaler = None
        if scaler_path and os.path.exists(scaler_path):
            self.scaler = joblib.load(scaler_path)

        self.numeric_cols = None
        if numeric_cols_path and os.path.exists(numeric_cols_path):
            self.numeric_cols = joblib.load(numeric_cols_path)

        self.le = None
        if le_path and os.path.exists(le_path):
            try:
                self.le = joblib.load(le_path)
            except Exception:
                self.le = None

    def predict(self, df):
        # Minimal preprocessing: select numeric columns if provided, otherwise infer
        X = df.copy()
        
        if self.numeric_cols:
            # Check which columns are missing
            missing_cols = set(self.numeric_cols) - set(X.columns)
            available_cols = [col for col in self.numeric_cols if col in X.columns]
            
            if missing_cols:
                # Add missing columns with zeros (default value)
                for col in missing_cols:
                    X[col] = 0.0
            
            # Select columns in the correct order expected by the model
            X_num = X[self.numeric_cols]
        else:
            X_num = X.select_dtypes(include=[np.number])

        # Ensure we have data
        if X_num.empty or len(X_num.columns) == 0:
            raise ValueError("No numeric columns found in the uploaded CSV. "
                           "Expected columns: " + ", ".join(str(c) for c in self.numeric_cols[:5]) + "...")

        # If scaler exists, apply it
        if self.scaler is not None:
            try:
                X_num = self.scaler.transform(X_num)
            except Exception as e:
                # If transform fails, proceed with raw numeric values
                pass

        preds = self.model.predict(X_num)

        # If label encoder exists, try to invert transform
        try:
            if self.le is not None:
                return self.le.inverse_transform(preds).tolist()
        except Exception:
            pass

        # Ensure serializable list output
        try:
            return preds.tolist()
        except Exception:
            return [int(p) if hasattr(p, '__int__') else str(p) for p in preds]
