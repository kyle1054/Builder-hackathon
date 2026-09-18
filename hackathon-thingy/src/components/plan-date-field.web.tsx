import { useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import "./planner-calendar.css";
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
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(true)}
        style={[ps.input, ps.row]}
      >
        <Text style={ps.label}>
          {date.toLocaleDateString(undefined, {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </Text>
        <Text style={ps.link}>⌄</Text>
      </Pressable>
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <View style={ps.scrim}>
          <View style={[ps.sheet, { maxWidth: 370 }]}>
            <View style={ps.row}>
              <Text style={ps.label}>{label}</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => setOpen(false)}
                style={ps.button}
              >
                <Text style={ps.link}>Done</Text>
              </Pressable>
            </View>
            <DayPicker
              mode="single"
              selected={date}
              defaultMonth={date}
              autoFocus
              onSelect={(next) => {
                if (next) {
                  onChange(
                    `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-${String(next.getDate()).padStart(2, "0")}`,
                  );
                  setOpen(false);
                }
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
