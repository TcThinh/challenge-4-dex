"use client";

import { useState } from "react";
import { SwapCard } from "~~/components/dex/SwapCard";
import { PoolStats } from "~~/components/dex/PoolStats";
import { LiquidityCard } from "~~/components/dex/LiquidityCard";
import { RecentTransactions } from "~~/components/dex/RecentTransactions";
import { PoolInitializer } from "~~/components/dex/PoolInitializer";
import { ConnectedAddress } from "~~/components/scaffold-stark/ConnectedAddress";
import { ThemeToggle } from "~~/components/ui/ThemeToggle";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"swap" | "pool">("swap");

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-200 via-base-100 to-base-200">
      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Pool Initializer - Shows only when pool is not initialized */}
        <div className="mb-8">
          <PoolInitializer />
        </div>

        {/* Tab Navigation - Centered at Top */}
        <div className="flex justify-center mb-8">
          <div className="tabs tabs-boxed bg-base-200/80 border border-base-300/50 shadow-inner">
            <button
              className={`tab tab-sm gap-2 transition-all duration-200 ${
                activeTab === "swap"
                  ? "tab-active bg-primary text-primary-content shadow-md"
                  : "hover:bg-base-300/70 text-base-content/80"
              }`}
              onClick={() => setActiveTab("swap")}
            >
              <span className="font-semibold">Swap</span>
            </button>
            <button
              className={`tab tab-sm gap-2 transition-all duration-200 ${
                activeTab === "pool"
                  ? "tab-active bg-primary text-primary-content shadow-md"
                  : "hover:bg-base-300/70 text-base-content/80"
              }`}
              onClick={() => setActiveTab("pool")}
            >
              <span className="font-semibold">Pool</span>
            </button>
          </div>
        </div>

        {/* Two Column Layout Below Tabs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Trading Interface */}
          <div className="lg:col-span-2">
            <div className="card bg-base-100/90 backdrop-blur-sm shadow-2xl border border-base-300/50 hover:shadow-3xl transition-all duration-300">
              <div className="card-body">
                {activeTab === "swap" ? (
                  <div>
                    <h2 className="card-title text-3xl mb-6 flex items-center">
                      <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                        Swap Tokens
                      </span>
                    </h2>
                    <SwapCard />
                  </div>
                ) : (
                  <div>
                    <h2 className="card-title text-3xl mb-6 flex items-center">
                      <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                        Liquidity Pool
                      </span>
                    </h2>
                    <LiquidityCard />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pool Statistics */}
            <PoolStats />
          </div>
        </div>
      </div>
    </div>
  );
}
