import ReactMarkdown from "react-markdown";
import {
  Info, AlertTriangle, CheckCircle2, HelpCircle,
  Lightbulb, Sparkles, Stethoscope, Activity, FileText
} from "lucide-react";

/**
 * Enhanced, high-aesthetic renderer for LLM AI Responses across the application.
 * Converts markdown output into beautifully structured, professional medical-grade UI cards.
 */
export default function FormattedAIResponse({ content, className = "", theme = "sky" }) {
  if (!content || typeof content !== "string") {
    return null;
  }

  // Theme color maps for headings, callouts, and borders
  const themeColors = {
    sky: {
      heading: "text-sky-950 border-sky-500 bg-sky-50/60",
      bullet: "bg-sky-500",
      blockquote: "bg-sky-50/80 border-sky-300 text-sky-900",
      icon: "text-sky-600",
      tableHeader: "bg-sky-100/70 text-sky-900 border-sky-200",
    },
    emerald: {
      heading: "text-emerald-950 border-emerald-500 bg-emerald-50/60",
      bullet: "bg-emerald-500",
      blockquote: "bg-emerald-50/80 border-emerald-300 text-emerald-900",
      icon: "text-emerald-600",
      tableHeader: "bg-emerald-100/70 text-emerald-900 border-emerald-200",
    },
    rose: {
      heading: "text-rose-950 border-rose-500 bg-rose-50/60",
      bullet: "bg-rose-500",
      blockquote: "bg-rose-50/80 border-rose-300 text-rose-900",
      icon: "text-rose-600",
      tableHeader: "bg-rose-100/70 text-rose-900 border-rose-200",
    },
    indigo: {
      heading: "text-indigo-950 border-indigo-500 bg-indigo-50/60",
      bullet: "bg-indigo-500",
      blockquote: "bg-indigo-50/80 border-indigo-300 text-indigo-900",
      icon: "text-indigo-600",
      tableHeader: "bg-indigo-100/70 text-indigo-900 border-indigo-200",
    },
    amber: {
      heading: "text-amber-950 border-amber-500 bg-amber-50/60",
      bullet: "bg-amber-500",
      blockquote: "bg-amber-50/80 border-amber-300 text-amber-900",
      icon: "text-amber-600",
      tableHeader: "bg-amber-100/70 text-amber-900 border-amber-200",
    },
  };

  const currentTheme = themeColors[theme] || themeColors.sky;

  return (
    <div className={`formatted-ai-response space-y-3.5 text-slate-800 text-sm leading-relaxed ${className}`}>
      <ReactMarkdown
        components={{
          // Headings
          h1: ({ children }) => (
            <h1 className="text-base font-display font-bold tracking-tight text-slate-900 border-l-4 pl-3 py-1 mt-4 mb-2.5 bg-slate-50/80 rounded-r-lg border-sky-500 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-600 shrink-0" />
              <span>{children}</span>
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-sm font-display font-bold text-slate-900 border-l-3 pl-2.5 py-0.5 mt-3.5 mb-2 border-sky-500 flex items-center gap-1.5">
              <span>{children}</span>
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xs font-display font-bold uppercase tracking-wider text-slate-700 mt-3 mb-1.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
              <span>{children}</span>
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-xs font-semibold text-slate-800 mt-2 mb-1">
              {children}
            </h4>
          ),

          // Paragraphs
          p: ({ children }) => (
            <p className="mb-2.5 last:mb-0 text-slate-700 leading-relaxed font-normal">
              {children}
            </p>
          ),

          // Lists
          ul: ({ children }) => (
            <ul className="space-y-1.5 my-2.5 pl-1">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal space-y-1.5 my-2.5 pl-5 text-slate-700 font-medium">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="flex items-start gap-2 text-slate-700">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-2 shrink-0"></span>
              <div className="flex-1 min-w-0">{children}</div>
            </li>
          ),

          // Blockquotes / Callout Cards
          blockquote: ({ children }) => {
            const rawText = String(children);
            let IconComponent = Info;
            let calloutStyle = currentTheme.blockquote;

            if (rawText.toLowerCase().includes("warning") || rawText.toLowerCase().includes("alert") || rawText.toLowerCase().includes("caution")) {
              IconComponent = AlertTriangle;
              calloutStyle = "bg-amber-50/90 border-amber-300 text-amber-950";
            } else if (rawText.toLowerCase().includes("tip") || rawText.toLowerCase().includes("recommend")) {
              IconComponent = Lightbulb;
              calloutStyle = "bg-emerald-50/90 border-emerald-300 text-emerald-950";
            } else if (rawText.toLowerCase().includes("important") || rawText.toLowerCase().includes("note")) {
              IconComponent = Stethoscope;
              calloutStyle = "bg-sky-50/90 border-sky-300 text-sky-950";
            }

            return (
              <div className={`p-3.5 rounded-xl border-l-4 my-3 flex items-start gap-3 shadow-2xs ${calloutStyle}`}>
                <IconComponent className="w-4 h-4 shrink-0 mt-0.5 text-current opacity-80" />
                <div className="text-xs leading-relaxed font-medium flex-1">
                  {children}
                </div>
              </div>
            );
          },

          // Tables
          table: ({ children }) => (
            <div className="overflow-x-auto my-3 rounded-xl border border-slate-200 shadow-2xs">
              <table className="w-full text-left border-collapse text-xs">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className={`bg-slate-100/90 border-b border-slate-200 font-semibold text-slate-800 ${currentTheme.tableHeader}`}>
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-slate-100 bg-white">
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-slate-50/70 transition-colors">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className="px-3.5 py-2.5 font-semibold text-slate-900 border-b border-slate-200">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3.5 py-2 text-slate-700 border-slate-100">
              {children}
            </td>
          ),

          // Text Formatting Highlights
          strong: ({ children }) => (
            <strong className="font-semibold text-slate-900 bg-sky-50/80 px-1 py-0.5 rounded border border-sky-100/50">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-slate-800">
              {children}
            </em>
          ),

          // Code badges
          code: ({ inline, children }) => {
            if (inline) {
              return (
                <code className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-800 text-[11px] font-mono border border-slate-200">
                  {children}
                </code>
              );
            }
            return (
              <pre className="p-3 rounded-xl bg-slate-900 text-slate-100 text-xs font-mono overflow-x-auto my-2.5">
                <code>{children}</code>
              </pre>
            );
          },

          // Horizontal rule
          hr: () => <hr className="my-4 border-slate-200" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
