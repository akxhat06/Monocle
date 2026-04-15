"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { User } from "@supabase/supabase-js";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

const BUCKET = "profile";
const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// ── helpers ───────────────────────────────────────────────────────────────────
function initials(name: string, email: string): string {
  const src = name.trim() || email;
  if (src.includes("@")) return src.split("@")[0].slice(0, 2).toUpperCase();
  const parts = src.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return src.slice(0, 2).toUpperCase();
}

// ── small status message ──────────────────────────────────────────────────────
type Status = { type: "success" | "error"; msg: string } | null;

function StatusBanner({ status }: { status: Status }) {
  if (!status) return null;
  return (
    <p className={`rounded-lg px-3 py-2 text-[12px] font-medium ${
      status.type === "success"
        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
        : "bg-red-500/10 text-red-400 border border-red-500/20"
    }`}>
      {status.msg}
    </p>
  );
}

// ── section wrapper ───────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#4a4a4a]">{title}</p>
      {children}
    </div>
  );
}

// ── input ─────────────────────────────────────────────────────────────────────
function Field({
  label, value, onChange, type = "text", disabled = false, placeholder = "",
}: {
  label: string; value: string; onChange?: (v: string) => void;
  type?: string; disabled?: boolean; placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-medium text-[#6a6a6a]">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className="h-9 w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 text-[13px] text-[#f0f0f0] placeholder:text-[#3a3a3a] outline-none transition focus:border-violet-500/40 focus:bg-white/[0.06] disabled:opacity-40 disabled:cursor-not-allowed"
      />
    </label>
  );
}

// ── main component ────────────────────────────────────────────────────────────
export default function UserProfilePanel({
  user,
  open,
  onClose,
  onUserUpdate,
}: {
  user: User | null;
  open: boolean;
  onClose: () => void;
  onUserUpdate: (u: User) => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createBrowserSupabaseClient();

  // ── avatar ──────────────────────────────────────────────────────────────
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarStatus, setAvatarStatus] = useState<Status>(null);

  // ── profile fields ──────────────────────────────────────────────────────
  const [displayName, setDisplayName] = useState("");
  const [profileStatus, setProfileStatus] = useState<Status>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  // ── password fields ─────────────────────────────────────────────────────
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<Status>(null);
  const [savingPassword, setSavingPassword] = useState(false);

  // Sync fields from user metadata when user/open changes
  useEffect(() => {
    if (!user) return;
    const meta = user.user_metadata ?? {};
    setDisplayName(
      (typeof meta.full_name === "string" && meta.full_name.trim()) ||
      (typeof meta.name === "string" && meta.name.trim()) ||
      ""
    );
    const existingAvatar = typeof meta.avatar_url === "string" ? meta.avatar_url : null;
    setAvatarUrl(existingAvatar);
    setAvatarPreview(null);
    setAvatarStatus(null);
    setProfileStatus(null);
    setPasswordStatus(null);
    setNewPassword("");
    setConfirmPassword("");
  }, [user, open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, onClose]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  const handleAvatarChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarStatus(null);
    if (!ALLOWED_TYPES.includes(file.type)) {
      setAvatarStatus({ type: "error", msg: "Only JPEG, PNG, WebP, or GIF images are allowed." });
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setAvatarStatus({ type: "error", msg: "Image must be under 2 MB." });
      return;
    }
    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  async function handleUploadAvatar() {
    const file = fileInputRef.current?.files?.[0];
    if (!file || !user) return;
    setUploadingAvatar(true);
    setAvatarStatus(null);
    try {
      // Upload to avatars/<userId>/avatar.<ext>
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadError) throw uploadError;

      // Try public URL first; fall back to a long-lived signed URL for private buckets
      const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path);
      console.log("[Avatar] bucket:", BUCKET, "path:", path, "publicUrl:", publicUrl);

      // Test if the public URL is accessible (bucket may be private)
      let finalUrl = publicUrl;
      try {
        const probe = await fetch(publicUrl, { method: "HEAD" });
        if (!probe.ok) throw new Error("not public");
      } catch {
        // Bucket is private — create a signed URL valid for 10 years
        const { data: signed, error: signErr } = await supabase.storage
          .from(BUCKET)
          .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
        if (signErr) throw signErr;
        finalUrl = signed.signedUrl;
      }

      const publicUrlWithBust = finalUrl;

      // Save to user_metadata + profiles table
      const { data, error: metaError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrlWithBust },
      });
      if (metaError) throw metaError;

      setAvatarUrl(publicUrlWithBust);
      setAvatarPreview(null);
      if (data.user) onUserUpdate(data.user);
      setAvatarStatus({ type: "success", msg: "Avatar updated successfully." });
    } catch (e) {
      setAvatarStatus({ type: "error", msg: e instanceof Error ? e.message : "Upload failed." });
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSaveProfile() {
    if (!user) return;
    setSavingProfile(true);
    setProfileStatus(null);
    const { data, error } = await supabase.auth.updateUser({
      data: { full_name: displayName.trim() },
    });
    setSavingProfile(false);
    if (error) { setProfileStatus({ type: "error", msg: error.message }); return; }
    if (data.user) onUserUpdate(data.user);
    setProfileStatus({ type: "success", msg: "Profile updated successfully." });
  }

  async function handleChangePassword() {
    if (!newPassword) { setPasswordStatus({ type: "error", msg: "Enter a new password." }); return; }
    if (newPassword.length < 8) { setPasswordStatus({ type: "error", msg: "Password must be at least 8 characters." }); return; }
    if (newPassword !== confirmPassword) { setPasswordStatus({ type: "error", msg: "Passwords do not match." }); return; }
    setSavingPassword(true);
    setPasswordStatus(null);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);
    if (error) { setPasswordStatus({ type: "error", msg: error.message }); return; }
    setPasswordStatus({ type: "success", msg: "Password changed successfully." });
    setNewPassword("");
    setConfirmPassword("");
  }

  const email = user?.email ?? "";
  const name = displayName || email;
  const avatarInitials = user ? initials(displayName, email) : "?";

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] transition-opacity duration-200 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={`fixed right-0 top-0 z-50 flex h-full w-[360px] flex-col bg-[#161616] border-l border-white/[0.07] shadow-2xl shadow-black/60 transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        aria-label="User profile"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <span className="text-[13px] font-semibold text-[#f0f0f0]">Account</span>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[#5a5a5a] transition hover:bg-white/[0.06] hover:text-[#c0c0c0]"
            aria-label="Close"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-7">

          {/* Avatar + identity */}
          <div className="flex items-center gap-4">
            {/* Avatar — clickable to trigger file picker */}
            <div className="group relative shrink-0">
              <div className="h-16 w-16 overflow-hidden rounded-full ring-2 ring-violet-500/25">
                {(avatarPreview ?? avatarUrl) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarPreview ?? avatarUrl!}
                    alt="Avatar"
                    className="h-full w-full object-cover"
                    onError={() => {
                      // Image failed — clear stored URL so initials fallback renders
                      setAvatarUrl(null);
                    }}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-500 to-violet-700 text-[20px] font-bold text-white select-none">
                    {avatarInitials}
                  </div>
                )}
              </div>
              {/* Camera overlay */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Change avatar"
              >
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                </svg>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-semibold text-[#f0f0f0] leading-snug">{name}</p>
              <p className="truncate text-[12px] text-[#5a5a5a] leading-snug">{email}</p>
              {/* Upload button — only shown after picking a file */}
              {avatarPreview && (
                <button
                  type="button"
                  onClick={() => void handleUploadAvatar()}
                  disabled={uploadingAvatar}
                  className="mt-2 rounded-lg bg-violet-600 px-3 py-1 text-[11px] font-semibold text-white transition hover:bg-violet-500 disabled:opacity-40"
                >
                  {uploadingAvatar ? "Uploading…" : "Upload photo"}
                </button>
              )}
              {avatarStatus && (
                <p className={`mt-1.5 text-[11px] font-medium ${avatarStatus.type === "success" ? "text-emerald-400" : "text-red-400"}`}>
                  {avatarStatus.msg}
                </p>
              )}
            </div>
          </div>

          {/* ── Profile section ─────────────────────────────────────── */}
          <Section title="Profile">
            <Field
              label="Email address"
              value={email}
              disabled
            />
            <Field
              label="Display name"
              value={displayName}
              onChange={setDisplayName}
              placeholder="Your name"
            />
            <StatusBanner status={profileStatus} />
            <button
              type="button"
              onClick={() => void handleSaveProfile()}
              disabled={savingProfile}
              className="h-9 w-full rounded-lg bg-violet-600 text-[13px] font-semibold text-white transition hover:bg-violet-500 disabled:opacity-40"
            >
              {savingProfile ? "Saving…" : "Save profile"}
            </button>
          </Section>

          {/* Divider */}
          <div className="h-px bg-white/[0.05]" />

          {/* ── Password section ─────────────────────────────────────── */}
          <Section title="Change password">
            {/* New password */}
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-medium text-[#6a6a6a]">New password</span>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="h-9 w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 pr-9 text-[13px] text-[#f0f0f0] placeholder:text-[#3a3a3a] outline-none transition focus:border-violet-500/40 focus:bg-white/[0.06]"
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#4a4a4a] hover:text-[#9a9a9a] transition"
                  tabIndex={-1}
                >
                  {showNew ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </label>

            {/* Confirm password */}
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-medium text-[#6a6a6a]">Confirm new password</span>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  className="h-9 w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 pr-9 text-[13px] text-[#f0f0f0] placeholder:text-[#3a3a3a] outline-none transition focus:border-violet-500/40 focus:bg-white/[0.06]"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#4a4a4a] hover:text-[#9a9a9a] transition"
                  tabIndex={-1}
                >
                  {showConfirm ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </label>

            <StatusBanner status={passwordStatus} />
            <button
              type="button"
              onClick={() => void handleChangePassword()}
              disabled={savingPassword}
              className="h-9 w-full rounded-lg bg-white/[0.06] border border-white/[0.08] text-[13px] font-semibold text-[#d0d0d0] transition hover:bg-white/[0.1] hover:text-white disabled:opacity-40"
            >
              {savingPassword ? "Updating…" : "Change password"}
            </button>
          </Section>

        </div>


      </div>
    </>
  );
}
