/**
 * Assessment layout — wraps every step of the quiz wizard (intro,
 * question pages, results, booking, confirmation) in a single
 * `<QuizProvider>` so the answer state survives client-side navigation
 * between routes. The public Header + Footer are inherited from the
 * parent `(public)` layout.
 */
import { QuizProvider } from "@/components/public/assessment/QuizContext";

export default function AssessmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <QuizProvider>{children}</QuizProvider>;
}
