import React from "react";
import logo from "../assets/logov2.png";

export default function Logo({ size = 64, className = "" }) {
  return (
    <div className={`flex flex-col items-center select-none ${className}`} style={{ minWidth: size }}>
      <img
        src={logo}
        alt="ENIMATE THEATRE Logo"
        width={size}
        height={size}
        className="rounded-2xl shadow-lg object-cover"
        draggable={false}
        style={{ maxWidth: size, maxHeight: size }}
      />
    </div>
  );
}
