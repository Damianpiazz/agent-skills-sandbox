import { useEffect, useState, useCallback } from "react"
import { StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert, TextInput, Modal, ActivityIndicator } from "react-native"
import { ThemedText } from "@/components/themed-text"
import { ThemedView } from "@/components/themed-view"
import { api } from "@/lib/api"
import { Colors } from "@/constants/theme"
import { useColorScheme } from "@/hooks/use-color-scheme"
import type { Task, Priority } from "@/shared/types/task"

export default function TasksScreen() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState<Priority>("medium")
  const [category, setCategory] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all")
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? "light"]

  const fetchTasks = useCallback(async () => {
    const endpoint = filter === "all" ? "/tasks" : `/tasks?status=${filter}`
    const res = await api.get<Task[]>(endpoint)
    if (res.success && res.data) setTasks(res.data)
  }, [filter])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchTasks()
    setRefreshing(false)
  }, [fetchTasks])

  async function handleCreate() {
    if (!title.trim()) {
      Alert.alert("Error", "Title is required")
      return
    }

    setSubmitting(true)
    const res = await api.post<Task>("/tasks", {
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      category: category.trim() || undefined,
    })
    setSubmitting(false)

    if (res.success) {
      setShowModal(false)
      setTitle("")
      setDescription("")
      setPriority("medium")
      setCategory("")
      fetchTasks()
    } else {
      Alert.alert("Error", res.error || "Failed to create task")
    }
  }

  async function handleToggleStatus(task: Task) {
    const newStatus = task.status === "completed" ? "pending" : "completed"
    const res = await api.patch<Task>(`/tasks/${task.id}`, { status: newStatus })
    if (res.success) fetchTasks()
  }

  async function handleDelete(taskId: string) {
    Alert.alert("Delete Task", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await api.delete(`/tasks/${taskId}`)
          fetchTasks()
        },
      },
    ])
  }

  const priorityColors: Record<Priority, string> = {
    low: "#27ae60",
    medium: "#e67e22",
    high: "#e74c3c",
  }

  const filters: { key: "all" | "pending" | "completed"; label: string }[] = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "completed", label: "Completed" },
  ]

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <ThemedView style={styles.header}>
        <ThemedText type="title">Tasks</ThemedText>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.tint }]}
          onPress={() => setShowModal(true)}
        >
          <ThemedText style={styles.addButtonText}>+ New</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      <ThemedView style={styles.filterRow}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[
              styles.filterButton,
              filter === f.key && { backgroundColor: colors.tint },
            ]}
            onPress={() => setFilter(f.key)}
          >
            <ThemedText
              style={[
                styles.filterText,
                filter === f.key && { color: "#fff" },
              ]}
            >
              {f.label}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </ThemedView>

      {tasks.length === 0 && (
        <ThemedView style={styles.empty}>
          <ThemedText style={styles.emptyText}>No tasks found</ThemedText>
        </ThemedView>
      )}

      {tasks.map((task) => (
        <ThemedView key={task.id} style={styles.taskCard}>
          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => handleToggleStatus(task)}
          >
            <ThemedView
              style={[
                styles.checkboxInner,
                task.status === "completed" && { backgroundColor: colors.tint },
              ]}
            />
          </TouchableOpacity>

          <ThemedView style={{ flex: 1 }}>
            <ThemedText
              style={[
                task.status === "completed" && styles.completedText,
              ]}
            >
              {task.title}
            </ThemedText>
            {task.description ? (
              <ThemedText style={styles.taskDesc}>{task.description}</ThemedText>
            ) : null}
            <ThemedView style={styles.taskMeta}>
              <ThemedView
                style={[styles.priorityBadge, { backgroundColor: priorityColors[task.priority] + "20" }]}
              >
                <ThemedText style={[styles.priorityText, { color: priorityColors[task.priority] }]}>
                  {task.priority}
                </ThemedText>
              </ThemedView>
              {task.category ? (
                <ThemedText style={styles.categoryText}>{task.category}</ThemedText>
              ) : null}
            </ThemedView>
          </ThemedView>

          <TouchableOpacity onPress={() => handleDelete(task.id)}>
            <ThemedText style={styles.deleteText}>×</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      ))}

      <Modal visible={showModal} animationType="slide" transparent>
        <ThemedView style={styles.modalOverlay}>
          <ThemedView style={styles.modalContent}>
            <ThemedText type="subtitle" style={styles.modalTitle}>New Task</ThemedText>

            <TextInput
              style={styles.input}
              placeholder="Task title"
              placeholderTextColor="#999"
              value={title}
              onChangeText={setTitle}
            />

            <TextInput
              style={styles.input}
              placeholder="Description (optional)"
              placeholderTextColor="#999"
              value={description}
              onChangeText={setDescription}
            />

            <TextInput
              style={styles.input}
              placeholder="Category (optional)"
              placeholderTextColor="#999"
              value={category}
              onChangeText={setCategory}
            />

            <ThemedText style={styles.label}>Priority</ThemedText>
            <ThemedView style={styles.priorityRow}>
              {(["low", "medium", "high"] as Priority[]).map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.priorityOption,
                    priority === p && { backgroundColor: priorityColors[p] },
                  ]}
                  onPress={() => setPriority(p)}
                >
                  <ThemedText
                    style={[
                      styles.priorityOptionText,
                      priority === p && { color: "#fff" },
                    ]}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
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
  filterRow: {
    flexDirection: "row",
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  filterText: {
    fontSize: 13,
  },
  empty: {
    padding: 32,
    alignItems: "center",
  },
  emptyText: {
    opacity: 0.5,
    fontSize: 16,
  },
  taskCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  completedText: {
    textDecorationLine: "line-through",
    opacity: 0.5,
  },
  taskDesc: {
    fontSize: 13,
    opacity: 0.6,
    marginTop: 2,
  },
  taskMeta: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
    alignItems: "center",
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  categoryText: {
    fontSize: 11,
    opacity: 0.4,
  },
  deleteText: {
    fontSize: 22,
    color: "#e74c3c",
    paddingLeft: 8,
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
  priorityRow: {
    flexDirection: "row",
    gap: 8,
  },
  priorityOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
  },
  priorityOptionText: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "capitalize",
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
