import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { MAP_PLACES, type MapPlace } from "@/constants/map-places";
import { Field, ps } from "./planner-ui";
import { PixelButton } from "./sidequest-ui";
export function PlacePicker({
  label,
  place,
  onChange,
}: {
  label: string;
  place: MapPlace;
  onChange: (place: MapPlace) => void;
}) {
  const [open, setOpen] = useState(false),
    [query, setQuery] = useState(""),
    [manual, setManual] = useState(false);
  const [name, setName] = useState(""),
    [lat, setLat] = useState(""),
    [lng, setLng] = useState(""),
    [error, setError] = useState("");
  const places = Object.values(MAP_PLACES).filter((p) =>
    `${p.name} ${"address" in p ? p.address : ""}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <View style={{ gap: 8 }}>
      <Text style={ps.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Choose ${label.toLowerCase()}`}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(true)}
        style={[ps.input, ps.row]}
      >
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={ps.label}>{place.name}</Text>
          {place.address && <Text style={ps.small}>{place.address}</Text>}
        </View>
        <Text style={ps.link}>⌄</Text>
      </Pressable>
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <View style={ps.scrim}>
          <View style={ps.sheet}>
            <View style={ps.row}>
              <Text style={ps.label}>{label}</Text>
              <Pressable
                accessibilityRole="button"
                style={ps.button}
                onPress={() => setOpen(false)}
              >
                <Text style={ps.link}>Done</Text>
              </Pressable>
            </View>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ gap: 12 }}
            >
              <Field
                label="Search saved places"
                value={query}
                onChangeText={setQuery}
                placeholder="Town, farm or stop"
              />
              {places.map((p) => (
                <Pressable
                  key={p.name}
                  accessibilityRole="button"
                  accessibilityState={{ selected: p.name === place.name }}
                  onPress={() => {
                    onChange(p);
                    setOpen(false);
                  }}
                  style={({ pressed }) => [
                    ps.row,
                    {
                      paddingVertical: 14,
                      borderBottomWidth: 1,
                      borderColor: "#DFE5DC",
                      opacity: pressed ? 0.6 : 1,
                    },
                  ]}
                >
                  <Text style={[ps.label, { flex: 1 }]}>{p.name}</Text>
                  <Text style={ps.link}>
                    {place.name === p.name ? "✓" : "↗"}
                  </Text>
                </Pressable>
              ))}
              {!places.length && (
                <Text style={ps.small}>
                  No saved places match. Add a custom location below.
                </Text>
              )}
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: manual }}
                style={ps.button}
                onPress={() => setManual(!manual)}
              >
                <Text style={ps.link}>
                  ＋ Custom location {manual ? "−" : ""}
                </Text>
              </Pressable>
              {manual && (
                <>
                  <Field
                    label="Place name"
                    value={name}
                    onChangeText={setName}
                  />
                  <Field
                    label="Latitude"
                    placeholder="-34.1234"
                    value={lat}
                    onChangeText={setLat}
                  />
                  <Field
                    label="Longitude"
                    placeholder="19.1234"
                    value={lng}
                    onChangeText={setLng}
                  />
                  <Text style={ps.small}>
                    Paste the coordinates from a map pin.
                  </Text>
                  {!!error && <Text style={ps.error}>{error}</Text>}
                  <PixelButton
                    label="Use this location"
                    onPress={() => {
                      const latitude = Number(lat),
                        longitude = Number(lng);
                      if (
                        !name.trim() ||
                        !lat.trim() ||
                        !lng.trim() ||
                        !Number.isFinite(latitude) ||
                        !Number.isFinite(longitude) ||
                        Math.abs(latitude) > 90 ||
                        Math.abs(longitude) > 180
                      ) {
                        setError(
                          "Enter a name and valid latitude / longitude.",
                        );
                        return;
                      }
                      onChange({
                        name: name.trim(),
                        latitude,
                        longitude,
                        span: 0.02,
                      });
                      setOpen(false);
                    }}
                  />
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
