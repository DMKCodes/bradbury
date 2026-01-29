import React from "react";

import { formatAvg, formatAvgWords, formatInt } from "../../lib/statsFormat.js";

/**
 * PerTypeAveragesCard
 *
 * Props:
 * - perTypeAverages: {
 *     essay?: { count, avgRating, avgWords, ratedCount, wordCount },
 *     story?: { ... },
 *     poem?: { ... }
 *   }
 */

const TYPE_LABELS = {
    essay: "Essay",
    story: "Short story",
    poem: "Poem",
};

const TYPES = ["essay", "story", "poem"];

const PerTypeAveragesCard = ({ perTypeAverages }) => {
    const perType = perTypeAverages || {};

    return (
        <div className="card">
            <div className="label" style={{ marginBottom: 8 }}>Averages by type</div>

            {TYPES.map((k) => {
                const row = perType?.[k] || {};
                return (
                    <div key={k} style={{ marginBottom: 10 }}>
                        <div style={{ fontWeight: 800, marginBottom: 4 }}>{TYPE_LABELS[k]}</div>

                        <div className="muted">
                            Count: <span style={{ fontWeight: 800 }}>{formatInt(row.count)}</span>
                        </div>

                        <div className="muted">
                            Avg rating:{" "}
                            <span style={{ fontWeight: 800 }}>{formatAvg(row.avgRating)}</span>{" "}
                            <span className="muted">(from {formatInt(row.ratedCount)} rated)</span>
                        </div>

                        <div className="muted">
                            Avg words:{" "}
                            <span style={{ fontWeight: 800 }}>{formatAvgWords(row.avgWords)}</span>{" "}
                            <span className="muted">(from {formatInt(row.wordCount)} with word count)</span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default PerTypeAveragesCard;