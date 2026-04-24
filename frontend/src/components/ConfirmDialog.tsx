import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirmText = "Confirmer",
  cancelText = "Annuler",
  variant = "danger",
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-[400px] rounded-2xl p-6">
        <AlertDialogHeader>
          <div className="flex flex-col items-center gap-4 text-center">
            <div className={`p-3 rounded-full ${
              variant === "danger" ? "bg-red-50 text-red-500" : 
              variant === "warning" ? "bg-amber-50 text-amber-500" : 
              "bg-blue-50 text-blue-500"
            }`}>
              <AlertTriangle className="h-6 w-6" />
            </div>
            <AlertDialogTitle className="text-xl font-bold">{title}</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-sm">
              {description}
            </AlertDialogDescription>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-row gap-3 sm:justify-center mt-4">
          <AlertDialogCancel className="flex-1 rounded-xl border-none bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors">
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={`flex-1 rounded-xl text-white transition-colors ${
              variant === "danger" ? "bg-red-500 hover:bg-red-600" : 
              variant === "warning" ? "bg-amber-500 hover:bg-amber-600" : 
              "bg-primary hover:bg-primary/90"
            }`}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
