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
      {/* Enhanced Header */}
      <div className="navbar bg-base-100/95 backdrop-blur-md shadow-xl border-b border-base-300 sticky top-0 z-50">
        <div className="navbar-start">
          <div className="flex items-center space-x-3">
            {/* <div className="avatar">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center shadow-lg">
                <span className="text-2xl">🎈</span>
              </div>
            </div> */}
            <div>
              <div className="text-2xl font-bold">
                <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                  Balloons
                </span>
                <span className="text-base-content ml-1">DEX</span>
              </div>
              <div className="text-xs text-base-content/60 font-medium">
                Decentralized Exchange Platform
              </div>
            </div>
          </div>
        </div>
        <div className="navbar-center">
          <div className="tabs tabs-boxed bg-base-200/80 border border-base-300/50 shadow-inner">
            <button
              className={`tab gap-2 transition-all duration-200 ${
                activeTab === "swap"
                  ? "tab-active bg-primary text-primary-content shadow-md"
                  : "hover:bg-base-300/70 text-base-content/80"
              }`}
              onClick={() => setActiveTab("swap")}
            >
              <span className="font-semibold">Swap</span>
            </button>
            <button
              className={`tab gap-2 transition-all duration-200 ${
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
        <div className="navbar-end">
          <div className="flex items-center space-x-3">
            {/* Network Status */}
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1 bg-success/10 border border-success/20 rounded-full">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-success">Starknet</span>
            </div>

            {/* Theme Toggle Button */}
            <ThemeToggle />
            <ConnectedAddress />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Trading Interface */}
          <div className="lg:col-span-2">
            {/* Pool Initializer - Shows only when pool is not initialized */}
            <div className="mb-8">
              <PoolInitializer />
            </div>

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

            {/* Recent Transactions */}
            {/* <div className="mt-8">
              <RecentTransactions />
            </div> */}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pool Statistics */}
            <PoolStats />

            {/* Quick Actions */}
            {/* <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h3 className="card-title text-lg">Quick Actions</h3>
                <div className="space-y-3">
                  <button className="btn btn-outline btn-block">
                    <span className="text-lg mr-2">📊</span>
                    Analytics
                  </button>
                  <button className="btn btn-outline btn-block">
                    <span className="text-lg mr-2">🎁</span>
                    Claim Rewards
                  </button>
                  <button className="btn btn-outline btn-block">
                    <span className="text-lg mr-2">⚙️</span>
                    Settings
                  </button>
                </div>
              </div>
            </div> */}

            {/* Market Info */}
            {/* <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h3 className="card-title text-lg">Market Info</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-base-content/70">24h Volume</span>
                    <span className="font-semibold">$1,234.56</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-base-content/70">
                      Total Liquidity
                    </span>
                    <span className="font-semibold">$5,678.90</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-base-content/70">Fees (24h)</span>
                    <span className="font-semibold">$12.34</span>
                  </div>
                </div>
              </div>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
}
