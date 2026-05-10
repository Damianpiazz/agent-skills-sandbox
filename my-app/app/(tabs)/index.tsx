import { useEffect, useState, useCallback } from "react"
import { StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from "react-native"
import { useRouter } from "expo-router"
import { ThemedText } from "@/components/themed-text"
import { ThemedView } from "@/components/themed-view"
import { useAuth } from "@/hooks/use-auth"
import { api } from "@/lib/api"
import { Colors } from "@/constants/theme"
import { useColorScheme } from "@/hooks/use-color-scheme"

interface DashboardData {
  user: { id: string; name: string; email: string }
  habits: {
    total: number
    completedToday: number
    pending: number
    todayHabits: { id: string; name: string; frequency: string }[]
    completedTodayHabits: { id: string; name: string; frequency: string }[]
    weeklyProgress: { day: string; count: number }[]
  }
  tasks: {
    total: number
    pending: number
    completed: number
    dueToday: number
    weeklyProgress: { day: string; count: number }[]
  }
  streakSummary: { habitId: string; habitName: string; currentStreak: number }[]
}

export default function DashboardScreen() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? "light"]
  const { user } = useAuth()
  const router = useRouter()

  const fetchDashboard = useCallback(async () => {
    const res = await api.get<DashboardData>("/dashboard")
    if (res.success && res.data) setData(res.data)
  }, [])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchDashboard()
    setRefreshing(false)
  }, [fetchDashboard])

  if (!data) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator size="large" color={colors.tint} />
      </ThemedView>
    )
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <ThemedText type="title" style={styles.greeting}>
        Hi, {data.user.name.split(" ")[0]}!
      </ThemedText>

      <ThemedView style={styles.statsRow}>
        <StatCard
          label="Habits Today"
          value={`${data.habits.completedToday}/${data.habits.total}`}
          color={colors.tint}
        />
        <StatCard
          label="Tasks Pending"
          value={String(data.tasks.pending)}
          color="#e67e22"
        />
        <StatCard
          label="Due Today"
          value={String(data.tasks.dueToday)}
          color="#e74c3c"
        />
      </ThemedView>

      {data.habits.todayHabits.length > 0 && (
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Today's Habits</ThemedText>
          {data.habits.todayHabits.map((h) => (
            <ThemedView key={h.id} style={styles.item}>
              <ThemedText>{h.name}</ThemedText>
              <ThemedText style={styles.badge}>{h.frequency}</ThemedText>
            </ThemedView>
          ))}
        </ThemedView>
      )}

      {data.streakSummary.length > 0 && (
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Streaks</ThemedText>
          {data.streakSummary.map((s) => (
            <ThemedView key={s.habitId} style={styles.streakItem}>
              <ThemedText>{s.habitName}</ThemedText>
              <ThemedText style={[styles.streakCount, { color: colors.tint }]}>
                {s.currentStreak} {s.currentStreak === 1 ? "day" : "days"}
              </ThemedText>
            </ThemedView>
          ))}
        </ThemedView>
      )}

      <TouchableOpacity
        style={[styles.habitsButton, { backgroundColor: colors.tint }]}
        onPress={() => router.push("/(tabs)/habits")}
      >
        <ThemedText style={styles.habitsButtonText}>Manage Habits</ThemedText>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.habitsButton, { backgroundColor: colors.tint }]}
        onPress={() => router.push("/(tabs)/tasks")}
      >
        <ThemedText style={styles.habitsButtonText}>Manage Tasks</ThemedText>
      </TouchableOpacity>
    </ScrollView>
  )
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <ThemedView style={styles.statCard}>
      <ThemedText style={[styles.statValue, { color }]}>{value}</ThemedText>
      <ThemedText style={styles.statLabel}>{label}</ThemedText>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 32,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  greeting: {
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  statValue: {
    fontSize: 28,
    fontWeight: "bold",
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.6,
    textAlign: "center",
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    marginBottom: 4,
  },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  badge: {
    fontSize: 12,
    opacity: 0.5,
    textTransform: "capitalize",
  },
  streakItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  streakCount: {
    fontWeight: "bold",
    fontSize: 16,
  },
  habitsButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  habitsButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
})
