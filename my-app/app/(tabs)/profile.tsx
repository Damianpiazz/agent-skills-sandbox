import { useEffect, useState, useCallback } from "react"
import { StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert, TextInput, ActivityIndicator, Switch } from "react-native"
import { useRouter } from "expo-router"
import { ThemedText } from "@/components/themed-text"
import { ThemedView } from "@/components/themed-view"
import { useAuth } from "@/hooks/use-auth"
import { api } from "@/lib/api"
import { Colors } from "@/constants/theme"
import { useColorScheme } from "@/hooks/use-color-scheme"
import type { User } from "@/shared/types/user"

export default function ProfileScreen() {
  const { user, logout } = useAuth()
  const [profile, setProfile] = useState<User | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState("")
  const [bio, setBio] = useState("")
  const [notifications, setNotifications] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? "light"]
  const router = useRouter()

  const fetchProfile = useCallback(async () => {
    const res = await api.get<User>("/profile")
    if (res.success && res.data) {
      setProfile(res.data)
      setName(res.data.name)
    }
  }, [])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchProfile()
    setRefreshing(false)
  }, [fetchProfile])

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert("Error", "Name is required")
      return
    }

    setSubmitting(true)
    const res = await api.patch<User>("/profile", {
      name: name.trim(),
      bio: bio.trim() || undefined,
      preferences: { notificationsEnabled: notifications },
    })
    setSubmitting(false)

    if (res.success) {
      setEditing(false)
      fetchProfile()
    } else {
      Alert.alert("Error", res.error || "Failed to update profile")
    }
  }

  async function handleLogout() {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout()
          router.replace("/auth/login")
        },
      },
    ])
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <ThemedView style={styles.avatarContainer}>
        <ThemedView style={[styles.avatar, { backgroundColor: colors.tint }]}>
          <ThemedText style={styles.avatarText}>
            {profile?.name?.charAt(0)?.toUpperCase() || "?"}
          </ThemedText>
        </ThemedView>
        <ThemedText type="title">{profile?.name || "User"}</ThemedText>
        <ThemedText style={styles.email}>{profile?.email || ""}</ThemedText>
      </ThemedView>

      {editing ? (
        <ThemedView style={styles.editSection}>
          <TextInput
            style={styles.input}
            placeholder="Name"
            placeholderTextColor="#999"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={[styles.input, styles.bioInput]}
            placeholder="Bio (optional)"
            placeholderTextColor="#999"
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={3}
          />
          <ThemedView style={styles.switchRow}>
            <ThemedText>Enable Notifications</ThemedText>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: "#ccc", true: colors.tint }}
            />
          </ThemedView>
          <ThemedView style={styles.editActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setEditing(false)}
            >
              <ThemedText>Cancel</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: colors.tint }]}
              onPress={handleSave}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <ThemedText style={styles.saveButtonText}>Save</ThemedText>
              )}
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>
      ) : (
        <TouchableOpacity
          style={[styles.editButton, { borderColor: colors.tint }]}
          onPress={() => setEditing(true)}
        >
          <ThemedText style={[styles.editButtonText, { color: colors.tint }]}>
            Edit Profile
          </ThemedText>
        </TouchableOpacity>
      )}

      <ThemedView style={styles.infoSection}>
        <ThemedText type="subtitle">Account Info</ThemedText>
        <ThemedView style={styles.infoRow}>
          <ThemedText style={styles.infoLabel}>Email</ThemedText>
          <ThemedText>{profile?.email || ""}</ThemedText>
        </ThemedView>
        <ThemedView style={styles.infoRow}>
          <ThemedText style={styles.infoLabel}>Joined</ThemedText>
          <ThemedText>
            {profile?.createdAt
              ? new Date(profile.createdAt).toLocaleDateString()
              : ""}
          </ThemedText>
        </ThemedView>
      </ThemedView>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <ThemedText style={styles.logoutText}>Logout</ThemedText>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 20,
    paddingBottom: 32,
  },
  avatarContainer: {
    alignItems: "center",
    gap: 8,
    paddingTop: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  avatarText: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "bold",
  },
  email: {
    opacity: 0.5,
    fontSize: 14,
  },
  editSection: {
    gap: 12,
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
  bioInput: {
    height: 80,
    textAlignVertical: "top",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  editActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
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
  editButton: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  editButtonText: {
    fontWeight: "600",
  },
  infoSection: {
    gap: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  infoLabel: {
    opacity: 0.5,
  },
  logoutButton: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e74c3c",
    alignItems: "center",
  },
  logoutText: {
    color: "#e74c3c",
    fontWeight: "600",
    fontSize: 16,
  },
})
