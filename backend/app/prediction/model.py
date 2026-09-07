import os
import joblib
import numpy as np
from typing import Dict, Any, Optional
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, root_mean_squared_error, r2_score


MODEL_ARTIFACTS_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "models",
    "artifacts"
)


class WorkloadPredictor:
    """
    Random Forest Regressor predictor estimating CPU requirement, Memory requirement, and Duration.
    """

    def __init__(
        self,
        n_estimators: int = 100,
        max_depth: Optional[int] = 12,
        min_samples_leaf: int = 2,
        random_state: int = 42
    ):
        self.n_estimators = n_estimators
        self.max_depth = max_depth
        self.min_samples_leaf = min_samples_leaf
        self.random_state = random_state
        self.version = "rf_v1.0"
        
        self.model = RandomForestRegressor(
            n_estimators=self.n_estimators,
            max_depth=self.max_depth,
            min_samples_leaf=self.min_samples_leaf,
            random_state=self.random_state,
            n_jobs=-1
        )
        self.is_trained = False
        self.trained_samples = 0
        self.last_metrics: Dict[str, Any] = {}

    def fit(self, X: np.ndarray, y: np.ndarray) -> Dict[str, Any]:
        """
        Fit Random Forest regressor on feature matrix X and target matrix y [cpu, memory, duration].
        """
        self.model.fit(X, y)
        self.is_trained = True
        self.trained_samples = len(X)
        return self.evaluate(X, y)

    def predict(self, X: np.ndarray) -> np.ndarray:
        """
        Predict [cpu, memory, duration] targets for feature matrix X.
        """
        if not self.is_trained:
            raise RuntimeError("Model is not trained yet. Call fit() or load existing artifact.")
        preds = self.model.predict(X)
        
        # Ensure positive values: CPU >= 16, Memory >= 64, Duration >= 1.0
        preds[:, 0] = np.clip(preds[:, 0], 16.0, 512.0)
        preds[:, 1] = np.clip(preds[:, 1], 64.0, 2048.0)
        preds[:, 2] = np.clip(preds[:, 2], 1.0, 12.0)
        return preds

    def evaluate(self, X_val: np.ndarray, y_val: np.ndarray) -> Dict[str, Any]:
        """
        Compute MAE, RMSE, and R² evaluation metrics across targets.
        """
        preds = self.predict(X_val)
        
        targets = ["cpu", "memory", "duration"]
        mae_dict = {}
        rmse_dict = {}
        r2_dict = {}

        for idx, target in enumerate(targets):
            mae_dict[target] = round(float(mean_absolute_error(y_val[:, idx], preds[:, idx])), 3)
            rmse_dict[target] = round(float(root_mean_squared_error(y_val[:, idx], preds[:, idx])), 3)
            r2_dict[target] = round(float(r2_score(y_val[:, idx], preds[:, idx])), 3)

        self.last_metrics = {
            "mae": mae_dict,
            "rmse": rmse_dict,
            "r2": r2_dict,
        }
        return self.last_metrics

    def save(self, file_name: str = "workload_predictor.joblib") -> str:
        """
        Persist model artifact to backend/models/artifacts/.
        """
        os.makedirs(MODEL_ARTIFACTS_DIR, exist_ok=True)
        file_path = os.path.join(MODEL_ARTIFACTS_DIR, file_name)
        payload = {
            "model": self.model,
            "version": self.version,
            "is_trained": self.is_trained,
            "trained_samples": self.trained_samples,
            "last_metrics": self.last_metrics,
        }
        joblib.dump(payload, file_path)
        return file_path

    def load(self, file_name: str = "workload_predictor.joblib") -> bool:
        """
        Load model artifact from backend/models/artifacts/.
        """
        file_path = os.path.join(MODEL_ARTIFACTS_DIR, file_name)
        if not os.path.exists(file_path):
            return False

        payload = joblib.load(file_path)
        self.model = payload["model"]
        self.version = payload.get("version", "rf_v1.0")
        self.is_trained = payload.get("is_trained", True)
        self.trained_samples = payload.get("trained_samples", 0)
        self.last_metrics = payload.get("last_metrics", {})
        return True
