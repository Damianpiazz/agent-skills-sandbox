import { useEffect, useState, useCallback } from "react"
import { StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert, TextInput, Modal, ActivityIndicator } from "react-native"
import { ThemedText } from "@/components/themed-text"
import { ThemedView } from "@/components/themed-view"
import { api } from "@/lib/api"
import { Colors } from "@/constants/theme"
import { useColorScheme } from "@/hooks/use-color-scheme"
import type { Habit, HabitFrequency } from "@/shared/types/habit"

export default function HabitsScreen() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [frequency, setFrequency] = useState<HabitFrequency>("daily")
  const [submitting, setSubmitting] = useState(false)
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? "light"]

  const fetchHabits = useCallback(async () => {
    const res = await api.get<Habit[]>("/habits")
    if (res.success && res.data) setHabits(res.data)
  }, [])

  useEffect(() => {
    fetchHabits()
  }, [fetchHabits])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchHabits()
    setRefreshing(false)
  }, [fetchHabits])

  async function handleCreate() {
    if (!name.trim()) {
      Alert.alert("Error", "Name is required")
      return
    }

    setSubmitting(true)
    const res = await api.post<Habit>("/habits", {
      name: name.trim(),
      description: description.trim(),
      frequency,
    })
    setSubmitting(false)

    if (res.success) {
      setShowModal(false)
      setName("")
      setDescription("")
      setFrequency("daily")
      fetchHabits()
    } else {
      Alert.alert("Error", res.error || "Failed to create habit")
    }
  }

  async function handleComplete(habitId: string) {
    await api.post(`/habits/${habitId}/complete`, {})
    fetchHabits()
  }

  async function handleUncomplete(habitId: string) {
    await api.delete(`/habits/${habitId}/complete`)
    fetchHabits()
  }

  async function handleDelete(habitId: string) {
    Alert.alert("Delete Habit", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await api.delete(`/habits/${habitId}`)
          fetchHabits()
        },
      },
    ])
  }

  const today = new Date().toISOString().slice(0, 10)
  const frequencyOptions: HabitFrequency[] = ["daily", "weekly", "weekdays", "weekends"]

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <ThemedView style={styles.header}>
        <ThemedText type="title">Habits</ThemedText>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.tint }]}
          onPress={() => setShowModal(true)}
        >
          <ThemedText style={styles.addButtonText}>+ New</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      {habits.length === 0 && (
        <ThemedView style={styles.empty}>
          <ThemedText style={styles.emptyText}>No habits yet. Create your first one!</ThemedText>
        </ThemedView>
      )}

      {habits.map((habit) => (
        <ThemedView key={habit.id} style={styles.habitCard}>
          <ThemedView style={styles.habitHeader}>
            <ThemedView style={{ flex: 1 }}>
              <ThemedText type="defaultSemiBold">{habit.name}</ThemedText>
              {habit.description ? (
                <ThemedText style={styles.habitDesc}>{habit.description}</ThemedText>
              ) : null}
              <ThemedText style={styles.habitMeta}>
                {habit.frequency} · Streak: {habit.streak} days
              </ThemedText>
            </ThemedView>
            <TouchableOpacity
              style={[
                styles.completeButton,
                { backgroundColor: colors.tint },
              ]}
              onPress={() => handleComplete(habit.id)}
            >
              <ThemedText style={styles.completeButtonText}>+</ThemedText>
            </TouchableOpacity>
          </ThemedView>
          <TouchableOpacity onPress={() => handleDelete(habit.id)}>
            <ThemedText style={styles.deleteText}>Delete</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      ))}

      <Modal visible={showModal} animationType="slide" transparent>
        <ThemedView style={styles.modalOverlay}>
          <ThemedView style={styles.modalContent}>
            <ThemedText type="subtitle" style={styles.modalTitle}>New Habit</ThemedText>

            <TextInput
              style={styles.input}
              placeholder="Habit name"
              placeholderTextColor="#999"
              value={name}
              onChangeText={setName}
            />

            <TextInput
              style={styles.input}
              placeholder="Description (optional)"
              placeholderTextColor="#999"
              value={description}
              onChangeText={setDescription}
            />

            <ThemedText style={styles.label}>Frequency</ThemedText>
            <ThemedView style={styles.freqRow}>
              {frequencyOptions.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.freqOption,
                    frequency === opt && { backgroundColor: colors.tint },
                  ]}
                  onPress={() => setFrequency(opt)}
                >
                  <ThemedText
                    style={[
                      styles.freqText,
                      frequency === opt && { color: "#fff" },
                    ]}
                  >
                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ThemedView>

            <ThemedView style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowModal(false)}
              >
                <ThemedText>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: colors.tint }]}
                onPress={handleCreate}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <ThemedText style={styles.saveButtonText}>Create</ThemedText>
                )}
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>
        </ThemedView>
      </Modal>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 12,
    paddingBottom: 32,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  empty: {
    padding: 32,
    alignItems: "center",
  },
  emptyText: {
    opacity: 0.5,
    fontSize: 16,
  },
  habitCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    gap: 8,
  },
  habitHeader: {
    flexDirection: "row",
    gap: 12,
  },
  habitDesc: {
    fontSize: 14,
    opacity: 0.6,
    marginTop: 2,
  },
  habitMeta: {
    fontSize: 12,
    opacity: 0.4,
    marginTop: 4,
    textTransform: "capitalize",
  },
  completeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  completeButtonText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },
  deleteText: {
    fontSize: 13,
    color: "#e74c3c",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  modalContent: {
    padding: 24,
    borderRadius: 16,
    gap: 12,
  },
  modalTitle: {
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: "#000",
    backgroundColor: "#fff",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
  },
  freqRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  freqOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  freqText: {
    fontSize: 13,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  saveButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
})
