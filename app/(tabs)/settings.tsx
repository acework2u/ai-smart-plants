import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Switch } from 'react-native';
import { Settings, Bell, Palette, Globe2 } from 'lucide-react-native';

export default function SettingsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Settings size={48} color="#16a34a" />
          <Text style={styles.title}>ตั้งค่า</Text>
          <Text style={styles.subtitle}>จัดการการตั้งค่าแอป</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Bell size={24} color="#6b7280" />
              <Text style={styles.settingText}>การแจ้งเตือน</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#d1d5db', true: '#16a34a' }}
              thumbColor={notificationsEnabled ? '#ffffff' : '#f3f4f6'}
            />
          </View>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Palette size={24} color="#6b7280" />
              <Text style={styles.settingText}>ธีม</Text>
            </View>
            <Text style={styles.settingValue}>อัตโนมัติ</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Globe2 size={24} color="#6b7280" />
              <Text style={styles.settingText}>ภาษา</Text>
            </View>
            <Text style={styles.settingValue}>ไทย</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.version}>เวอร์ชัน 1.0.0</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    marginTop: 8,
  },
  section: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  settingValue: {
    fontSize: 16,
    color: '#6b7280',
  },
  footer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 40,
  },
  version: {
    fontSize: 14,
    color: '#9ca3af',
  },
});