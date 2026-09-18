import { useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { ps } from "./planner-ui";
export function PlanDateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const date = new Date(`${value}T12:00:00`);
  return (
    <View style={{ gap: 8 }}>
      <Text style={ps.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        style={ps.input}
        onPress={() => setOpen(!open)}
      >
        <Text style={ps.label}>
          {date.toLocaleDateString(undefined, {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </Text>
      </Pressable>
      {open && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === "ios" ? "inline" : "default"}
          themeVariant="light"
          onChange={(_, next) => {
            setOpen(Platform.OS === "ios");
            if (next)
              onChange(
                `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-${String(next.getDate()).padStart(2, "0")}`,
              );
          }}
        />
      )}
    </View>
  );
}
