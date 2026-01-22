import React from "react";
import TopNav from "./TopNav.jsx";

const AppShell = ({ title, subtitle, children }) => {
  return (
    <div className="shell">
      <TopNav />
      <div className="shell__content">
        <div style={{ marginBottom: 12 }}>
          <h1 style={{ margin: 0 }}>{title}</h1>
          {subtitle ? <div className="muted">{subtitle}</div> : null}
        </div>
        {children}
      </div>
    </div>
  );
};

export default AppShell;