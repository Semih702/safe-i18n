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

import { useState } from "react";function DialogTitle({ children }: {children: React.ReactNode;}) {
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

export default function ToastsDialogsPage() {  const [showDialog, setShowDialog] = useState(false);
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
      <h1 className="text-3xl font-bold">Toast and Dialog Patterns</h1>
      <p className="text-gray-600">This page tests patterns from real-world dialog and notification usage.

      </p>

      {/* Dialog Title/Description — JSX text should be translated */}
      <section className="p-6 bg-white rounded-xl shadow-sm space-y-3">
        <h2 className="text-xl font-semibold">Dialog Components</h2>

        <div className="border rounded-lg p-4 space-y-2" data-state="open">
          <DialogTitle>Are you sure?</DialogTitle>
          <DialogDescription>This action cannot be undone. All of your data will be permanently
            removed.


          </DialogDescription>
          <div className="flex gap-2 mt-4">
            <button
              className="px-4 py-2 bg-gray-200 rounded"
              onClick={() => setShowDialog(false)}>Cancel

            </button>
            <button
              className="px-4 py-2 bg-red-600 text-white rounded"
              onClick={handleDelete}>Delete permanently

            </button>
          </div>
        </div>
      </section>

      {/* AlertDialog — JSX text should be translated */}
      <section className="p-6 bg-white rounded-xl shadow-sm space-y-3">
        <h2 className="text-xl font-semibold">Alert Dialog</h2>

        <div className="border border-red-200 rounded-lg p-4 space-y-2">
          <AlertDialogTitle>Delete this post?</AlertDialogTitle>
          <AlertDialogDescription>This will permanently delete your post and remove all associated
            data.


          </AlertDialogDescription>
          <div className="flex gap-2 mt-4">
            <button className="px-4 py-2 bg-gray-200 rounded">Keep post

            </button>
            <button
              className="px-4 py-2 bg-red-600 text-white rounded"
              onClick={handleConfirm}>
              {isDeleting ? "Deleting..." : "Yes, delete it"}
            </button>
          </div>
        </div>
      </section>

      {/* Alert component — JSX text should be translated */}
      <section className="p-6 bg-white rounded-xl shadow-sm space-y-3">
        <h2 className="text-xl font-semibold">Alert Banners</h2>

        <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
          <AlertTitle>Heads up!</AlertTitle>
          <AlertDescription>This is a demo application using a test environment. No real
            transactions will be processed.


          </AlertDescription>
        </div>

        <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
          <AlertTitle>Rate limit exceeded</AlertTitle>
          <AlertDescription>You have reached the maximum number of requests. Please try again
            later.


          </AlertDescription>
        </div>
      </section>

      {/* Toast trigger buttons — button text should translate, toast args should NOT */}
      <section className="p-6 bg-white rounded-xl shadow-sm space-y-3">
        <h2 className="text-xl font-semibold">Toast Triggers</h2>
        <p className="text-sm text-gray-500">Button text is translatable. Toast message arguments are a known
          limitation.


        </p>
        <div className="flex gap-3 flex-wrap">
          <button
            className="px-4 py-2 bg-green-600 text-white rounded"
            onClick={() => toast.success("Profile updated successfully")}>Save changes

          </button>
          <button
            className="px-4 py-2 bg-red-600 text-white rounded"
            onClick={() => toast.error("Failed to save changes")}>Trigger error

          </button>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded"
            onClick={handleConfirm}>Confirm action

          </button>
        </div>
      </section>
    </div>);

}