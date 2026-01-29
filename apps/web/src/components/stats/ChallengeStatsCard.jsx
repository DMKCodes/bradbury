import React from "react";

import { formatInt } from "../../lib/statsFormat.js";

/**
 * ChallengeStatsCard
 *
 * Props:
 * - challenge: { currentStreak?: number, completeDayCount?: number }
 */

const ChallengeStatsCard = ({ challenge }) => {
    const currentStreak = challenge?.currentStreak;
    const completeDayCount = challenge?.completeDayCount;

    return (
        <div className="card" style={{ marginBottom: 12 }}>
            <div className="label" style={{ marginBottom: 8 }}>Bradbury Challenge</div>

            <div className="muted">
                Current streak: <span style={{ fontWeight: 800 }}>{formatInt(currentStreak)}</span>
            </div>

            <div className="muted">
                Total complete days: <span style={{ fontWeight: 800 }}>{formatInt(completeDayCount)}</span>
            </div>
        </div>
    );
};

export default ChallengeStatsCard;