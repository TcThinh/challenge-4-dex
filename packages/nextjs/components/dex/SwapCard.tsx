"use client";

import { useState } from "react";
import { useAccount } from "@starknet-react/core";
import {
  useTokenBalances,
  useTokenAllowance,
} from "~~/hooks/dex/useTokenBalances";
import { useDEXPoolData } from "~~/hooks/dex/useDEXPoolData";
import { useSwapCalculations } from "~~/hooks/dex/useSwapCalculations";
import {
  useSwapTransactions,
  useApprovalTransactions,
} from "~~/hooks/dex/useTransactions";
import { useDEXContract } from "~~/hooks/dex/useContracts";

export const SwapCard = () => {
  const { account } = useAccount();
  const [tokenIn, setTokenIn] = useState<"BAL" | "STRK">("BAL");
  const [amountIn, setAmountIn] = useState("");

  // Individual loading states
  const [isApprovingBAL, setIsApprovingBAL] = useState(false);
  const [isApprovingSTRK, setIsApprovingSTRK] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);

  // Contract hooks
  const dexContract = useDEXContract();
  const {
    balanceBAL,
    balanceSTRK,
    refetch: refetchBalances,
  } = useTokenBalances();
  const {
    tokenReserve,
    strkReserve,
    refetch: refetchPoolData,
  } = useDEXPoolData();

  // Transaction hooks
  const { executeSwap } = useSwapTransactions();
  const { approveToken } = useApprovalTransactions();

  // Allowances
  const { allowance: balAllowance, refetch: refetchBALAllowance } =
    useTokenAllowance(dexContract?.address || "", "BAL");
  const { allowance: strkAllowance, refetch: refetchSTRKAllowance } =
    useTokenAllowance(dexContract?.address || "", "STRK");

  // Swap calculations
  const { outputAmount, priceImpact, minimumReceived } = useSwapCalculations(
    amountIn,
    tokenIn,
    tokenReserve,
    strkReserve
  );

  // Check if approval is needed
  const needsApproval =
    amountIn &&
    ((tokenIn === "BAL" && parseFloat(amountIn) > parseFloat(balAllowance)) ||
      (tokenIn === "STRK" && parseFloat(amountIn) > parseFloat(strkAllowance)));

  // Get current balance and token info
  const currentBalance = tokenIn === "BAL" ? balanceBAL : balanceSTRK;
  const tokenOut = tokenIn === "BAL" ? "STRK" : "BAL";

  const handleTokenSwitch = () => {
    setTokenIn(tokenIn === "BAL" ? "STRK" : "BAL");
    setAmountIn("");
  };

  const handleApprove = async () => {
    if (!amountIn) return;

    try {
      if (tokenIn === "BAL") {
        setIsApprovingBAL(true);
      } else {
        setIsApprovingSTRK(true);
      }

      await approveToken(tokenIn, amountIn);

      // Refetch allowances
      if (tokenIn === "BAL") {
        setTimeout(() => refetchBALAllowance(), 1000);
      } else {
        setTimeout(() => refetchSTRKAllowance(), 1000);
      }
    } catch (error) {
      console.error(`${tokenIn} approval failed:`, error);
    } finally {
      if (tokenIn === "BAL") {
        setIsApprovingBAL(false);
      } else {
        setIsApprovingSTRK(false);
      }
    }
  };

  const handleSwap = async () => {
    if (!account || !amountIn || !minimumReceived) return;

    try {
      setIsSwapping(true);
      await executeSwap(tokenIn, amountIn, minimumReceived);

      // Clear input and refresh data
      setAmountIn("");
      refetchBalances();
      refetchPoolData();
      refetchBALAllowance();
      refetchSTRKAllowance();
    } catch (error) {
      console.error("Swap failed:", error);
    } finally {
      setIsSwapping(false);
    }
  };

  const setMaxAmount = () => {
    setAmountIn(currentBalance);
  };

  const isApprovingCurrent =
    tokenIn === "BAL" ? isApprovingBAL : isApprovingSTRK;

  return (
    <div className="max-w-md mx-auto space-y-4">
      {/* From Token */}
      <div className="bg-base-200 rounded-xl p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-base-content/70">From</span>
          <span className="text-sm text-base-content/70">
            Balance: {parseFloat(currentBalance).toFixed(4)}
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <input
            type="number"
            placeholder="0.0"
            value={amountIn}
            onChange={(e) => setAmountIn(e.target.value)}
            className="input input-ghost text-xl font-semibold flex-1 p-0 h-auto border-none focus:outline-none bg-transparent"
          />
          <div className="flex items-center space-x-2">
            <button onClick={setMaxAmount} className="btn btn-xs btn-ghost">
              MAX
            </button>
            <div className="flex items-center space-x-2 bg-base-100 rounded-lg px-3 py-2">
              <span className="text-lg">{tokenIn === "BAL" ? "🎈" : "⭐"}</span>
              <span className="font-semibold">{tokenIn}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Swap Button */}
      <div className="flex justify-center">
        <button
          onClick={handleTokenSwitch}
          className="btn btn-circle btn-ghost bg-base-300"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
            />
          </svg>
        </button>
      </div>

      {/* To Token */}
      <div className="bg-base-200 rounded-xl p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-base-content/70">To</span>
          <span className="text-sm text-base-content/70">
            Balance:{" "}
            {parseFloat(tokenOut === "BAL" ? balanceBAL : balanceSTRK).toFixed(
              4
            )}
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <input
            type="number"
            placeholder="0.0"
            value={outputAmount}
            readOnly
            className="input input-ghost text-xl font-semibold flex-1 p-0 h-auto border-none focus:outline-none bg-transparent"
          />
          <div className="flex items-center space-x-2 bg-base-100 rounded-lg px-3 py-2">
            <span className="text-lg">{tokenOut === "BAL" ? "🎈" : "⭐"}</span>
            <span className="font-semibold">{tokenOut}</span>
          </div>
        </div>
      </div>

      {/* Swap Details */}
      {amountIn && outputAmount && (
        <div className="bg-base-200 rounded-xl p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-base-content/70">Rate</span>
            <span>
              1 {tokenIn} ={" "}
              {(parseFloat(outputAmount) / parseFloat(amountIn)).toFixed(6)}{" "}
              {tokenOut}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-base-content/70">Price Impact</span>
            <span className={priceImpact > 5 ? "text-warning" : "text-success"}>
              {priceImpact.toFixed(2)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-base-content/70">Trading Fee</span>
            <span>0.3%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-base-content/70">Minimum Received</span>
            <span>
              {minimumReceived} {tokenOut}
            </span>
          </div>
        </div>
      )}

      {/* Action Button */}
      {!account ? (
        <button className="btn btn-primary btn-block btn-lg" disabled>
          Connect Wallet
        </button>
      ) : needsApproval ? (
        <button
          onClick={handleApprove}
          disabled={!amountIn || isApprovingCurrent}
          className="btn btn-warning btn-block btn-lg"
        >
          {isApprovingCurrent ? (
            <>
              <span className="loading loading-spinner loading-sm mr-2"></span>
              Approving {tokenIn}...
            </>
          ) : (
            `Approve ${tokenIn}`
          )}
        </button>
      ) : (
        <button
          onClick={handleSwap}
          disabled={
            !amountIn ||
            !outputAmount ||
            isSwapping ||
            parseFloat(amountIn) > parseFloat(currentBalance) ||
            priceImpact > 15
          }
          className="btn btn-primary btn-block btn-lg"
        >
          {isSwapping ? (
            <>
              <span className="loading loading-spinner loading-sm mr-2"></span>
              Swapping...
            </>
          ) : parseFloat(amountIn) > parseFloat(currentBalance) ? (
            `Insufficient ${tokenIn} Balance`
          ) : priceImpact > 15 ? (
            "Price Impact Too High"
          ) : (
            "Swap"
          )}
        </button>
      )}
    </div>
  );
};
