import { useMemo } from "react";
import { parseUnits } from "viem";

export const useSwapCalculations = (
  inputAmount: string,
  tokenIn: "BAL" | "STRK",
  tokenReserve: string,
  strkReserve: string
) => {
  return useMemo(() => {
    if (
      !inputAmount ||
      parseFloat(inputAmount) <= 0 ||
      !tokenReserve ||
      !strkReserve
    ) {
      return {
        outputAmount: "0",
        priceImpact: 0,
        minimumReceived: "0",
        route: tokenIn === "BAL" ? "BAL → STRK" : "STRK → BAL",
      };
    }

    try {
      const inputAmountWei = parseUnits(inputAmount, 18);
      const tokenReserveWei = parseUnits(tokenReserve, 18);
      const strkReserveWei = parseUnits(strkReserve, 18);

      const fee = 3n; // 0.3% fee
      const feeDenominator = 1000n;

      let outputAmountWei: bigint;
      let inputReserve: bigint;
      let outputReserve: bigint;

      if (tokenIn === "BAL") {
        // BAL → STRK
        inputReserve = tokenReserveWei;
        outputReserve = strkReserveWei;
      } else {
        // STRK → BAL
        inputReserve = strkReserveWei;
        outputReserve = tokenReserveWei;
      }

      // Constant product formula with fee: (x + Δx * (1 - fee)) * (y - Δy) = x * y
      // Δy = (y * Δx * (1 - fee)) / (x + Δx * (1 - fee))
      const inputWithFee =
        (inputAmountWei * (feeDenominator - fee)) / feeDenominator;
      outputAmountWei =
        (outputReserve * inputWithFee) / (inputReserve + inputWithFee);

      const outputAmount = (Number(outputAmountWei) / 1e18).toFixed(6);

      // Calculate price impact
      const spotPriceBefore = Number(outputReserve) / Number(inputReserve);
      const spotPriceAfter =
        Number(outputReserve - outputAmountWei) /
        Number(inputReserve + inputAmountWei);
      const priceImpact =
        Math.abs((spotPriceBefore - spotPriceAfter) / spotPriceBefore) * 100;

      // Calculate minimum received with 0.5% slippage tolerance
      const slippageTolerance = 0.005; // 0.5%
      const minimumReceived = (
        parseFloat(outputAmount) *
        (1 - slippageTolerance)
      ).toFixed(6);

      return {
        outputAmount,
        priceImpact: Math.min(priceImpact, 100), // Cap at 100%
        minimumReceived,
        route: tokenIn === "BAL" ? "BAL → STRK" : "STRK → BAL",
      };
    } catch (error) {
      console.error("Swap calculation error:", error);
      return {
        outputAmount: "0",
        priceImpact: 0,
        minimumReceived: "0",
        route: tokenIn === "BAL" ? "BAL → STRK" : "STRK → BAL",
      };
    }
  }, [inputAmount, tokenIn, tokenReserve, strkReserve]);
};

export const useLiquidityCalculations = (
  balAmount: string,
  strkAmount: string,
  tokenReserve: string,
  strkReserve: string,
  totalLiquidity: string,
  mode: "add" | "remove"
) => {
  return useMemo(() => {
    if (mode === "add") {
      if (
        !balAmount ||
        !strkAmount ||
        parseFloat(balAmount) <= 0 ||
        parseFloat(strkAmount) <= 0
      ) {
        return {
          lpTokens: "0",
          poolShare: 0,
          isValidRatio: true,
        };
      }

      try {
        const balAmountWei = parseUnits(balAmount, 18);
        const strkAmountWei = parseUnits(strkAmount, 18);
        const tokenReserveWei = parseUnits(tokenReserve || "0", 18);
        const strkReserveWei = parseUnits(strkReserve || "0", 18);
        const totalLiquidityWei = parseUnits(totalLiquidity || "0", 18);

        let lpTokensWei: bigint;

        if (totalLiquidityWei === 0n) {
          // First liquidity provision - geometric mean
          lpTokensWei = sqrt(balAmountWei * strkAmountWei);
        } else {
          // Subsequent liquidity provision - maintain ratio
          const balLiquidity =
            (balAmountWei * totalLiquidityWei) / tokenReserveWei;
          const strkLiquidity =
            (strkAmountWei * totalLiquidityWei) / strkReserveWei;
          lpTokensWei =
            balLiquidity < strkLiquidity ? balLiquidity : strkLiquidity;
        }

        const lpTokens = (Number(lpTokensWei) / 1e18).toFixed(6);
        const newTotalLiquidity =
          Number(totalLiquidityWei + lpTokensWei) / 1e18;
        const poolShare =
          (Number(lpTokensWei) / 1e18 / newTotalLiquidity) * 100;

        // Check if ratio is approximately correct (within 5%)
        const expectedRatio =
          tokenReserveWei > 0n
            ? Number(strkReserveWei) / Number(tokenReserveWei)
            : 0;
        const providedRatio = parseFloat(strkAmount) / parseFloat(balAmount);
        const isValidRatio =
          totalLiquidityWei === 0n ||
          Math.abs(expectedRatio - providedRatio) / expectedRatio < 0.05;

        return {
          lpTokens,
          poolShare,
          isValidRatio,
        };
      } catch (error) {
        console.error("Liquidity calculation error:", error);
        return {
          lpTokens: "0",
          poolShare: 0,
          isValidRatio: false,
        };
      }
    } else {
      // Remove liquidity mode
      if (!balAmount || parseFloat(balAmount) <= 0) {
        return {
          balReceived: "0",
          strkReceived: "0",
          poolShare: 0,
        };
      }

      try {
        const lpTokensWei = parseUnits(balAmount, 18); // balAmount is LP tokens in remove mode
        const tokenReserveWei = parseUnits(tokenReserve || "0", 18);
        const strkReserveWei = parseUnits(strkReserve || "0", 18);
        const totalLiquidityWei = parseUnits(totalLiquidity || "0", 18);

        if (totalLiquidityWei === 0n) {
          return {
            balReceived: "0",
            strkReceived: "0",
            poolShare: 0,
          };
        }

        const balReceivedWei =
          (lpTokensWei * tokenReserveWei) / totalLiquidityWei;
        const strkReceivedWei =
          (lpTokensWei * strkReserveWei) / totalLiquidityWei;

        const balReceived = (Number(balReceivedWei) / 1e18).toFixed(6);
        const strkReceived = (Number(strkReceivedWei) / 1e18).toFixed(6);
        const poolShare =
          (Number(lpTokensWei) / Number(totalLiquidityWei)) * 100;

        return {
          balReceived,
          strkReceived,
          poolShare,
        };
      } catch (error) {
        console.error("Remove liquidity calculation error:", error);
        return {
          balReceived: "0",
          strkReceived: "0",
          poolShare: 0,
        };
      }
    }
  }, [balAmount, strkAmount, tokenReserve, strkReserve, totalLiquidity, mode]);
};

// Helper function for square root calculation
function sqrt(value: bigint): bigint {
  if (value < 0n) {
    throw new Error("Square root of negative number");
  }
  if (value < 2n) {
    return value;
  }

  let x = value;
  let y = (value + 1n) / 2n;
  while (y < x) {
    x = y;
    y = (x + value / x) / 2n;
  }
  return x;
}
