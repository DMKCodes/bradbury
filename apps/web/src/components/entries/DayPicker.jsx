import React from "react";

const DayPicker = ({ dayKey, setDayKey }) => {
    return (
        <div style={{ marginTop: 18, padding: 12, border: "1px solid #ccc" }}>
            <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <strong>Day</strong>
                <input
                    type="date"
                    value={dayKey}
                    onChange={(e) => setDayKey(e.target.value)}
                    style={{ padding: 8 }}
                />
            </label>
        </div>
    );
};

export default DayPicker;