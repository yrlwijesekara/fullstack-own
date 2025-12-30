import React from "react";
import logo from "../assets/logo.jpeg";

export default function Logo({ size = 64, className = "" }) {
  return (
    <div className={`flex flex-col items-center select-none ${className}`} style={{ minWidth: size }}>
      <img
        src={logo}
        alt="ENIMATE THEATRE Logo"
        width={size}
        height={size}
        className="rounded-2xl shadow-lg border-4 border-primary-700 bg-background-900 object-cover"
        draggable={false}
        style={{ maxWidth: size, maxHeight: size }}
      />
    </div>
  );
}
