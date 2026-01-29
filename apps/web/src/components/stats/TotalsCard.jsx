import React from "react";

import { formatAvg, formatInt } from "../../lib/statsFormat.js";

/**
 * TotalsCard
 *
 * Props:
 * - totals: { totalWords?: number, avgRating?: number|null, ratingCount?: number }
 */

const TotalsCard = ({ totals }) => {
    const totalWords = totals?.totalWords;
    const avgRating = totals?.avgRating;
    const ratingCount = totals?.ratingCount;

    return (
        <div className="card" style={{ marginBottom: 12 }}>
            <div className="label" style={{ marginBottom: 8 }}>Totals</div>

            <div className="muted">
                Total estimated words:{" "}
                <span style={{ fontWeight: 800 }}>{formatInt(totalWords)}</span>
            </div>

            <div className="muted">
                Average rating (out of 5):{" "}
                <span style={{ fontWeight: 800 }}>{formatAvg(avgRating)}</span>{" "}
                <span className="muted">(from {formatInt(ratingCount)} rated entries)</span>
            </div>
        </div>
    );
};

export default TotalsCard;