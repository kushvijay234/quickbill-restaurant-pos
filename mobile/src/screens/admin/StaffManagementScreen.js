import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { ModalContainer } from '../../components/common/ModalContainer';
import { useTheme } from '../../context/ThemeContext';
import { adminService } from '../../services/adminService';
import { COLORS } from '../../constants/colors';

export const StaffManagementScreen = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Add User Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('staff'); // 'staff' | 'admin'
  const [savingUser, setSavingUser] = useState(false);

  // Reset Password Modal
  const [resetModalUser, setResetModalUser] = useState(null);
  const [resetPasswordVal, setResetPasswordVal] = useState('');
  const [resettingPassword, setResettingPassword] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminService.getUsers();
      setUsers(Array.isArray(data) ? data : data?.users || []);
    } catch (e) {
      console.warn('Failed to load users:', e.message);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreateUser = async () => {
    if (!newUsername.trim() || !newPassword) {
      Alert.alert('Validation Error', 'Username and password are required');
      return;
    }

    try {
      setSavingUser(true);
      const created = await adminService.createUser({
        username: newUsername.trim(),
        password: newPassword,
        role: newRole,
      });
      setUsers((prev) => [...prev, created]);
      setShowAddModal(false);
      setNewUsername('');
      setNewPassword('');
      Alert.alert('Success', `Staff account for "${created.username}" created!`);
    } catch (e) {
      Alert.alert('Error', e.message || 'Could not create staff user');
    } finally {
      setSavingUser(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetPasswordVal) {
      Alert.alert('Validation Error', 'Please enter a new password');
      return;
    }

    try {
      setResettingPassword(true);
      await adminService.resetPassword(resetModalUser.id, resetPasswordVal);
      Alert.alert('Success', `Password updated for ${resetModalUser.username}`);
      setResetModalUser(null);
      setResetPasswordVal('');
    } catch (e) {
      Alert.alert('Error', e.message || 'Could not reset password');
    } finally {
      setResettingPassword(false);
    }
  };

  const handleDeleteUser = (user) => {
    Alert.alert('Delete Staff', `Are you sure you want to delete ${user.username}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await adminService.deleteUser(user.id);
            setUsers((prev) => prev.filter((u) => u.id !== user.id));
            Alert.alert('Success', 'User deleted');
          } catch (e) {
            Alert.alert('Error', e.message || 'Could not delete user');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Staff Accounts</Text>
        <TouchableOpacity onPress={() => setShowAddModal(true)} style={styles.addBtn}>
          <Ionicons name="person-add-outline" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={users}
        keyExtractor={(item) => item.id || item._id}
        renderItem={({ item }) => (
          <View
            style={[
              styles.userCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.userLeft}>
              <View style={[styles.avatar, { backgroundColor: isDark ? colors.surfaceSubtle : '#f1f5f9' }]}>
                <Ionicons name="person" size={20} color={COLORS.primary} />
              </View>
              <View>
                <Text style={[styles.username, { color: colors.text }]}>{item.username}</Text>
                <View style={{ marginTop: 4 }}>
                  <Badge
                    label={item.role}
                    variant={item.role === 'admin' ? 'role' : 'info'}
                    size="sm"
                  />
                </View>
              </View>
            </View>

            <View style={styles.userActions}>
              <TouchableOpacity
                onPress={() => setResetModalUser(item)}
                style={[styles.actionIconBtn, { backgroundColor: isDark ? colors.surfaceSubtle : '#f1f5f9' }]}
              >
                <Ionicons name="key-outline" size={16} color={COLORS.accent} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleDeleteUser(item)}
                style={[styles.actionIconBtn, { backgroundColor: '#fee2e2' }]}
              >
                <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
              </TouchableOpacity>
            </View>
          </View>
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchUsers} colors={[COLORS.primary]} />
        }
      />

      {/* Add Staff Modal */}
      <ModalContainer
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Create Staff Account"
      >
        <View style={{ gap: 12 }}>
          <Input
            label="Username *"
            placeholder="e.g. cashier1"
            value={newUsername}
            onChangeText={setNewUsername}
            autoCapitalize="none"
          />

          <Input
            label="Password *"
            placeholder="Temporary or initial password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={true}
            autoCapitalize="none"
          />

          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary }}>Role</Text>
          <View style={styles.rolePickerRow}>
            {['staff', 'admin'].map((role) => {
              const isSelected = newRole === role;
              return (
                <TouchableOpacity
                  key={role}
                  onPress={() => setNewRole(role)}
                  style={[
                    styles.roleBtn,
                    {
                      backgroundColor: isSelected
                        ? COLORS.primary
                        : isDark
                        ? colors.surfaceSubtle
                        : '#f8fafc',
                      borderColor: isSelected ? COLORS.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.roleBtnText,
                      { color: isSelected ? '#ffffff' : colors.text, textTransform: 'capitalize' },
                    ]}
                  >
                    {role}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Button
            title="Create Account"
            onPress={handleCreateUser}
            loading={savingUser}
            size="lg"
            style={{ marginTop: 8 }}
          />
        </View>
      </ModalContainer>

      {/* Reset Password Modal */}
      <ModalContainer
        visible={!!resetModalUser}
        onClose={() => setResetModalUser(null)}
        title={`Reset Password: ${resetModalUser?.username}`}
      >
        <View style={{ gap: 14 }}>
          <Input
            label="New Password *"
            placeholder="Enter new password"
            value={resetPasswordVal}
            onChangeText={setResetPasswordVal}
            secureTextEntry={true}
          />
          <Button
            title="Update Password"
            onPress={handleResetPassword}
            loading={resettingPassword}
            size="lg"
          />
        </View>
      </ModalContainer>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  backBtn: {
    padding: 4,
  },
  addBtn: {
    padding: 6,
  },
  listContent: {
    padding: 16,
    gap: 10,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  userLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  username: {
    fontSize: 15,
    fontWeight: '700',
  },
  userActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionIconBtn: {
    padding: 8,
    borderRadius: 8,
  },
  rolePickerRow: {
    flexDirection: 'row',
    gap: 10,
  },
  roleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  roleBtnText: {
    fontWeight: '700',
  },
});
