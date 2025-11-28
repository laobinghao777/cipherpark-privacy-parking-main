import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Shield, Lock, Zap, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen pt-24 pb-16">
      {/* Hero Section */}
      <section className="container mx-auto px-4 text-center mb-20">
        <div className="max-w-4xl mx-auto space-y-6">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            Private Parking Fee
            <br />
            <span className="gradient-text">Calculator</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Calculate parking fees with complete privacy using Fully Homomorphic Encryption (FHE). 
            Your parking duration remains encrypted end-to-end.
          </p>
          <div className="flex gap-4 justify-center">
            <Button
              size="lg"
              className="bg-gradient-primary hover:opacity-90 glow-effect"
              onClick={() => navigate("/calculator")}
            >
              <Zap className="mr-2 h-5 w-5" />
              Get Started
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => {
                document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 mb-20">
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="glass-card p-6 space-y-4 hover:shadow-elevated transition-all">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Complete Privacy</h3>
            <p className="text-muted-foreground">
              Your parking duration is encrypted using FHE. No one can see your raw data - not even the blockchain.
            </p>
          </Card>

          <Card className="glass-card p-6 space-y-4 hover:shadow-elevated transition-all">
            <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center">
              <Lock className="h-6 w-6 text-secondary" />
            </div>
            <h3 className="text-xl font-semibold">Encrypted Computation</h3>
            <p className="text-muted-foreground">
              Fees are calculated on encrypted data. Only you can decrypt the final result with your private key.
            </p>
          </Card>

          <Card className="glass-card p-6 space-y-4 hover:shadow-elevated transition-all">
            <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-accent" />
            </div>
            <h3 className="text-xl font-semibold">Verifiable & Transparent</h3>
            <p className="text-muted-foreground">
              All pricing logic is on-chain and publicly auditable while maintaining your privacy.
            </p>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 mb-20">
        <div className="max-w-3xl mx-auto glass-card p-8 rounded-2xl">
          <h2 className="text-3xl font-bold mb-8 text-center">How It Works</h2>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 text-primary-foreground font-bold">
                1
              </div>
              <div>
                <h4 className="font-semibold mb-2">Connect Your Wallet</h4>
                <p className="text-muted-foreground">
                  Connect your MetaMask or compatible wallet to the Sepolia testnet.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 text-primary-foreground font-bold">
                2
              </div>
              <div>
                <h4 className="font-semibold mb-2">Enter Parking Duration</h4>
                <p className="text-muted-foreground">
                  Input your parking time. The data is immediately encrypted using FHE before leaving your browser.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 text-primary-foreground font-bold">
                3
              </div>
              <div>
                <h4 className="font-semibold mb-2">Get Encrypted Quote</h4>
                <p className="text-muted-foreground">
                  Smart contract calculates the fee on encrypted data and returns an encrypted result.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 text-primary-foreground font-bold">
                4
              </div>
              <div>
                <h4 className="font-semibold mb-2">Decrypt Your Fee</h4>
                <p className="text-muted-foreground">
                  Only you can decrypt the final fee amount with your private key. Complete privacy guaranteed.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Network Info */}
      <section className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto glass-card p-6 rounded-xl text-center">
          <h3 className="text-xl font-semibold mb-4">Network Information</h3>
          <div className="space-y-2 text-muted-foreground">
            <p>Network: <span className="text-primary font-semibold">Sepolia Testnet</span></p>
            <p className="text-sm">Make sure your wallet is connected to the Sepolia network</p>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Landing;
