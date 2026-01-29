import React from "react";
import { NavLink } from "react-router-dom";

import { logout } from "../../lib/api.js";

const TopNav = () => {
    const handleLogout = () => {
        logout();
        window.location.href = "/login";
    };

    return (
        <div className="shell__topbar">
            <div className="shell__topbarInner">
                <div style={{ fontWeight: 900 }}>Bradbury (Alpha)</div>

                <div className="navlinks">
                    <NavLink
                        to="/entries"
                        className={({ isActive }) => `navlink ${isActive ? "navlink--active" : ""}`}
                    >
                        Entries
                    </NavLink>

                    <NavLink
                        to="/stats"
                        className={({ isActive }) => `navlink ${isActive ? "navlink--active" : ""}`}
                    >
                        Stats
                    </NavLink>

                    <NavLink
                        to="/curriculum"
                        className={({ isActive }) => `navlink ${isActive ? "navlink--active" : ""}`}
                    >
                        Curriculum
                    </NavLink>

                    <button className="btn" onClick={handleLogout} type="button">
                        Logout
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TopNav;