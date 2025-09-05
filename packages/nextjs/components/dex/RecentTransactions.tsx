"use client";

import { useState, useEffect } from "react";

interface Transaction {
  id: string;
  type: "swap" | "add" | "remove";
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOut: string;
  timestamp: number;
  hash: string;
  user: string;
}

export const RecentTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    // TODO: Fetch real transactions from backend/blockchain
    // Mock data for now
    setTransactions([
      {
        id: "1",
        type: "swap",
        tokenIn: "BAL",
        tokenOut: "STRK",
        amountIn: "100.0",
        amountOut: "9.89",
        timestamp: Date.now() - 300000, // 5 minutes ago
        hash: "0x1234...5678",
        user: "0xabcd...1234",
      },
      {
        id: "2",
        type: "add",
        tokenIn: "BAL",
        tokenOut: "STRK",
        amountIn: "50.0",
        amountOut: "5.0",
        timestamp: Date.now() - 600000, // 10 minutes ago
        hash: "0x2345...6789",
        user: "0xefgh...5678",
      },
      {
        id: "3",
        type: "swap",
        tokenIn: "STRK",
        tokenOut: "BAL",
        amountIn: "5.0",
        amountOut: "45.33",
        timestamp: Date.now() - 900000, // 15 minutes ago
        hash: "0x3456...7890",
        user: "0x1234...abcd",
      },
    ]);
  }, []);

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 60) {
      return `${minutes}m ago`;
    } else {
      return `${hours}h ago`;
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h3 className="card-title text-lg flex items-center">
          <span className="text-lg mr-2">📈</span>
          Recent Transactions
        </h3>

        <div className="overflow-x-auto">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>Type</th>
                <th>Amount</th>
                <th>User</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover">
                  <td>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">
                        {tx.type === "swap"
                          ? "🔄"
                          : tx.type === "add"
                            ? "➕"
                            : "➖"}
                      </span>
                      <span className="font-semibold">
                        {tx.type === "swap"
                          ? "Swap"
                          : tx.type === "add"
                            ? "Add LP"
                            : "Remove LP"}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="text-sm">
                      {parseFloat(tx.amountIn).toFixed(2)} {tx.tokenIn}
                      {tx.type === "swap" && (
                        <div className="text-xs text-base-content/70">
                          → {parseFloat(tx.amountOut).toFixed(2)} {tx.tokenOut}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="font-mono text-sm">
                      {formatAddress(tx.user)}
                    </span>
                  </td>
                  <td>
                    <span className="text-sm text-base-content/70">
                      {formatTime(tx.timestamp)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {transactions.length === 0 && (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">📭</div>
            <div className="text-lg font-semibold mb-2">
              No transactions yet
            </div>
            <div className="text-base-content/70">
              Start trading to see transactions here
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
