/**
 * TEST: Client Component — Toast & Dialog Patterns
 *
 * Tests patterns found across taxonomy, skateshop, midday, commerce.
 *
 * EXPECT TRANSLATED:
 * - DialogTitle JSX text children
 * - DialogDescription JSX text children
 * - AlertDialogTitle JSX text children
 * - AlertDialogDescription JSX text children
 * - AlertTitle, AlertDescription JSX text children
 * - Button text inside dialogs
 * - Ternary display text in buttons (e.g., "Confirm" / "Cancel")
 *
 * EXPECT SKIPPED:
 * - toast() call arguments (function call, not JSX) — KNOWN LIMITATION
 * - toast.success/error/promise arguments — KNOWN LIMITATION
 * - window.confirm() arguments — KNOWN LIMITATION
 * - data-state="open" prop
 */
"use client";

import { useState } from "react";import { useTranslations } from "next-intl";function DialogTitle({ children }: {children: React.ReactNode;}) {
  return <h2 className="text-lg font-semibold">{children}</h2>;
}

function DialogDescription({ children }: {children: React.ReactNode;}) {
  return <p className="text-sm text-gray-500">{children}</p>;
}

function AlertDialogTitle({ children }: {children: React.ReactNode;}) {
  return <h2 className="text-lg font-semibold text-red-600">{children}</h2>;
}

function AlertDialogDescription({ children }: {children: React.ReactNode;}) {
  return <p className="text-sm text-gray-500">{children}</p>;
}

function AlertTitle({ children }: {children: React.ReactNode;}) {
  return <h3 className="font-medium">{children}</h3>;
}

function AlertDescription({ children }: {children: React.ReactNode;}) {
  return <p className="text-sm text-gray-500">{children}</p>;
}

function toast(message: string, opts?: {description?: string;}) {
  void message;
  void opts;
}
toast.success = (msg: string) => void msg;
toast.error = (msg: string) => void msg;

export default function ToastsDialogsPage() {const t = useTranslations("toasts-dialogs");const [showDialog, setShowDialog] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = () => {
    // KNOWN LIMITATION: toast arguments are function calls, not JSX
    // Scanner should NOT catch these (they're not in JSX context)
    toast.success("Item deleted successfully");
    toast.error("Failed to delete item");
    toast("Check your email", {
      description: "We sent you a verification link."
    });
  };

  const handleConfirm = () => {
    // KNOWN LIMITATION: window.confirm is a function call
    if (window.confirm("Are you sure you want to proceed?")) {
      setIsDeleting(true);
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">{t("toastAndDialogPatterns")}</h1>
      <p className="text-gray-600">{t("thisPageTestsPatternsFromRealworld")}

      </p>

      {/* Dialog Title/Description — JSX text should be translated */}
      <section className="p-6 bg-white rounded-xl shadow-sm space-y-3">
        <h2 className="text-xl font-semibold">{t("dialogComponents")}</h2>

        <div className="border rounded-lg p-4 space-y-2" data-state="open">
          <DialogTitle>{t("areYouSure")}</DialogTitle>
          <DialogDescription>{t("thisActionCannotBeUndoneAll")}



          </DialogDescription>
          <div className="flex gap-2 mt-4">
            <button
              className="px-4 py-2 bg-gray-200 rounded"
              onClick={() => setShowDialog(false)}>{t("cancel")}

            </button>
            <button
              className="px-4 py-2 bg-red-600 text-white rounded"
              onClick={handleDelete}>{t("deletePermanently")}

            </button>
          </div>
        </div>
      </section>

      {/* AlertDialog — JSX text should be translated */}
      <section className="p-6 bg-white rounded-xl shadow-sm space-y-3">
        <h2 className="text-xl font-semibold">{t("alertDialog")}</h2>

        <div className="border border-red-200 rounded-lg p-4 space-y-2">
          <AlertDialogTitle>{t("deleteThisPost")}</AlertDialogTitle>
          <AlertDialogDescription>{t("thisWillPermanentlyDeleteYourPost")}



          </AlertDialogDescription>
          <div className="flex gap-2 mt-4">
            <button className="px-4 py-2 bg-gray-200 rounded">{t("keepPost")}

            </button>
            <button
              className="px-4 py-2 bg-red-600 text-white rounded"
              onClick={handleConfirm}>
              {isDeleting ? t("deleting") : t("yesDeleteIt")}
            </button>
          </div>
        </div>
      </section>

      {/* Alert component — JSX text should be translated */}
      <section className="p-6 bg-white rounded-xl shadow-sm space-y-3">
        <h2 className="text-xl font-semibold">{t("alertBanners")}</h2>

        <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
          <AlertTitle>{t("headsUp")}</AlertTitle>
          <AlertDescription>{t("thisIsADemoApplicationUsing")}



          </AlertDescription>
        </div>

        <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
          <AlertTitle>{t("rateLimitExceeded")}</AlertTitle>
          <AlertDescription>{t("youHaveReachedTheMaximumNumber")}



          </AlertDescription>
        </div>
      </section>

      {/* Toast trigger buttons — button text should translate, toast args should NOT */}
      <section className="p-6 bg-white rounded-xl shadow-sm space-y-3">
        <h2 className="text-xl font-semibold">{t("toastTriggers")}</h2>
        <p className="text-sm text-gray-500">{t("buttonTextIsTranslatableToastMessage")}



        </p>
        <div className="flex gap-3 flex-wrap">
          <button
            className="px-4 py-2 bg-green-600 text-white rounded"
            onClick={() => toast.success("Profile updated successfully")}>{t("saveChanges")}

          </button>
          <button
            className="px-4 py-2 bg-red-600 text-white rounded"
            onClick={() => toast.error("Failed to save changes")}>{t("triggerError")}

          </button>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded"
            onClick={handleConfirm}>{t("confirmAction")}

          </button>
        </div>
      </section>
    </div>);

}