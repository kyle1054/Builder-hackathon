import { Image } from "expo-image";
import { useState } from "react";
import { avatarSource, DEMO_AVATAR_SEEDS } from "@/lib/avatar";
export function TravelerAvatar({
  seed,
  name,
  width = 46,
  height = 58,
}: {
  seed?: string | null;
  name: string;
  width?: number;
  height?: number;
}) {
  const [failed, setFailed] = useState(false);
  const hash = Array.from(seed ?? name).reduce(
    (sum, c) => sum + c.charCodeAt(0),
    0,
  );
  const fallback = avatarSource(
    DEMO_AVATAR_SEEDS[hash % DEMO_AVATAR_SEEDS.length],
  );
  return (
    <Image
      source={failed ? fallback : avatarSource(seed)}
      placeholder={fallback}
      onError={() => setFailed(true)}
      contentFit="contain"
      placeholderContentFit="contain"
      style={{ width, height }}
      accessibilityLabel={`${name} avatar`}
    />
  );
}
