import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Settings,
  DollarSign,
  Clock,
  Shield,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/useWallet";
import {
  getContractVersion,
  getContractOwner,
  getPricePerBlock,
  getMaxBlocks,
  getBlockMinutes,
  setPricePerBlock as updatePricePerBlock,
  setMaxBlocks as updateMaxBlocks,
  transferOwnership as contractTransferOwnership,
  formatPrice,
  CONTRACT_ADDRESS,
} from "@/lib/contract";

interface ContractInfo {
  version: string;
  owner: string;
  pricePerBlock: bigint;
  maxBlocks: number;
  blockMinutes: number;
}

const Admin = () => {
  const [contractInfo, setContractInfo] = useState<ContractInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const [newPrice, setNewPrice] = useState("");
  const [newMaxBlocks, setNewMaxBlocks] = useState("");
  const [newOwner, setNewOwner] = useState("");

  const { toast } = useToast();
  const wallet = useWallet();

  const isOwner =
    wallet.isConnected &&
    contractInfo?.owner &&
    wallet.address.toLowerCase() === contractInfo.owner.toLowerCase();

  // Load contract info
  useEffect(() => {
    if (wallet.isConnected && wallet.isCorrectNetwork && CONTRACT_ADDRESS) {
      loadContractInfo();
    }
  }, [wallet.isConnected, wallet.isCorrectNetwork]);

  const loadContractInfo = async () => {
    setIsLoading(true);
    try {
      const [version, owner, pricePerBlock, maxBlocks, blockMinutes] = await Promise.all([
        getContractVersion(),
        getContractOwner(),
        getPricePerBlock(),
        getMaxBlocks(),
        getBlockMinutes(),
      ]);

      setContractInfo({
        version,
        owner,
        pricePerBlock,
        maxBlocks,
        blockMinutes,
      });

      // Set form defaults
      setNewPrice((Number(pricePerBlock) / 100).toString());
      setNewMaxBlocks(maxBlocks.toString());
    } catch (error) {
      console.error("Failed to load contract info:", error);
      toast({
        title: "Error",
        description: "Failed to load contract information",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePrice = async () => {
    const priceInCents = Math.round(parseFloat(newPrice) * 100);
    if (isNaN(priceInCents) || priceInCents <= 0) {
      toast({
        title: "Invalid Price",
        description: "Please enter a valid price greater than 0",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating("price");
    try {
      const txHash = await updatePricePerBlock(priceInCents);
      toast({
        title: "Price Updated",
        description: (
          <span>
            Transaction:{" "}
            <a
              href={`https://sepolia.etherscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              View on Etherscan
            </a>
          </span>
        ),
      });
      await loadContractInfo();
    } catch (error: any) {
      console.error("Failed to update price:", error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update price",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(null);
    }
  };

  const handleUpdateMaxBlocks = async () => {
    const blocks = parseInt(newMaxBlocks);
    if (isNaN(blocks) || blocks <= 0) {
      toast({
        title: "Invalid Value",
        description: "Please enter a valid number greater than 0",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating("maxBlocks");
    try {
      const txHash = await updateMaxBlocks(blocks);
      toast({
        title: "Max Blocks Updated",
        description: (
          <span>
            Transaction:{" "}
            <a
              href={`https://sepolia.etherscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              View on Etherscan
            </a>
          </span>
        ),
      });
      await loadContractInfo();
    } catch (error: any) {
      console.error("Failed to update max blocks:", error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update max blocks",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(null);
    }
  };

  const handleTransferOwnership = async () => {
    if (!newOwner || !newOwner.startsWith("0x") || newOwner.length !== 42) {
      toast({
        title: "Invalid Address",
        description: "Please enter a valid Ethereum address",
        variant: "destructive",
      });
      return;
    }

    // Confirm dangerous action
    if (!window.confirm("Are you sure you want to transfer ownership? This action is irreversible!")) {
      return;
    }

    setIsUpdating("ownership");
    try {
      const txHash = await contractTransferOwnership(newOwner);
      toast({
        title: "Ownership Transferred",
        description: (
          <span>
            Transaction:{" "}
            <a
              href={`https://sepolia.etherscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              View on Etherscan
            </a>
          </span>
        ),
      });
      setNewOwner("");
      await loadContractInfo();
    } catch (error: any) {
      console.error("Failed to transfer ownership:", error);
      toast({
        title: "Transfer Failed",
        description: error.message || "Failed to transfer ownership",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(null);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <main className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">
            <span className="gradient-text">Admin Dashboard</span>
          </h1>
          <p className="text-muted-foreground">Manage contract settings and pricing</p>
        </div>

        {/* Connection Status */}
        {!wallet.isConnected && (
          <Alert className="mb-6 border-yellow-500/50 bg-yellow-500/10">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <AlertDescription>
              Please connect your wallet to access admin functions.
              <Button
                variant="link"
                className="text-yellow-500 p-0 ml-2 h-auto"
                onClick={wallet.connect}
              >
                Connect Wallet
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {wallet.isConnected && !wallet.isCorrectNetwork && (
          <Alert className="mb-6 border-orange-500/50 bg-orange-500/10">
            <AlertCircle className="h-4 w-4 text-orange-500" />
            <AlertDescription>
              Please switch to Sepolia testnet.
              <Button
                variant="link"
                className="text-orange-500 p-0 ml-2 h-auto"
                onClick={wallet.switchNetwork}
              >
                Switch Network
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {!CONTRACT_ADDRESS && (
          <Alert className="mb-6 border-red-500/50 bg-red-500/10">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <AlertDescription>
              Contract address not configured. Please set VITE_CONTRACT_ADDRESS in your environment.
            </AlertDescription>
          </Alert>
        )}

        {wallet.isConnected && contractInfo && !isOwner && (
          <Alert className="mb-8 border-destructive/50 bg-destructive/10">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You are not the contract owner. All write operations are disabled.
              <br />
              Current owner: <span className="font-mono">{formatAddress(contractInfo.owner)}</span>
            </AlertDescription>
          </Alert>
        )}

        {wallet.isConnected && contractInfo && isOwner && (
          <Alert className="mb-8 border-green-500/50 bg-green-500/10">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-400">
              You are the contract owner. All admin functions are available.
            </AlertDescription>
          </Alert>
        )}

        {/* Contract Info */}
        <Card className="glass-card p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Contract Information
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadContractInfo}
              disabled={isLoading || !wallet.isConnected}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : contractInfo ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Contract Version</span>
                <span className="font-mono font-semibold">{contractInfo.version}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Owner Address</span>
                <a
                  href={`https://sepolia.etherscan.io/address/${contractInfo.owner}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono font-semibold text-primary hover:underline inline-flex items-center gap-1"
                >
                  {formatAddress(contractInfo.owner)}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Contract Address</span>
                <a
                  href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono font-semibold text-primary hover:underline inline-flex items-center gap-1"
                >
                  {formatAddress(CONTRACT_ADDRESS)}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Network</span>
                <span className="font-semibold text-primary">Sepolia Testnet</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Block Size</span>
                <span className="font-semibold">{contractInfo.blockMinutes} minutes</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Connect wallet to load contract information
            </p>
          )}
        </Card>

        {/* Price Configuration */}
        <Card className="glass-card p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Price Configuration
          </h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pricePerBlock">Price per Block (USD)</Label>
              <div className="flex gap-4">
                <Input
                  id="pricePerBlock"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  disabled={!isOwner || isUpdating !== null}
                  className="bg-background/50"
                />
                <Button
                  onClick={handleUpdatePrice}
                  disabled={!isOwner || isUpdating !== null}
                  className="bg-gradient-primary hover:opacity-90"
                >
                  {isUpdating === "price" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Update"
                  )}
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Current rate: {contractInfo ? formatPrice(contractInfo.pricePerBlock) : "--"} per
              block. This affects all new parking fee calculations.
            </p>
          </div>
        </Card>

        {/* Max Blocks Configuration */}
        <Card className="glass-card p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-secondary" />
            Maximum Blocks
          </h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="maxBlocks">Maximum Billable Blocks</Label>
              <div className="flex gap-4">
                <Input
                  id="maxBlocks"
                  type="number"
                  min="1"
                  value={newMaxBlocks}
                  onChange={(e) => setNewMaxBlocks(e.target.value)}
                  disabled={!isOwner || isUpdating !== null}
                  className="bg-background/50"
                />
                <Button
                  onClick={handleUpdateMaxBlocks}
                  disabled={!isOwner || isUpdating !== null}
                  className="bg-gradient-primary hover:opacity-90"
                >
                  {isUpdating === "maxBlocks" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Update"
                  )}
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Current maximum: {contractInfo?.maxBlocks ?? "--"} blocks (
              {contractInfo ? contractInfo.maxBlocks * contractInfo.blockMinutes : "--"} minutes).
            </p>
          </div>
        </Card>

        {/* Transfer Ownership */}
        <Card className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Settings className="h-5 w-5 text-accent" />
            Transfer Ownership
          </h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newOwner">New Owner Address</Label>
              <div className="flex gap-4">
                <Input
                  id="newOwner"
                  type="text"
                  placeholder="0x..."
                  value={newOwner}
                  onChange={(e) => setNewOwner(e.target.value)}
                  disabled={!isOwner || isUpdating !== null}
                  className="bg-background/50 font-mono"
                />
                <Button
                  onClick={handleTransferOwnership}
                  disabled={!isOwner || isUpdating !== null}
                  variant="destructive"
                >
                  {isUpdating === "ownership" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Transfer"
                  )}
                </Button>
              </div>
            </div>
            <p className="text-sm text-destructive">
              ⚠️ Warning: Transferring ownership is irreversible. Make sure you trust the new
              owner address.
            </p>
          </div>
        </Card>
      </div>
    </main>
  );
};

export default Admin;
