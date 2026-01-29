import React from "react";

import { formatInt } from "../../lib/statsFormat.js";

/**
 * CountsByTypeCard
 *
 * Props:
 * - countsByType: { essay?: number, story?: number, poem?: number }
 */

const TYPE_LABELS = {
    essay: "Essay",
    story: "Short story",
    poem: "Poem",
};

const TYPES = ["essay", "story", "poem"];

const CountsByTypeCard = ({ countsByType }) => {
    const counts = countsByType || {};

    return (
        <div className="card" style={{ marginBottom: 12 }}>
            <div className="label" style={{ marginBottom: 8 }}>Finished counts</div>

            {TYPES.map((k) => (
                <div key={k} className="muted">
                    {TYPE_LABELS[k]}:{" "}
                    <span style={{ fontWeight: 800 }}>{formatInt(counts[k] || 0)}</span>
                </div>
            ))}
        </div>
    );
};

export default CountsByTypeCard;