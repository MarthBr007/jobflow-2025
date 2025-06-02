import { useState, useCallback } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { AlertTriangle, Trash2, CheckCircle, Info } from "lucide-react";

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "success" | "info";
}

interface ConfirmState {
  isOpen: boolean;
  options: ConfirmOptions;
  resolve: ((value: boolean) => void) | null;
  isLoading: boolean;
}

export const useConfirm = () => {
  const [state, setState] = useState<ConfirmState>({
    isOpen: false,
    options: { message: "" },
    resolve: null,
    isLoading: false,
  });

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({
        isOpen: true,
        options,
        resolve,
        isLoading: false,
      });
    });
  }, []);

  const handleConfirm = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));

    // Small delay to show loading state
    await new Promise((resolve) => setTimeout(resolve, 300));

    setState((prev) => ({ ...prev, isOpen: false, isLoading: false }));
    state.resolve?.(true);
  }, [state.resolve]);

  const handleCancel = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false, isLoading: false }));
    state.resolve?.(false);
  }, [state.resolve]);

  const getIcon = () => {
    switch (state.options.type) {
      case "danger":
        return <Trash2 className="h-6 w-6 text-red-600" />;
      case "warning":
        return <AlertTriangle className="h-6 w-6 text-yellow-600" />;
      case "success":
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case "info":
        return <Info className="h-6 w-6 text-blue-600" />;
      default:
        return <AlertTriangle className="h-6 w-6 text-yellow-600" />;
    }
  };

  const getConfirmButtonStyle = () => {
    switch (state.options.type) {
      case "danger":
        return "bg-red-600 hover:bg-red-700 text-white";
      case "warning":
        return "bg-yellow-600 hover:bg-yellow-700 text-white";
      case "success":
        return "bg-green-600 hover:bg-green-700 text-white";
      case "info":
        return "bg-blue-600 hover:bg-blue-700 text-white";
      default:
        return "bg-yellow-600 hover:bg-yellow-700 text-white";
    }
  };

  const getDefaultTitle = () => {
    switch (state.options.type) {
      case "danger":
        return "Verwijderen bevestigen";
      case "warning":
        return "Actie bevestigen";
      case "success":
        return "Succes bevestigen";
      case "info":
        return "Informatie";
      default:
        return "Bevestigen";
    }
  };

  const getModalType = () => {
    switch (state.options.type) {
      case "danger":
        return "error";
      case "warning":
        return "warning";
      case "success":
        return "success";
      case "info":
        return "info";
      default:
        return "warning";
    }
  };

  const ConfirmModal = useCallback(() => {
    if (!state.isOpen) return null;

    return (
      <Modal
        isOpen={state.isOpen}
        onClose={handleCancel}
        title={state.options.title || getDefaultTitle()}
        type={getModalType()}
        size="sm"
        preventClose={state.isLoading}
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            {getIcon()}
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed flex-1">
              {state.options.message}
            </p>
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2 pt-4">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={state.isLoading}
              className="w-full sm:w-auto"
            >
              {state.options.cancelText || "Annuleren"}
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={state.isLoading}
              className={`w-full sm:w-auto ${getConfirmButtonStyle()}`}
            >
              {state.isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Bezig...
                </div>
              ) : (
                state.options.confirmText || "Bevestigen"
              )}
            </Button>
          </div>
        </div>
      </Modal>
    );
  }, [state, handleConfirm, handleCancel]);

  return {
    confirm,
    ConfirmModal,
  };
};
