import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navigation from "./components/Navigation";
import Landing from "./pages/Landing";
import Calculator from "./pages/Calculator";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import { useWallet } from "./hooks/useWallet";

const queryClient = new QueryClient();

const AppContent = () => {
  const wallet = useWallet();

  return (
    <div className="min-h-screen">
      <Navigation
        onConnectWallet={wallet.isConnected ? wallet.disconnect : wallet.connect}
        walletAddress={wallet.address}
        isConnected={wallet.isConnected}
        isConnecting={wallet.isConnecting}
        isCorrectNetwork={wallet.isCorrectNetwork}
        onSwitchNetwork={wallet.switchNetwork}
      />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/calculator" element={<Calculator />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
