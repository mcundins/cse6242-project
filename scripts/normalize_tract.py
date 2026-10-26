"""Copy a USDA CSV, preserving its columns and adding a normalized geoid column."""

import argparse
import csv
from pathlib import Path
import re


def normalize_geoid(value):
    """Strip whitespace and pad a 10/11-digit CSV string to 11 ASCII digits."""
    if not isinstance(value, str):
        raise ValueError("Read tract IDs as strings, not numbers")
    value = value.strip()
    if not re.fullmatch(r"[0-9]{10,11}", value):
        raise ValueError("Tract ID must contain 10 or 11 digits")
    return value.zfill(11)


def normalize_csv(input_path, output_path, column, encoding="utf-8-sig"):
    """Write a new UTF-8 CSV; never overwrite an existing file."""
    input_path, output_path = Path(input_path), Path(output_path)
    if input_path.resolve() == output_path.resolve():
        raise ValueError("Input and output must be different files")
    created = False
    count = 0
    try:
        with input_path.open(encoding=encoding, newline="") as source:
            reader = csv.DictReader(source)
            fields = reader.fieldnames
            if not fields or column not in fields:
                raise ValueError(f"Missing input column: {column}")
            if len(fields) != len(set(fields)):
                raise ValueError("Input has duplicate column names")
            if "geoid" in fields:
                raise ValueError("Input already has a geoid column; refusing to replace it")
            with output_path.open("x", encoding="utf-8", newline="") as target:
                created = True
                writer = csv.DictWriter(target, fieldnames=fields + ["geoid"])
                writer.writeheader()
                for row in reader:
                    if None in row or any(v is None for v in row.values()):
                        raise ValueError(f"Malformed CSV record ending at line {reader.line_num}")
                    try:
                        row["geoid"] = normalize_geoid(row[column])
                    except ValueError as error:
                        raise ValueError(f"Line {reader.line_num}: {error}") from error
                    writer.writerow(row)
                    count += 1
    except BaseException:
        if created:
            output_path.unlink()
        raise
    return count


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path, help="Source CSV")
    parser.add_argument("output", type=Path, help="New output CSV (parent directory must exist)")
    parser.add_argument("--column", required=True, choices=["CensusTract", "CensusTract20"])
    parser.add_argument("--encoding", default="utf-8-sig", help="Input encoding; use cp1252 for current 2025 files")
    args = parser.parse_args()
    try:
        count = normalize_csv(args.input, args.output, args.column, args.encoding)
    except (ValueError, OSError) as error:
        parser.exit(1, f"Error: {error}\n")
    print(f"Wrote {count:,} rows to {args.output} (original columns + geoid)")


if __name__ == "__main__":
    main()
