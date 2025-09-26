import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { BarChart3, TrendingUp } from 'lucide-react-native';

export default function InsightsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <BarChart3 size={48} color="#16a34a" />
          <Text style={styles.title}>ข้อมูลเชิงลึก</Text>
          <Text style={styles.subtitle}>ข้อมูลและการวิเคราะห์</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>สุขภาพสวน</Text>
            <TrendingUp size={20} color="#10b981" />
          </View>
          <Text style={styles.cardValue}>85%</Text>
          <Text style={styles.cardSubtitle}>สวนของคุณสุขภาพดี</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
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
  card: {
    backgroundColor: '#f9fafb',
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  cardValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#10b981',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});