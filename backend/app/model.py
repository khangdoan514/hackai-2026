from pathlib import Path
import pandas as pd
from sklearn.model_selection import train_test_split

# AutoXGB imports
from autoxgb import AutoXGB

# -----------------------------
# 1. Load your raw data
# -----------------------------
# Replace with your real filename
df = pd.read_csv("ceo_stock_events.csv")

# -----------------------------
# 2. Basic cleanup
# -----------------------------
required_cols = [
    "company",
    "current_stock_price",
    "ceo",
    "sentiment",
    "30d_return",
    "direction",
]

missing = [c for c in required_cols if c not in df.columns]
if missing:
    raise ValueError(f"Missing required columns: {missing}")

df = df[required_cols].copy()
df = df.dropna()

# Normalize labels
df["direction"] = (
    df["direction"]
    .astype(str)
    .str.strip()
    .str.lower()
)

valid_labels = {"growth", "reduction"}
df = df[df["direction"].isin(valid_labels)]

if len(df) < 50:
    raise ValueError("Dataset is too small. Try to get at least 50+ rows to start.")

# -----------------------------
# 3. Train/validation split
# -----------------------------
train_df, valid_df = train_test_split(
    df,
    test_size=0.2,
    random_state=42,
    stratify=df["direction"],
)

# Save to CSV because AutoXGB expects tabular files
data_dir = Path("autoxgb_data")
data_dir.mkdir(exist_ok=True)

train_file = data_dir / "train.csv"
valid_file = data_dir / "valid.csv"

train_df.to_csv(train_file, index=False)
valid_df.to_csv(valid_file, index=False)

# -----------------------------
# 4. Configure AutoXGB
# -----------------------------
# This is a binary classification problem:
# growth vs reduction
output_dir = "autoxgb_output"

axgb = AutoXGB(
    train_filename=str(train_file),
    output=output_dir,
    test_filename=str(valid_file),
    task="classification",
    targets=["direction"],
    features=[
        "company",
        "current_stock_price",
        "ceo",
        "sentiment",
        "30d_return",
    ],
    categorical_features=["company", "ceo"],
    use_gpu=False,
    num_folds=5,
    seed=42,
    num_trials=25,
    time_limit=3600,
    fast=False,
)

# -----------------------------
# 5. Train
# -----------------------------
axgb.train()

print(f"Training complete. Artifacts saved in: {output_dir}")