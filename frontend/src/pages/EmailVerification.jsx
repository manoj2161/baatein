import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, XCircle, Mail, ArrowRight } from "lucide-react";

import logo from "../assets/logo.png";

export default function EmailVerification() {
  const [searchParams] = useSearchParams();

  const status = searchParams.get("status");
  const isSuccess = status === "success";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fafafa] px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-7 text-center shadow-sm sm:p-9">
        <img
          src={logo}
          alt="Baatein"
          className="mx-auto mb-5 h-16 w-16 object-contain"
        />

        <h1 className="mb-7 text-2xl font-bold text-gray-900">baatein</h1>

        <div
          className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full ${
            isSuccess ? "bg-green-50" : "bg-red-50"
          }`}
        >
          {isSuccess ? (
            <CheckCircle2 size={34} className="text-green-600" />
          ) : (
            <XCircle size={34} className="text-red-500" />
          )}
        </div>

        <h2 className="mb-3 text-xl font-bold text-gray-900">
          {isSuccess
            ? "Email verified successfully"
            : "Verification unsuccessful"}
        </h2>

        <p className="mb-7 text-sm leading-6 text-gray-500">
          {isSuccess
            ? "Your Baatein account email address has been updated successfully."
            : status === "invalid"
              ? "This verification link is invalid, expired, or has already been used. Return to Settings and request a new verification link."
              : "We couldn't determine the verification result. Please return to Settings and check your email address."}
        </p>

        <Link
          to="/login"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#315efb] px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Continue to login
          <ArrowRight size={17} />
        </Link>

        <p className="mt-5 flex items-center justify-center gap-2 text-xs text-gray-400">
          <Mail size={14} />
          Baatein account security
        </p>
      </div>
    </main>
  );
}
