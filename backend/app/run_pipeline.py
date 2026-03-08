"""
PapaQuant - Full Pipeline Runner
==================================
Runs all 3 steps end-to-end:
  1. extract_controversy.py  →  output.json
  2. AI_analyzer.py          →  analysis_results.csv
  3. model.py                →  model_output/

Usage:
  python pipeline.py article1.txt
  python pipeline.py article1.txt article2.txt article3.txt   # batch
  python pipeline.py --inline                                  # built-in example
  python pipeline.py article.txt --skip-model                  # steps 1+2 only
  python pipeline.py article.txt --trials 50 --folds 5
"""

import os, sys, json, csv, argparse, importlib.util

HERE = os.path.dirname(os.path.abspath(__file__))

def load_module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    mod  = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod

def banner(step, title):
    print(f"\n{'='*62}")
    print(f"  STEP {step}: {title}")
    print(f"{'='*62}\n")

def main():
    parser = argparse.ArgumentParser(
        description="PapaQuant Full Pipeline",
        epilog="Example:  python pipeline.py article1.txt article2.txt",
    )
    parser.add_argument("articles", nargs="*",
                        help="One or more .txt article files")
    parser.add_argument("--inline",       action="store_true",
                        help="Run built-in Papa John's example (no OpenAI needed)")
    parser.add_argument("--skip-extract", action="store_true",
                        help="Skip Step 1 (use existing output.json)")
    parser.add_argument("--skip-model",   action="store_true",
                        help="Skip Step 3 (stop after analysis_results.csv)")
    parser.add_argument("--json-out",     default="output.json",
                        help="Intermediate JSON path (default: output.json)")
    parser.add_argument("--csv-out",      default="analysis_results.csv",
                        help="Analysis CSV path (default: analysis_results.csv)")
    parser.add_argument("--model-out",    default="model_output",
                        help="Model output dir (default: model_output/)")
    parser.add_argument("--trials",       type=int, default=25)
    parser.add_argument("--folds",        type=int, default=5)
    args = parser.parse_args()

    # ── Load modules ───────────────────────────────────────────────
    extractor_path = os.path.join(HERE, "extract_controversy.py")
    analyzer_path  = os.path.join(HERE, "AI_analyzer.py")
    model_path_    = os.path.join(HERE, "model.py")

    analyzer  = load_module("AI_analyzer",  analyzer_path)

    # ── Step 1: Extract controversy ───────────────────────────────
    all_records = []

    if args.inline:
        banner(1, "EXTRACT CONTROVERSY (inline example)")
        print("Using built-in Papa John's example — skipping GPT extraction.\n")
        all_records = [analyzer.INLINE_EXAMPLE]

    elif args.skip_extract:
        banner(1, "EXTRACT CONTROVERSY (skipped)")
        print(f"Loading existing: {args.json_out}")
        with open(args.json_out,"r") as f:
            raw = json.load(f)
        all_records = raw if isinstance(raw, list) else [raw]

    else:
        if not args.articles:
            parser.print_help()
            sys.exit("\nERROR: Provide at least one .txt article file, or use --inline.")
        extractor = load_module("extract_controversy", extractor_path)
        banner(1, f"EXTRACT CONTROVERSY  ({len(args.articles)} article(s))")
        for article_path in args.articles:
            rec = extractor.run(article_path)
            rec["article"] = os.path.basename(article_path)
            all_records.append(rec)
        with open(args.json_out,"w") as f:
            json.dump(all_records if len(all_records)>1 else all_records[0], f, indent=2)
        print(f"\nJSON saved -> {args.json_out}  ({len(all_records)} record(s))")

    # ── Step 2: Sentiment analysis ─────────────────────────────────
    banner(2, "AI SENTIMENT ANALYSIS")
    import csv as csv_mod

    all_rows = []
    for rec in all_records:
        analyzer.print_debug(rec)
        all_rows.extend(analyzer.analyze(rec))

    file_exists = os.path.exists(args.csv_out)

    with open(args.csv_out,"a",newline="",encoding="utf-8") as f:
        w = csv_mod.DictWriter(f, fieldnames=analyzer.FIELDS)
        if not file_exists:
            w.writeheader()
        w = csv_mod.DictWriter(f, fieldnames=analyzer.FIELDS)
        w.writerows(all_rows)

    print(f"CSV saved -> {args.csv_out}  ({len(all_rows)} row(s))")
    print("\n" + ",".join(analyzer.FIELDS))
    for row in all_rows:
        print(",".join(str(row[k]) for k in analyzer.FIELDS))

    if args.skip_model:
        print(f"\nDone (--skip-model). To train: python model.py --data {args.csv_out}")
        return

    # ── Step 3: Train XGBoost model ────────────────────────────────
    banner(3, "XGBOOST CLASSIFIER (Optuna HPO)")
    import importlib, sys as _sys
    _sys.argv = ["model.py",
                 "--data",    args.csv_out,
                 "--out-dir", args.model_out,
                 "--trials",  str(args.trials),
                 "--folds",   str(args.folds)]
    model_mod = load_module("model", model_path_)
    model_mod.main()

    print(f"\n{'='*62}")
    print("  PIPELINE COMPLETE")
    print(f"{'='*62}")
    print(f"  JSON          : {args.json_out}")
    print(f"  Analysis CSV  : {args.csv_out}")
    print(f"  Model output  : {args.model_out}/")
    print(f"{'='*62}\n")

if __name__ == "__main__":
    main()