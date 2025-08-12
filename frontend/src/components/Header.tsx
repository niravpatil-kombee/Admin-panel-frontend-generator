import { Button } from "@/components/ui/button";

export default function Header() {
  return (
    <header className="flex items-center justify-between py-3 border-b border-gray-200 bg-white shadow-sm">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold">Dashboard</h1>
      </div>
      <div className="flex items-center gap-4">
        {/* Place for profile, notifications, theme toggle */}
      </div>
    </header>
  );
}