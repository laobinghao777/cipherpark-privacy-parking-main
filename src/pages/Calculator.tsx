import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Calculator as CalcIcon,
  Clock,
  DollarSign,
  Loader2,
  Lock,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/useWallet";
import { useFHE, useCalculateFee } from "@/hooks/useFHE";
import {
  getPricePerBlock,
  getBlockMinutes,
  getMaxBlocks,
  formatPrice,
  CONTRACT_ADDRESS,
} from "@/lib/contract";

interface ContractInfo {
  pricePerBlock: bigint;
  blockMinutes: number;
  maxBlocks: number;
}

const Calculator = () => {
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [contractInfo, setContractInfo] = useState<ContractInfo | null>(null);
  const [isLoadingInfo, setIsLoadingInfo] = useState(false);

  const { toast } = useToast();
  const wallet = useWallet();
  const fhe = useFHE();
  const { isCalculating, error, result, calculateFee, reset } = useCalculateFee();

  // Load contract info on mount and when connected
  useEffect(() => {
    if (wallet.isConnected && wallet.isCorrectNetwork && CONTRACT_ADDRESS) {
      loadContractInfo();
    }
  }, [wallet.isConnected, wallet.isCorrectNetwork]);

  const loadContractInfo = async () => {
    setIsLoadingInfo(true);
    try {
      const [pricePerBlock, blockMinutes, maxBlocks] = await Promise.all([
        getPricePerBlock(),
        getBlockMinutes(),
        getMaxBlocks(),
      ]);
      setContractInfo({ pricePerBlock, blockMinutes, maxBlocks });
    } catch (error) {
      console.error("Failed to load contract info:", error);
    } finally {
      setIsLoadingInfo(false);
    }
  };

  const handleCalculate = async () => {
    const h = parseInt(hours) || 0;
    const m = parseInt(minutes) || 0;
    const totalMinutes = h * 60 + m;

    if (totalMinutes <= 0) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid parking duration",
        variant: "destructive",
      });
      return;
    }

    if (!wallet.isConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    if (!wallet.isCorrectNetwork) {
      toast({
        title: "Wrong Network",
        description: "Please switch to Sepolia testnet",
        variant: "destructive",
      });
      await wallet.switchNetwork();
      return;
    }

    // Initialize FHE if needed
    if (!fhe.isInitialized) {
      await fhe.initialize();
    }

    const calcResult = await calculateFee(totalMinutes, wallet.address);

    if (calcResult) {
      toast({
        title: "Encrypted Fee Ready",
        description: `Handle: ${calcResult.feeHandle.slice(0, 10)}...`,
      });
    }
  };

  const handleReset = () => {
    setHours("");
    setMinutes("");
    reset();
  };

  const totalMinutes = (parseInt(hours) || 0) * 60 + (parseInt(minutes) || 0);
  const estimatedBlocks = contractInfo
    ? Math.ceil(totalMinutes / contractInfo.blockMinutes)
    : 0;

  return (
    <main className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">
            Calculate <span className="gradient-text">Parking Fee</span>
          </h1>
          <p className="text-muted-foreground">
            Enter your parking duration to get an encrypted quote
          </p>
        </div>

        {/* Connection Status */}
        {!wallet.isConnected && (
          <Alert className="mb-6 border-yellow-500/50 bg-yellow-500/10">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <AlertDescription>
              Please connect your wallet to use the calculator.
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

        {/* Current Rates Info */}
        <Card className="glass-card p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">Current Rates</h3>
          {isLoadingInfo ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : contractInfo ? (
            <div className="grid md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Price per Block</p>
                  <p className="font-semibold">{formatPrice(contractInfo.pricePerBlock)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Block Size</p>
                  <p className="font-semibold">{contractInfo.blockMinutes} minutes</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <CalcIcon className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Max Blocks</p>
                  <p className="font-semibold">{contractInfo.maxBlocks}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Connect wallet to load contract rates
            </p>
          )}
        </Card>

        {/* Calculator Form */}
        <Card className="glass-card p-8">
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="hours">Hours</Label>
                <Input
                  id="hours"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  className="bg-background/50"
                  disabled={isCalculating}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minutes">Minutes</Label>
                <Input
                  id="minutes"
                  type="number"
                  min="0"
                  max="59"
                  placeholder="0"
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                  className="bg-background/50"
                  disabled={isCalculating}
                />
              </div>
            </div>

            {/* Estimate Preview */}
            {totalMinutes > 0 && contractInfo && (
              <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">Estimate:</span> {totalMinutes} minutes ≈{" "}
                  {estimatedBlocks} blocks ≈{" "}
                  {formatPrice(BigInt(estimatedBlocks) * contractInfo.pricePerBlock)}
                </p>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <Alert className="border-red-500/50 bg-red-500/10">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <AlertDescription className="text-red-400">{error}</AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button
                onClick={handleCalculate}
                disabled={
                  isCalculating ||
                  !wallet.isConnected ||
                  !CONTRACT_ADDRESS ||
                  fhe.isInitializing
                }
                className="flex-1 bg-gradient-primary hover:opacity-90"
              >
                {fhe.isInitializing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Initializing FHE...
                  </>
                ) : isCalculating ? (
                  <>
                    <Lock className="mr-2 h-4 w-4 animate-pulse" />
                    Encrypting & Computing...
                  </>
                ) : (
                  <>
                    <CalcIcon className="mr-2 h-4 w-4" />
                    Calculate Fee
                  </>
                )}
              </Button>
              <Button
                onClick={handleReset}
                variant="outline"
                disabled={isCalculating}
              >
                Reset
              </Button>
            </div>

            {/* Result Display */}
            {result && (
              <div className="mt-8 p-6 rounded-xl bg-gradient-primary/10 border border-primary/20">
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span className="text-sm text-green-500 font-medium">
                      Calculation Complete
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Encrypted Fee Handle</p>
                    <p className="font-mono text-sm break-all bg-background/40 rounded-lg px-4 py-3 border border-border/40">
                      {result.feeHandle}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Store this handle to decrypt later with your preferred tooling.
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>
                      Transaction:{" "}
                      <a
                        href={`https://sepolia.etherscan.io/tx/${result.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline inline-flex items-center gap-1"
                      >
                        {result.txHash.slice(0, 10)}...{result.txHash.slice(-8)}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Privacy Note */}
            <div className="mt-6 p-4 rounded-lg bg-muted/30 border border-border/50">
              <p className="text-sm text-muted-foreground">
                <span className="text-primary font-semibold">Privacy Note:</span> Your parking
                duration is encrypted using FHE before transmission. The fee is calculated on
                encrypted data, and the dapp now returns the encrypted handle for you to decrypt on
                your own schedule.
              </p>
            </div>
          </div>
        </Card>

        {/* Process Steps */}
        <Card className="glass-card p-6 mt-8">
          <h3 className="text-lg font-semibold mb-4">How It Works</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                1
              </div>
              <div>
                <p className="font-medium">Encrypt Your Duration</p>
                <p className="text-sm text-muted-foreground">
                  Your parking time is encrypted locally using FHE before leaving your browser
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                2
              </div>
              <div>
                <p className="font-medium">Compute on Encrypted Data</p>
                <p className="text-sm text-muted-foreground">
                  The smart contract calculates your fee without ever seeing the actual duration
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                3
              </div>
              <div>
                <p className="font-medium">Receive Encrypted Handle</p>
                <p className="text-sm text-muted-foreground">
                  The app returns an encrypted fee handle so you can store it or decrypt later with
                  external tooling
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
};

export default Calculator;
