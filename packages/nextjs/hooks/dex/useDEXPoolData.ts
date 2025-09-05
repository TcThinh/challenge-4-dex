import { useReadContract } from "@starknet-react/core";
import { useDEXContract } from "./useContracts";
import { formatUnits } from "viem";

export const useDEXPoolData = () => {
  const dexContract = useDEXContract();

  // Get token reserves
  const {
    data: tokenReserve,
    isLoading: isLoadingTokenReserve,
    refetch: refetchTokenReserve,
  } = useReadContract({
    functionName: "get_token_reserve",
    args: [],
    abi: dexContract?.abi,
    address: dexContract?.address,
    watch: true,
    enabled: !!dexContract,
  });

  // Get STRK reserves
  const {
    data: strkReserve,
    isLoading: isLoadingStrkReserve,
    refetch: refetchStrkReserve,
  } = useReadContract({
    functionName: "get_strk_reserve",
    args: [],
    abi: dexContract?.abi,
    address: dexContract?.address,
    watch: true,
    enabled: !!dexContract,
  });

  // Get total liquidity
  const {
    data: totalLiquidity,
    isLoading: isLoadingTotalLiquidity,
    refetch: refetchTotalLiquidity,
  } = useReadContract({
    functionName: "get_total_liquidity",
    args: [],
    abi: dexContract?.abi,
    address: dexContract?.address,
    watch: true,
    enabled: !!dexContract,
  });

  // Get current price
  const {
    data: currentPrice,
    isLoading: isLoadingCurrentPrice,
    refetch: refetchCurrentPrice,
  } = useReadContract({
    functionName: "get_current_price",
    args: [],
    abi: dexContract?.abi,
    address: dexContract?.address,
    watch: true,
    enabled: !!dexContract,
  });

  // Format the data
  const formattedTokenReserve = tokenReserve
    ? formatUnits(BigInt(tokenReserve.toString()), 18)
    : "0";
  const formattedStrkReserve = strkReserve
    ? formatUnits(BigInt(strkReserve.toString()), 18)
    : "0";
  const formattedTotalLiquidity = totalLiquidity
    ? formatUnits(BigInt(totalLiquidity.toString()), 18)
    : "0";

  // Calculate current price (token price in STRK)
  let tokenPriceInStrk = 0;
  let strkPriceInToken = 0;

  if (tokenReserve && strkReserve && BigInt(tokenReserve.toString()) > 0n) {
    const tokenReserveBN = BigInt(tokenReserve.toString());
    const strkReserveBN = BigInt(strkReserve.toString());

    // 1 BAL = ? STRK
    tokenPriceInStrk = parseFloat(
      formatUnits((strkReserveBN * BigInt(1e18)) / tokenReserveBN, 18)
    );
    // 1 STRK = ? BAL
    strkPriceInToken = parseFloat(
      formatUnits((tokenReserveBN * BigInt(1e18)) / strkReserveBN, 18)
    );
  }

  const isLoading =
    isLoadingTokenReserve ||
    isLoadingStrkReserve ||
    isLoadingTotalLiquidity ||
    isLoadingCurrentPrice;

  const refetch = () => {
    refetchTokenReserve();
    refetchStrkReserve();
    refetchTotalLiquidity();
    refetchCurrentPrice();
  };

  return {
    tokenReserve: formattedTokenReserve,
    strkReserve: formattedStrkReserve,
    totalLiquidity: formattedTotalLiquidity,
    tokenPriceInStrk,
    strkPriceInToken,
    currentPrice,
    isLoading,
    refetch,
  };
};

export const useUserLiquidity = (userAddress?: string) => {
  const dexContract = useDEXContract();

  const {
    data: userLiquidity,
    isLoading,
    refetch,
  } = useReadContract({
    functionName: "get_liquidity",
    args: userAddress ? [userAddress] : undefined,
    abi: dexContract?.abi,
    address: dexContract?.address,
    watch: true,
    enabled: !!userAddress && !!dexContract,
  });

  const formattedUserLiquidity = userLiquidity
    ? formatUnits(BigInt(userLiquidity.toString()), 18)
    : "0";

  return {
    userLiquidity: formattedUserLiquidity,
    isLoading,
    refetch,
  };
};
