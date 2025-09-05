"use client";

import { useAccount, useConnect, useDisconnect } from "@starknet-react/core";
import { useState } from "react";

export const ConnectedAddress = () => {
  const { address, status } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
    console.log("Address copied to clipboard");
  };

  if (status === "disconnected") {
    return (
      <div className="dropdown dropdown-end">
        <div
          tabIndex={0}
          role="button"
          className="btn btn-primary"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          Connect Wallet
        </div>
        {isDropdownOpen && (
          <ul
            tabIndex={0}
            className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52 mt-2"
          >
            {connectors.map((connector) => (
              <li key={connector.id}>
                <button
                  onClick={() => {
                    connect({ connector });
                    setIsDropdownOpen(false);
                  }}
                  className="flex items-center gap-2"
                >
                  <span>{connector.name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  if (status === "connecting") {
    return <div className="btn btn-primary loading">Connecting...</div>;
  }

  if (status === "connected" && address) {
    return (
      <div className="dropdown dropdown-end">
        <div
          tabIndex={0}
          role="button"
          className="btn btn-ghost flex items-center gap-2"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          <div className="w-2 h-2 bg-success rounded-full"></div>
          <span className="font-mono">{formatAddress(address)}</span>
        </div>
        {isDropdownOpen && (
          <ul
            tabIndex={0}
            className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-64 mt-2"
          >
            <li className="menu-title">
              <span>Account</span>
            </li>
            <li>
              <div className="flex items-center justify-between p-2">
                <span className="font-mono text-sm">
                  {formatAddress(address)}
                </span>
                <button
                  onClick={() => copyToClipboard(address)}
                  className="btn btn-ghost btn-xs"
                  title="Copy address"
                >
                  📋
                </button>
              </div>
            </li>
            <li>
              <a
                href={`https://sepolia.starkscan.co/contract/${address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <span>🔍</span>
                View on Starkscan
              </a>
            </li>
            <div className="divider my-1"></div>
            <li>
              <button
                onClick={() => {
                  disconnect();
                  setIsDropdownOpen(false);
                }}
                className="text-error flex items-center gap-2"
              >
                <span>🔌</span>
                Disconnect
              </button>
            </li>
          </ul>
        )}
      </div>
    );
  }

  return (
    <div className="btn btn-ghost cursor-not-allowed opacity-50">
      Wallet Error
    </div>
  );
};
