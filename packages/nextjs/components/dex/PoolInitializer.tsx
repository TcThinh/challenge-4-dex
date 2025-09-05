"use client";

import { useState, useEffect } from "react";
import { useAccount } from "@starknet-react/core";
import {
  useTokenBalances,
  useTokenAllowance,
} from "~~/hooks/dex/useTokenBalances";
import { useDEXPoolData } from "~~/hooks/dex/useDEXPoolData";
import {
  useDEXInitialization,
  useApprovalTransactions,
} from "~~/hooks/dex/useTransactions";
import { useDEXContract } from "~~/hooks/dex/useContracts";

export const PoolInitializer = () => {
  const { account } = useAccount();
  const [balAmount, setBalAmount] = useState("500");
  const [strkAmount, setStrkAmount] = useState("50");

  // Individual loading states
  const [isApprovingBAL, setIsApprovingBAL] = useState(false);
  const [isApprovingSTRK, setIsApprovingSTRK] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  // Success/Error states
  const [lastTxHash, setLastTxHash] = useState<string>();
  const [error, setError] = useState<string>();

  // Contract hooks
  const dexContract = useDEXContract();
  const {
    balanceBAL,
    balanceSTRK,
    refetch: refetchBalances,
  } = useTokenBalances();
  const { totalLiquidity, refetch: refetchPoolData } = useDEXPoolData();

  // Transaction hooks
  const { initializeDEX } = useDEXInitialization();
  const { approveToken } = useApprovalTransactions();

  // Allowances
  const { allowance: balAllowance, refetch: refetchBALAllowance } =
    useTokenAllowance(dexContract?.address || "", "BAL");
  const { allowance: strkAllowance, refetch: refetchSTRKAllowance } =
    useTokenAllowance(dexContract?.address || "", "STRK");

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(undefined), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Clear success message after 5 seconds
  useEffect(() => {
    if (lastTxHash) {
      const timer = setTimeout(() => setLastTxHash(undefined), 10000);
      return () => clearTimeout(timer);
    }
  }, [lastTxHash]);

  // Check if approvals are needed
  const needsBALApproval =
    balAmount && parseFloat(balAmount) > parseFloat(balAllowance);
  const needsSTRKApproval =
    strkAmount && parseFloat(strkAmount) > parseFloat(strkAllowance);

  // Check if pool is already initialized
  const isPoolInitialized = parseFloat(totalLiquidity) > 0;

  // Validation
  const hasInsufficientBAL =
    parseFloat(balAmount || "0") > parseFloat(balanceBAL);
  const hasInsufficientSTRK =
    parseFloat(strkAmount || "0") > parseFloat(balanceSTRK);
  const canProceed =
    balAmount && strkAmount && !hasInsufficientBAL && !hasInsufficientSTRK;

  const handleApproveBAL = async () => {
    if (!balAmount || isApprovingBAL) return;

    setIsApprovingBAL(true);
    setError(undefined);

    try {
      console.log("Starting BAL approval for:", balAmount);
      const result = await approveToken("BAL", balAmount);
      console.log("BAL approval result:", result);

      setLastTxHash(result.transaction_hash);

      // Retry refetch multiple times
      for (let i = 0; i < 10; i++) {
        setTimeout(
          async () => {
            console.log(`Refetching BAL allowance attempt ${i + 1}`);
            await refetchBALAllowance();
          },
          (i + 1) * 1000
        );
      }
    } catch (error: any) {
      console.error("BAL approval failed:", error);
      setError(error.message || "BAL approval failed");
    } finally {
      setIsApprovingBAL(false);
    }
  };

  const handleApproveSTRK = async () => {
    if (!strkAmount || isApprovingSTRK) return;

    setIsApprovingSTRK(true);
    setError(undefined);

    try {
      console.log("Starting STRK approval for:", strkAmount);
      const result = await approveToken("STRK", strkAmount);
      console.log("STRK approval result:", result);

      setLastTxHash(result.transaction_hash);

      // Retry refetch multiple times
      for (let i = 0; i < 10; i++) {
        setTimeout(
          async () => {
            console.log(`Refetching STRK allowance attempt ${i + 1}`);
            await refetchSTRKAllowance();
          },
          (i + 1) * 1000
        );
      }
    } catch (error: any) {
      console.error("STRK approval failed:", error);
      setError(error.message || "STRK approval failed");
    } finally {
      setIsApprovingSTRK(false);
    }
  };

  const handleInitialize = async () => {
    if (!account || !balAmount || !strkAmount || isInitializing) return;

    setIsInitializing(true);
    setError(undefined);

    try {
      console.log("Starting pool initialization:", { balAmount, strkAmount });
      const result = await initializeDEX(balAmount, strkAmount);
      console.log("Pool initialization result:", result);

      setLastTxHash(result.transaction_hash);

      // Refresh all data multiple times
      for (let i = 0; i < 10; i++) {
        setTimeout(
          async () => {
            console.log(`Refreshing data attempt ${i + 1}`);
            await Promise.all([
              refetchBalances(),
              refetchPoolData(),
              refetchBALAllowance(),
              refetchSTRKAllowance(),
            ]);
          },
          (i + 1) * 1000
        );
      }
    } catch (error: any) {
      console.error("Pool initialization failed:", error);
      setError(error.message || "Pool initialization failed");
    } finally {
      setIsInitializing(false);
    }
  };

  const getCurrentStep = () => {
    if (!account) return 0;
    if (needsBALApproval) return 1;
    if (needsSTRKApproval) return 2;
    return 3;
  };

  // Don't show if pool is already initialized
  if (isPoolInitialized) {
    return null;
  }

  const anyLoading = isApprovingBAL || isApprovingSTRK || isInitializing;

  return (
    <div
      id="pool-initializer"
      className="card bg-gradient-to-br from-primary/5 to-secondary/5 shadow-2xl border border-primary/20"
    >
      <div className="card-body">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold text-primary flex items-center">
              <span className="text-2xl mr-3">🚀</span>
              Initialize DEX Pool
            </h3>
            <p className="text-base-content/70 mt-1">
              Set the initial liquidity and establish the BAL/STRK exchange rate
            </p>
          </div>
          <div className="badge badge-warning">Step {getCurrentStep()}/3</div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <ul className="steps steps-horizontal w-full">
            <li
              className={`step ${getCurrentStep() >= 1 ? "step-primary" : ""}`}
            >
              Connect Wallet
            </li>
            <li
              className={`step ${getCurrentStep() >= 2 ? "step-primary" : ""}`}
            >
              Approve Tokens
            </li>
            <li
              className={`step ${getCurrentStep() >= 3 ? "step-primary" : ""}`}
            >
              Initialize Pool
            </li>
          </ul>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="alert alert-error mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="flex-1">{error}</span>
            <button
              className="btn btn-sm btn-ghost"
              onClick={() => setError(undefined)}
            >
              ✕
            </button>
          </div>
        )}

        {/* Success Alert */}
        {lastTxHash && !error && (
          <div className="alert alert-success mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1">
              <span>Transaction submitted successfully!</span>
              <div className="text-xs opacity-70">
                <a
                  href={`https://sepolia.starkscan.co/tx/${lastTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link"
                >
                  View on Starkscan: {lastTxHash}
                </a>
              </div>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Column - Inputs */}
          <div className="space-y-6">
            {/* BAL Amount */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold text-lg">
                  🎈 BAL Amount
                </span>
                <span className="label-text-alt">
                  Balance:{" "}
                  <span className="font-mono">
                    {parseFloat(balanceBAL).toFixed(2)}
                  </span>
                </span>
              </label>
              <div className="input-group">
                <input
                  type="number"
                  placeholder="500"
                  value={balAmount}
                  onChange={(e) => setBalAmount(e.target.value)}
                  className={`input input-bordered input-lg flex-1 ${hasInsufficientBAL ? "input-error" : ""}`}
                  disabled={anyLoading}
                />
                <button
                  className="btn btn-outline"
                  onClick={() => setBalAmount(balanceBAL)}
                  disabled={anyLoading}
                >
                  MAX
                </button>
              </div>
              {hasInsufficientBAL && (
                <label className="label">
                  <span className="label-text-alt text-error">
                    Insufficient balance
                  </span>
                </label>
              )}
            </div>

            {/* STRK Amount */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold text-lg">
                  ⭐ STRK Amount
                </span>
                <span className="label-text-alt">
                  Balance:{" "}
                  <span className="font-mono">
                    {parseFloat(balanceSTRK).toFixed(2)}
                  </span>
                </span>
              </label>
              <div className="input-group">
                <input
                  type="number"
                  placeholder="50"
                  value={strkAmount}
                  onChange={(e) => setStrkAmount(e.target.value)}
                  className={`input input-bordered input-lg flex-1 ${hasInsufficientSTRK ? "input-error" : ""}`}
                  disabled={anyLoading}
                />
                <button
                  className="btn btn-outline"
                  onClick={() => setStrkAmount(balanceSTRK)}
                  disabled={anyLoading}
                >
                  MAX
                </button>
              </div>
              {hasInsufficientSTRK && (
                <label className="label">
                  <span className="label-text-alt text-error">
                    Insufficient balance
                  </span>
                </label>
              )}
            </div>
          </div>

          {/* Right Column - Preview */}
          <div className="space-y-6">
            {/* Price Preview */}
            {balAmount && strkAmount && (
              <div className="card bg-base-200 border border-base-300">
                <div className="card-body">
                  <h4 className="card-title text-lg">📈 Initial Price</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>1 BAL =</span>
                      <span className="font-mono font-bold">
                        {(
                          parseFloat(strkAmount) / parseFloat(balAmount)
                        ).toFixed(4)}{" "}
                        STRK
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>1 STRK =</span>
                      <span className="font-mono font-bold">
                        {(
                          parseFloat(balAmount) / parseFloat(strkAmount)
                        ).toFixed(2)}{" "}
                        BAL
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* LP Preview */}
            {balAmount && strkAmount && (
              <div className="card bg-base-200 border border-base-300">
                <div className="card-body">
                  <h4 className="card-title text-lg">You will receive</h4>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">
                      {Math.sqrt(
                        parseFloat(balAmount) * parseFloat(strkAmount)
                      ).toFixed(4)}
                    </div>
                    <div className="text-sm opacity-70">LP Tokens</div>
                    <div className="text-xs opacity-50 mt-1">
                      (√{balAmount} × {strkAmount})
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Debug Info */}
        <div className="mt-4 p-3 bg-base-300 rounded text-xs">
          <div className="font-semibold mb-2">Debug Info:</div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>BAL Allowance: {balAllowance}</div>
            <div>STRK Allowance: {strkAllowance}</div>
            <div>Needs BAL Approval: {needsBALApproval ? "Yes" : "No"}</div>
            <div>Needs STRK Approval: {needsSTRKApproval ? "Yes" : "No"}</div>
            <div>Loading BAL: {isApprovingBAL ? "Yes" : "No"}</div>
            <div>Loading STRK: {isApprovingSTRK ? "Yes" : "No"}</div>
          </div>
          <div className="flex space-x-2">
            <button
              className="btn btn-xs btn-outline"
              onClick={() => {
                refetchBALAllowance();
                refetchSTRKAllowance();
              }}
            >
              Refresh Allowances
            </button>
            <button
              className="btn btn-xs btn-outline"
              onClick={() => {
                setIsApprovingBAL(false);
                setIsApprovingSTRK(false);
                setIsInitializing(false);
                setError(undefined);
              }}
            >
              Reset Loading States
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 space-y-4">
          {!account ? (
            <div className="text-center">
              <div className="text-6xl mb-4">👛</div>
              <h3 className="text-xl font-semibold mb-2">
                Connect Your Wallet
              </h3>
              <p className="text-base-content/70 mb-4">
                You need to connect a wallet to initialize the pool
              </p>
            </div>
          ) : needsBALApproval ? (
            <button
              onClick={handleApproveBAL}
              disabled={!canProceed || isApprovingBAL}
              className="btn btn-warning btn-lg btn-block"
            >
              {isApprovingBAL ? (
                <>
                  <span className="loading loading-spinner"></span>
                  Approving BAL...
                </>
              ) : (
                <>
                  <span className="text-xl mr-2">✅</span>
                  Approve {balAmount} BAL
                </>
              )}
            </button>
          ) : needsSTRKApproval ? (
            <button
              onClick={handleApproveSTRK}
              disabled={!canProceed || isApprovingSTRK}
              className="btn btn-warning btn-lg btn-block"
            >
              {isApprovingSTRK ? (
                <>
                  <span className="loading loading-spinner"></span>
                  Approving STRK...
                </>
              ) : (
                <>
                  <span className="text-xl mr-2">✅</span>
                  Approve {strkAmount} STRK
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleInitialize}
              disabled={!canProceed || isInitializing}
              className="btn btn-primary btn-lg btn-block"
            >
              {isInitializing ? (
                <>
                  <span className="loading loading-spinner"></span>
                  Initializing Pool...
                </>
              ) : (
                <>
                  <span className="text-xl mr-2">🚀</span>
                  Initialize Pool
                </>
              )}
            </button>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 bg-base-200 rounded-lg">
          <div className="text-sm text-base-content/70">
            <div className="font-semibold mb-2 flex items-center">
              <span className="text-lg mr-2">💡</span>
              What happens next?
            </div>
            <ol className="list-decimal list-inside space-y-1 ml-6">
              <li>Approve BAL tokens for the DEX contract</li>
              <li>Approve STRK tokens for the DEX contract</li>
              <li>Initialize creates the liquidity pool</li>
              <li>You receive LP tokens representing your share</li>
              <li>Trading becomes available for all users</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
