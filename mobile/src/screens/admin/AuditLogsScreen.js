import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../../components/common/ScreenHeader';
import { Badge } from '../../components/common/Badge';
import { useTheme } from '../../context/ThemeContext';
import { adminService } from '../../services/adminService';
import { COLORS } from '../../constants/colors';

export const AuditLogsScreen = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState('all'); // 'all' | 'info' | 'warn' | 'error'

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminService.getLogs();
      setLogs(Array.isArray(data) ? data : data?.logs || []);
    } catch (e) {
      console.warn('Failed to fetch logs:', e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filteredLogs = useMemo(() => {
    if (selectedLevel === 'all') return logs;
    return logs.filter((l) => (l.level || 'info').toLowerCase() === selectedLevel);
  }, [logs, selectedLevel]);

  const getLevelVariant = (level) => {
    switch (level?.toLowerCase()) {
      case 'error':
        return 'danger';
      case 'warn':
        return 'warning';
      default:
        return 'info';
    }
  };

  return (
    <View style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Header */}
      <ScreenHeader
        title="Audit & Event Logs"
        onBack={() => navigation.goBack()}
      />

      {/* Level Filters */}
      <View style={styles.filterRow}>
        {['all', 'info', 'warn', 'error'].map((lvl) => {
          const isSelected = selectedLevel === lvl;
          return (
            <TouchableOpacity
              key={lvl}
              onPress={() => setSelectedLevel(lvl)}
              style={[
                styles.levelTab,
                {
                  backgroundColor: isSelected
                    ? COLORS.primary
                    : isDark
                    ? colors.surface
                    : '#ffffff',
                  borderColor: isSelected ? COLORS.primary : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.levelTabText,
                  {
                    color: isSelected ? '#ffffff' : colors.textSecondary,
                    fontWeight: isSelected ? '700' : '500',
                  },
                ]}
              >
                {lvl.toUpperCase()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={filteredLogs}
        keyExtractor={(item, index) => item.id || item._id || index.toString()}
        renderItem={({ item }) => (
          <View
            style={[
              styles.logCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.cardTop}>
              <Badge label={item.level || 'INFO'} variant={getLevelVariant(item.level)} size="sm" />
              <Text style={[styles.timestamp, { color: colors.textMuted }]}>
                {item.timestamp ? new Date(item.timestamp).toLocaleString() : ''}
              </Text>
            </View>

            <Text style={[styles.message, { color: colors.text }]}>{item.message}</Text>

            {item.userId?.username && (
              <Text style={[styles.userText, { color: colors.textMuted }]}>
                User: {item.userId.username}
              </Text>
            )}
          </View>
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchLogs} colors={[COLORS.primary]} />
        }
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={40} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No logs found</Text>
            </View>
          )
        }
      />
    </View>
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
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  levelTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  levelTabText: {
    fontSize: 12,
  },
  listContent: {
    padding: 16,
    gap: 10,
  },
  logCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  timestamp: {
    fontSize: 11,
  },
  message: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  userText: {
    fontSize: 11,
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 8,
  },
});
