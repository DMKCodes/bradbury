import React from "react";

/**
 * YearSelector
 *
 * Props:
 * - selectedYear: "All" | "YYYY"
 * - availableYears: string[] (e.g., ["2026", "2025"])
 * - disabled: boolean (disable buttons while loading)
 * - onChange: (year: string) => void
 */

const YearSelector = ({ selectedYear, availableYears, disabled, onChange }) => {
    return (
        <div className="card" style={{ marginBottom: 12 }}>
            <div className="label" style={{ marginBottom: 8 }}>Year</div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                    type="button"
                    className={`pill ${selectedYear === "All" ? "pill--selected" : ""}`}
                    onClick={() => onChange("All")}
                    disabled={disabled}
                >
                    All
                </button>

                {(availableYears || []).map((y) => (
                    <button
                        key={y}
                        type="button"
                        className={`pill ${selectedYear === y ? "pill--selected" : ""}`}
                        onClick={() => onChange(y)}
                        disabled={disabled}
                    >
                        {y}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default YearSelector;