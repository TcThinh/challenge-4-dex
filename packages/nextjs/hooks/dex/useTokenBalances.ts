import { useAccount, useReadContract } from "@starknet-react/core";
import { useBalloonsContract, useSTRKContract } from "./useContracts";
import { formatUnits } from "viem";

export const useTokenBalances = () => {
  const { address } = useAccount();
  const balloonsContract = useBalloonsContract();
  const strkContract = useSTRKContract();

  // BAL balance
  const {
    data: balanceBAL,
    isLoading: isLoadingBAL,
    refetch: refetchBAL,
  } = useReadContract({
    functionName: "balance_of",
    args: address ? [address] : undefined,
    abi: balloonsContract?.abi,
    address: balloonsContract?.address,
    watch: true,
    enabled: !!address && !!balloonsContract,
  });

  // STRK balance
  const {
    data: balanceSTRK,
    isLoading: isLoadingSTRK,
    refetch: refetchSTRK,
  } = useReadContract({
    functionName: "balance_of",
    args: address ? [address] : undefined,
    abi: strkContract?.abi,
    address: strkContract?.address,
    watch: true,
    enabled: !!address && !!strkContract,
  });

  // Format balances
  const formattedBalanceBAL = balanceBAL
    ? formatUnits(BigInt(balanceBAL.toString()), 18)
    : "0";
  const formattedBalanceSTRK = balanceSTRK
    ? formatUnits(BigInt(balanceSTRK.toString()), 18)
    : "0";

  return {
    balanceBAL: formattedBalanceBAL,
    balanceSTRK: formattedBalanceSTRK,
    isLoading: isLoadingBAL || isLoadingSTRK,
    refetch: () => {
      refetchBAL();
      refetchSTRK();
    },
  };
};

export const useTokenAllowance = (spender: string, token: "BAL" | "STRK") => {
  const { address } = useAccount();
  const balloonsContract = useBalloonsContract();
  const strkContract = useSTRKContract();

  const contract = token === "BAL" ? balloonsContract : strkContract;

  const {
    data: allowance,
    isLoading,
    refetch,
  } = useReadContract({
    functionName: "allowance",
    args: address && spender ? [address, spender] : undefined,
    abi: contract?.abi,
    address: contract?.address,
    watch: true,
    enabled: !!address && !!spender && !!contract,
  });

  const formattedAllowance = allowance
    ? formatUnits(BigInt(allowance.toString()), 18)
    : "0";

  return {
    allowance: formattedAllowance,
    isLoading,
    refetch,
  };
};
