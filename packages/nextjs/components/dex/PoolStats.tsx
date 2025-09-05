"use client";

import { useDEXPoolData } from "~~/hooks/dex/useDEXPoolData";

export const PoolStats = () => {
  const {
    tokenReserve,
    strkReserve,
    totalLiquidity,
    tokenPriceInStrk,
    strkPriceInToken,
    isLoading,
  } = useDEXPoolData();

  const formatNumber = (num: string | number) => {
    const value = typeof num === "string" ? parseFloat(num) : num;
    if (isNaN(value)) return "0.00";

    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(2)}K`;
    }
    return value.toFixed(2);
  };

  // Calculate TVL in USD (mock calculation - you'd use real price feeds)
  const mockSTRKPriceUSD = 0.5; // $0.5 per STRK
  const tvlUSD = (parseFloat(strkReserve) * 2 * mockSTRKPriceUSD).toFixed(2);

  // Mock 24h data (you'd track this over time)
  const volume24h = "1,234.56";
  const fees24h = (parseFloat(volume24h.replace(",", "")) * 0.003).toFixed(2);

  if (isLoading) {
    return (
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="animate-pulse">
            <div className="h-4 bg-base-300 rounded mb-2"></div>
            <div className="h-8 bg-base-300 rounded mb-4"></div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="h-16 bg-base-300 rounded"></div>
              <div className="h-16 bg-base-300 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h3 className="card-title text-lg flex items-center">
          <span className="text-lg mr-2">📊</span>
          BAL/STRK Pool
        </h3>

        {/* Current Price */}
        <div className="stats stats-vertical shadow bg-base-200 mb-4">
          <div className="stat">
            <div className="stat-title">Current Price</div>
            <div className="stat-value text-2xl">
              {tokenPriceInStrk.toFixed(4)} STRK
            </div>
            <div className="stat-desc text-xs">
              1 BAL = {tokenPriceInStrk.toFixed(4)} STRK
            </div>
            <div className="stat-desc text-xs">
              1 STRK = {strkPriceInToken.toFixed(2)} BAL
            </div>
          </div>
        </div>

        {/* Pool Reserves */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-base-200 rounded-lg p-3">
            <div className="text-xs text-base-content/70 mb-1">BAL Reserve</div>
            <div className="font-semibold flex items-center">
              <span className="mr-1">🎈</span>
              {formatNumber(tokenReserve)}
            </div>
          </div>
          <div className="bg-base-200 rounded-lg p-3">
            <div className="text-xs text-base-content/70 mb-1">
              STRK Reserve
            </div>
            <div className="font-semibold flex items-center">
              <span className="mr-1">⭐</span>
              {formatNumber(strkReserve)}
            </div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-base-content/70">Total Liquidity</span>
            <span className="font-semibold">
              {formatNumber(totalLiquidity)} LP
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-base-content/70">TVL</span>
            <span className="font-semibold">${tvlUSD}</span>
          </div>
          {/* <div className="flex justify-between">
            <span className="text-base-content/70">24h Volume</span>
            <span className="font-semibold">${volume24h}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-base-content/70">24h Fees</span>
            <span className="font-semibold text-success">${fees24h}</span>
          </div> */}
        </div>

        {/* Pool Status */}
        <div className="mt-4">
          {parseFloat(totalLiquidity) === 0 ? (
            <div className="alert alert-warning">
              <div className="flex-1">
                <span>⚠️ Pool not initialized</span>
              </div>
              <div className="flex-none">
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => {
                    // Scroll to the initializer component
                    document
                      .getElementById("pool-initializer")
                      ?.scrollIntoView({
                        behavior: "smooth",
                      });
                  }}
                >
                  Initialize
                </button>
              </div>
            </div>
          ) : (
            <div className="alert alert-success">
              <span>✅ Pool is active</span>
            </div>
          )}
        </div>

        {/* Pool Actions */}
        {/* <div className="card-actions justify-end mt-4"> */}
        {/* <button className="btn btn-outline btn-sm">Add Liquidity</button> */}
        {/* <button className="btn btn-primary btn-sm">Trade</button> */}
        {/* </div> */}
      </div>
    </div>
  );
};
