import { NavLink } from "./NavLink";
import { Button } from "./ui/button";
import { Wallet, Loader2, AlertTriangle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "./ui/tooltip";

interface NavigationProps {
  onConnectWallet: () => void;
  walletAddress?: string;
  isConnected: boolean;
  isConnecting?: boolean;
  isCorrectNetwork?: boolean;
  onSwitchNetwork?: () => void;
}

const Navigation = ({
  onConnectWallet,
  walletAddress,
  isConnected,
  isConnecting,
  isCorrectNetwork = true,
  onSwitchNetwork,
}: NavigationProps) => {
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <NavLink to="/" className="text-2xl font-bold gradient-text">
            CipherPark
          </NavLink>
          <div className="hidden md:flex items-center gap-6">
            <NavLink
              to="/"
              className="text-muted-foreground hover:text-foreground transition-colors"
              activeClassName="text-primary"
            >
              Home
            </NavLink>
            <NavLink
              to="/calculator"
              className="text-muted-foreground hover:text-foreground transition-colors"
              activeClassName="text-primary"
            >
              Calculate Fee
            </NavLink>
            <NavLink
              to="/admin"
              className="text-muted-foreground hover:text-foreground transition-colors"
              activeClassName="text-primary"
            >
              Admin
            </NavLink>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Network Warning */}
          {isConnected && !isCorrectNetwork && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onSwitchNetwork}
                  className="border-orange-500 text-orange-500 hover:bg-orange-500/10"
                >
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  Wrong Network
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Click to switch to Sepolia Testnet</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Wallet Button */}
          <Button
            onClick={onConnectWallet}
            variant={isConnected ? "outline" : "default"}
            className={isConnected ? "" : "bg-gradient-primary hover:opacity-90"}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Wallet className="mr-2 h-4 w-4" />
                {isConnected ? formatAddress(walletAddress!) : "Connect Wallet"}
              </>
            )}
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
