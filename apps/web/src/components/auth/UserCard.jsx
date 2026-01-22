import React from "react";

const PageHeader = ({ title, subtitle, right }) => {
    return (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            <div>
                <h1 style={{ margin: 0 }}>{title}</h1>
                {subtitle ? <div style={{ opacity: 0.8, marginTop: 6 }}>{subtitle}</div> : null}
            </div>
            {right ? <div>{right}</div> : null}
        </div>
    );
};

export default PageHeader;