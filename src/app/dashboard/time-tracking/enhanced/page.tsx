import { Metadata } from "next";
import EnhancedTimeTracker from "@/components/time-tracking/EnhancedTimeTracker";

export const metadata: Metadata = {
  title: "Enhanced Time Tracking - JobFlow",
  description:
    "Advanced time tracking with compensation time and shortage detection",
};

export default function EnhancedTimeTrackingPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <EnhancedTimeTracker />
    </div>
  );
}
