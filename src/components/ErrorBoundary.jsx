import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, Home } from "lucide-react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <Card className="p-8 max-w-md w-full text-center shadow-lg border-rose-200">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-display font-bold text-slate-900 mb-2">Application Notice</h1>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              The application encountered a temporary display issue. Click below to reload.
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => window.location.reload()}
                className="bg-sky-600 hover:bg-sky-700 text-white font-medium"
              >
                <RefreshCw className="w-4 h-4 mr-2" /> Reload Page
              </Button>
              <Button
                variant="outline"
                onClick={() => { window.location.href = "/"; }}
              >
                <Home className="w-4 h-4 mr-2" /> Go to Home
              </Button>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
