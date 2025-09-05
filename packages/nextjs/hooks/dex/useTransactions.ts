import { useAccount } from "@starknet-react/core";
import {
  useBalloonsContract,
  useDEXContract,
  useSTRKContract,
} from "./useContracts";
import { parseUnits } from "viem";

// Helper function to convert BigInt to u256 format (low, high)
const toU256 = (value: bigint) => {
  const low = value & ((1n << 128n) - 1n);
  const high = value >> 128n;
  return [low.toString(), high.toString()];
};

export const useSwapTransactions = () => {
  const { account } = useAccount();
  const dexContract = useDEXContract();

  const executeSwap = async (
    tokenIn: "BAL" | "STRK",
    amountIn: string,
    minAmountOut: string
  ) => {
    if (!account || !dexContract) {
      throw new Error("Wallet not connected or DEX contract not available");
    }

    const amountInWei = parseUnits(amountIn, 18);
    const minAmountOutWei = parseUnits(minAmountOut, 18);

    try {
      let result;

      if (tokenIn === "BAL") {
        // BAL → STRK swap
        result = await account.execute([
          {
            contractAddress: dexContract.address,
            entrypoint: "token_to_strk",
            calldata: [...toU256(amountInWei), ...toU256(minAmountOutWei)],
          },
        ]);
      } else {
        // STRK → BAL swap
        result = await account.execute([
          {
            contractAddress: dexContract.address,
            entrypoint: "strk_to_token",
            calldata: [...toU256(amountInWei), ...toU256(minAmountOutWei)],
          },
        ]);
      }

      console.log("Swap transaction submitted:", result.transaction_hash);
      return result;
    } catch (error) {
      console.error("Swap transaction failed:", error);
      throw error;
    }
  };

  return { executeSwap };
};

export const useApprovalTransactions = () => {
  const { account } = useAccount();
  const balloonsContract = useBalloonsContract();
  const strkContract = useSTRKContract();
  const dexContract = useDEXContract();

  const approveToken = async (token: "BAL" | "STRK", amount: string) => {
    if (!account || !dexContract) {
      throw new Error("Wallet not connected or contracts not available");
    }

    const contract = token === "BAL" ? balloonsContract : strkContract;
    if (!contract) {
      throw new Error(`${token} contract not available`);
    }

    const amountWei = parseUnits(amount, 18);

    try {
      const result = await account.execute([
        {
          contractAddress: contract.address,
          entrypoint: "approve",
          calldata: [dexContract.address, ...toU256(amountWei)],
        },
      ]);

      console.log(`${token} approval submitted:`, result.transaction_hash);
      return result;
    } catch (error) {
      console.error(`${token} approval failed:`, error);
      throw error;
    }
  };

  return { approveToken };
};

export const useLiquidityTransactions = () => {
  const { account } = useAccount();
  const dexContract = useDEXContract();

  const addLiquidity = async (balAmount: string, strkAmount: string) => {
    if (!account || !dexContract) {
      throw new Error("Wallet not connected or DEX contract not available");
    }

    const balAmountWei = parseUnits(balAmount, 18);
    const strkAmountWei = parseUnits(strkAmount, 18);

    try {
      const result = await account.execute([
        {
          contractAddress: dexContract.address,
          entrypoint: "deposit",
          calldata: [...toU256(balAmountWei), ...toU256(strkAmountWei)],
        },
      ]);

      console.log(
        "Add liquidity transaction submitted:",
        result.transaction_hash
      );
      return result;
    } catch (error) {
      console.error("Add liquidity transaction failed:", error);
      throw error;
    }
  };

  const removeLiquidity = async (lpTokenAmount: string) => {
    if (!account || !dexContract) {
      throw new Error("Wallet not connected or DEX contract not available");
    }

    const lpTokenAmountWei = parseUnits(lpTokenAmount, 18);

    try {
      const result = await account.execute([
        {
          contractAddress: dexContract.address,
          entrypoint: "withdraw",
          calldata: [...toU256(lpTokenAmountWei)],
        },
      ]);

      console.log(
        "Remove liquidity transaction submitted:",
        result.transaction_hash
      );
      return result;
    } catch (error) {
      console.error("Remove liquidity transaction failed:", error);
      throw error;
    }
  };

  return { addLiquidity, removeLiquidity };
};

export const useDEXInitialization = () => {
  const { account } = useAccount();
  const dexContract = useDEXContract();

  const initializeDEX = async (balAmount: string, strkAmount: string) => {
    if (!account || !dexContract) {
      throw new Error("Wallet not connected or DEX contract not available");
    }

    const balAmountWei = parseUnits(balAmount, 18);
    const strkAmountWei = parseUnits(strkAmount, 18);

    try {
      console.log("Preparing init transaction with:", {
        balAmount,
        strkAmount,
        balAmountWei: balAmountWei.toString(),
        strkAmountWei: strkAmountWei.toString(),
        balU256: toU256(balAmountWei),
        strkU256: toU256(strkAmountWei),
      });

      const result = await account.execute([
        {
          contractAddress: dexContract.address,
          entrypoint: "init",
          calldata: [...toU256(balAmountWei), ...toU256(strkAmountWei)],
        },
      ]);

      console.log("DEX initialization submitted:", result.transaction_hash);
      return result;
    } catch (error) {
      console.error("DEX initialization failed:", error);
      throw error;
    }
  };

  return { initializeDEX };
};
