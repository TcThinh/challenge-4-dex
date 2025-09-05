"use client";

import { useState } from "react";
import { useAccount } from "@starknet-react/core";
import {
  useTokenBalances,
  useTokenAllowance,
} from "~~/hooks/dex/useTokenBalances";
import { useDEXPoolData, useUserLiquidity } from "~~/hooks/dex/useDEXPoolData";
import { useLiquidityCalculations } from "~~/hooks/dex/useSwapCalculations";
import {
  useLiquidityTransactions,
  useApprovalTransactions,
} from "~~/hooks/dex/useTransactions";
import { useDEXContract } from "~~/hooks/dex/useContracts";

export const LiquidityCard = () => {
  const { account, address } = useAccount();
  const [mode, setMode] = useState<"add" | "remove">("add");
  const [balAmount, setBalAmount] = useState("");
  const [strkAmount, setStrkAmount] = useState("");
  const [lpAmount, setLpAmount] = useState("");

  // Individual loading states for better UX
  const [isApprovingBAL, setIsApprovingBAL] = useState(false);
  const [isApprovingSTRK, setIsApprovingSTRK] = useState(false);
  const [isAddingLiquidity, setIsAddingLiquidity] = useState(false);
  const [isRemovingLiquidity, setIsRemovingLiquidity] = useState(false);

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
    totalLiquidity,
    tokenPriceInStrk,
    refetch: refetchPoolData,
  } = useDEXPoolData();
  const { userLiquidity, refetch: refetchUserLiquidity } =
    useUserLiquidity(address);

  // Transaction hooks
  const { addLiquidity, removeLiquidity } = useLiquidityTransactions();
  const { approveToken } = useApprovalTransactions();

  // Allowances
  const { allowance: balAllowance, refetch: refetchBALAllowance } =
    useTokenAllowance(dexContract?.address || "", "BAL");
  const { allowance: strkAllowance, refetch: refetchSTRKAllowance } =
    useTokenAllowance(dexContract?.address || "", "STRK");

  // Liquidity calculations
  const { lpTokens, poolShare, isValidRatio, balReceived, strkReceived } =
    useLiquidityCalculations(
      mode === "add" ? balAmount : lpAmount,
      strkAmount,
      tokenReserve,
      strkReserve,
      totalLiquidity,
      mode
    );

  // Check if approvals are needed
  const needsBALApproval =
    mode === "add" &&
    balAmount &&
    parseFloat(balAmount) > parseFloat(balAllowance);
  const needsSTRKApproval =
    mode === "add" &&
    strkAmount &&
    parseFloat(strkAmount) > parseFloat(strkAllowance);

  // Auto-calculate corresponding amounts
  const handleBALAmountChange = (value: string) => {
    setBalAmount(value);
    if (mode === "add" && value && tokenPriceInStrk > 0) {
      const correspondingSTRK = (parseFloat(value) * tokenPriceInStrk).toFixed(
        6
      );
      setStrkAmount(correspondingSTRK);
    }
  };

  const handleSTRKAmountChange = (value: string) => {
    setStrkAmount(value);
    if (mode === "add" && value && tokenPriceInStrk > 0) {
      const correspondingBAL = (parseFloat(value) / tokenPriceInStrk).toFixed(
        6
      );
      setBalAmount(correspondingBAL);
    }
  };

  const handleApprove = async (token: "BAL" | "STRK") => {
    const amount = token === "BAL" ? balAmount : strkAmount;
    if (!amount) return;

    try {
      if (token === "BAL") {
        setIsApprovingBAL(true);
      } else {
        setIsApprovingSTRK(true);
      }

      await approveToken(token, amount);

      // Refetch allowances
      if (token === "BAL") {
        setTimeout(() => refetchBALAllowance(), 1000);
      } else {
        setTimeout(() => refetchSTRKAllowance(), 1000);
      }
    } catch (error) {
      console.error(`${token} approval failed:`, error);
    } finally {
      if (token === "BAL") {
        setIsApprovingBAL(false);
      } else {
        setIsApprovingSTRK(false);
      }
    }
  };

  const handleAddLiquidity = async () => {
    if (!account || !balAmount || !strkAmount) {
      return;
    }

    try {
      setIsAddingLiquidity(true);
      await addLiquidity(balAmount, strkAmount);

      // Clear inputs and refresh data
      setBalAmount("");
      setStrkAmount("");
      refetchBalances();
      refetchPoolData();
      refetchUserLiquidity();
      refetchBALAllowance();
      refetchSTRKAllowance();
    } catch (error) {
      console.error("Add liquidity failed:", error);
    } finally {
      setIsAddingLiquidity(false);
    }
  };

  const handleRemoveLiquidity = async () => {
    if (!account || !lpAmount) {
      return;
    }

    try {
      setIsRemovingLiquidity(true);
      await removeLiquidity(lpAmount);

      // Clear inputs and refresh data
      setLpAmount("");
      refetchBalances();
      refetchPoolData();
      refetchUserLiquidity();
    } catch (error) {
      console.error("Remove liquidity failed:", error);
    } finally {
      setIsRemovingLiquidity(false);
    }
  };

  const setMaxLP = () => {
    setLpAmount(userLiquidity);
  };

  return (
    <div className="max-w-md mx-auto">
      {/* Mode Toggle */}
      <div className="tabs tabs-boxed mb-6 grid w-full grid-cols-2">
        <button
          className={`tab ${mode === "add" ? "tab-active" : ""}`}
          onClick={() => {
            setMode("add");
            setLpAmount("");
          }}
        >
          Add Liquidity
        </button>
        <button
          className={`tab ${mode === "remove" ? "tab-active" : ""}`}
          onClick={() => {
            setMode("remove");
            setBalAmount("");
            setStrkAmount("");
          }}
        >
          Remove Liquidity
        </button>
      </div>

      {mode === "add" ? (
        <div className="space-y-4">
          {/* BAL Input */}
          <div className="bg-base-200 rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-base-content/70">BAL Amount</span>
              <span className="text-sm text-base-content/70">
                Balance: {parseFloat(balanceBAL).toFixed(4)}
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <input
                type="number"
                placeholder="0.0"
                value={balAmount}
                onChange={(e) => handleBALAmountChange(e.target.value)}
                className="input input-ghost text-xl font-semibold flex-1 p-0 h-auto border-none focus:outline-none bg-transparent"
              />
              <div className="flex items-center space-x-2 bg-base-100 rounded-lg px-3 py-2">
                <span className="text-lg">🎈</span>
                <span className="font-semibold">BAL</span>
              </div>
            </div>
          </div>

          {/* Plus Icon */}
          <div className="flex justify-center">
            <div className="w-8 h-8 bg-base-300 rounded-full flex items-center justify-center">
              <span className="text-lg">+</span>
            </div>
          </div>

          {/* STRK Input */}
          <div className="bg-base-200 rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-base-content/70">STRK Amount</span>
              <span className="text-sm text-base-content/70">
                Balance: {parseFloat(balanceSTRK).toFixed(4)}
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <input
                type="number"
                placeholder="0.0"
                value={strkAmount}
                onChange={(e) => handleSTRKAmountChange(e.target.value)}
                className="input input-ghost text-xl font-semibold flex-1 p-0 h-auto border-none focus:outline-none bg-transparent"
              />
              <div className="flex items-center space-x-2 bg-base-100 rounded-lg px-3 py-2">
                <span className="text-lg">⭐</span>
                <span className="font-semibold">STRK</span>
              </div>
            </div>
          </div>

          {/* Liquidity Info */}
          {balAmount && strkAmount && (
            <div className="bg-base-200 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-base-content/70">LP Tokens</span>
                <span>{lpTokens}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-base-content/70">Pool Share</span>
                <span>{poolShare.toFixed(4)}%</span>
              </div>
              {!isValidRatio && parseFloat(totalLiquidity) > 0 && (
                <div className="alert alert-warning text-xs">
                  ⚠️ Ratio doesn&apos;t match pool ratio
                </div>
              )}
            </div>
          )}

          {/* Action Buttons for Add Liquidity */}
          {!account ? (
            <button className="btn btn-primary btn-block btn-lg" disabled>
              Connect Wallet
            </button>
          ) : needsBALApproval ? (
            <button
              onClick={() => handleApprove("BAL")}
              disabled={!balAmount || isApprovingBAL}
              className="btn btn-warning btn-block btn-lg"
            >
              {isApprovingBAL ? (
                <>
                  <span className="loading loading-spinner loading-sm mr-2"></span>
                  Approving BAL...
                </>
              ) : (
                "Approve BAL"
              )}
            </button>
          ) : needsSTRKApproval ? (
            <button
              onClick={() => handleApprove("STRK")}
              disabled={!strkAmount || isApprovingSTRK}
              className="btn btn-warning btn-block btn-lg"
            >
              {isApprovingSTRK ? (
                <>
                  <span className="loading loading-spinner loading-sm mr-2"></span>
                  Approving STRK...
                </>
              ) : (
                "Approve STRK"
              )}
            </button>
          ) : (
            <button
              onClick={handleAddLiquidity}
              disabled={
                !balAmount ||
                !strkAmount ||
                isAddingLiquidity ||
                parseFloat(balAmount) > parseFloat(balanceBAL) ||
                parseFloat(strkAmount) > parseFloat(balanceSTRK)
              }
              className="btn btn-primary btn-block btn-lg"
            >
              {isAddingLiquidity ? (
                <>
                  <span className="loading loading-spinner loading-sm mr-2"></span>
                  Adding Liquidity...
                </>
              ) : parseFloat(balAmount) > parseFloat(balanceBAL) ? (
                "Insufficient BAL Balance"
              ) : parseFloat(strkAmount) > parseFloat(balanceSTRK) ? (
                "Insufficient STRK Balance"
              ) : (
                "Add Liquidity"
              )}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* LP Token Input */}
          <div className="bg-base-200 rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-base-content/70">LP Tokens</span>
              <span className="text-sm text-base-content/70">
                Balance: {parseFloat(userLiquidity).toFixed(4)}
                <button
                  onClick={setMaxLP}
                  className="btn btn-xs btn-ghost ml-2"
                >
                  MAX
                </button>
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <input
                type="number"
                placeholder="0.0"
                value={lpAmount}
                onChange={(e) => setLpAmount(e.target.value)}
                className="input input-ghost text-xl font-semibold flex-1 p-0 h-auto border-none focus:outline-none bg-transparent"
              />
              <div className="flex items-center space-x-2 bg-base-100 rounded-lg px-3 py-2">
                {/* <span className="text-lg">💧</span> */}
                <span className="font-semibold">LP</span>
              </div>
            </div>
          </div>

          {/* Remove Info */}
          {lpAmount && (
            <div className="bg-base-200 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-base-content/70">You will receive</span>
              </div>
              <div className="flex justify-between">
                <span>🎈 BAL</span>
                <span>{balReceived}</span>
              </div>
              <div className="flex justify-between">
                <span>⭐ STRK</span>
                <span>{strkReceived}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-base-content/70">Pool Share</span>
                <span>{poolShare.toFixed(4)}%</span>
              </div>
            </div>
          )}

          <button
            onClick={handleRemoveLiquidity}
            disabled={
              !lpAmount ||
              isRemovingLiquidity ||
              parseFloat(lpAmount) > parseFloat(userLiquidity)
            }
            className="btn btn-warning btn-block btn-lg"
          >
            {!account ? (
              "Connect Wallet"
            ) : isRemovingLiquidity ? (
              <>
                <span className="loading loading-spinner loading-sm mr-2"></span>
                Removing Liquidity...
              </>
            ) : parseFloat(lpAmount) > parseFloat(userLiquidity) ? (
              "Insufficient LP Balance"
            ) : (
              "Remove Liquidity"
            )}
          </button>
        </div>
      )}

      {/* Your Position */}
      <div className="mt-6 card bg-base-200">
        <div className="card-body p-4">
          <h4 className="font-semibold mb-3">Your Position</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-base-content/70">LP Tokens</span>
              <span>{parseFloat(userLiquidity).toFixed(6)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-base-content/70">Pool Share</span>
              <span>
                {parseFloat(totalLiquidity) > 0
                  ? (
                      (parseFloat(userLiquidity) / parseFloat(totalLiquidity)) *
                      100
                    ).toFixed(4)
                  : "0.00"}
                %
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
