"use client";

import React from "react";
import type { MenuItem } from "./useCustomerOrder";

export function cx(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70",
        className
      )}
    >
      {children}
    </div>
  );
}

export function Button({
  children,
  onClick,
  className,
  variant = "secondary",
  disabled,
  title,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: "primary" | "secondary" | "ghost";
  disabled?: boolean;
  title?: string;
  type?: "button" | "submit";
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold " +
    "transition active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 ring-offset-white disabled:opacity-60 disabled:cursor-not-allowed";
  const variants: Record<string, string> = {
    primary:
      "bg-amber-600 text-white hover:bg-amber-700 shadow-sm shadow-amber-600/10",
    secondary:
      "bg-white text-slate-900 ring-1 ring-slate-300 hover:bg-slate-50",
    ghost: "bg-transparent text-slate-700 hover:bg-slate-100",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      className={cx(base, variants[variant], className)}
      disabled={disabled}
      title={title}
    >
      {children}
    </button>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "veg" | "hot" | "kebab" | "sea";
}) {
  const tones: Record<string, string> = {
    neutral: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
    veg: "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200",
    hot: "bg-rose-100 text-rose-900 ring-1 ring-rose-200",
    kebab: "bg-amber-100 text-amber-900 ring-1 ring-amber-200",
    sea: "bg-sky-100 text-sky-900 ring-1 ring-sky-200",
  };
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold",
        tones[tone]
      )}
    >
      {children}
    </span>
  );
}

export function tagBadges(tags?: MenuItem["tags"]) {
  if (!tags?.length) return null;

  const mapTone: Record<string, "neutral" | "veg" | "hot" | "kebab" | "sea"> = {
    Stark: "hot",
    Vegetarisk: "veg",
    Skaldjur: "sea",
    Kebab: "kebab",
    Inbakad: "neutral",
  };

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {tags.map((t) => (
        <Badge key={t} tone={mapTone[t] ?? "neutral"}>
          {t}
        </Badge>
      ))}
    </div>
  );
}
