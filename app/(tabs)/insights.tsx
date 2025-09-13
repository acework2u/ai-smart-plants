import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { colors, typography, getSpacing } from '../../core/theme';

export default function InsightsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>ข้อมูลเชิงลึก</Text>
        <Text style={styles.subtitle}>คำแนะนำการดูแลพืชจาก AI</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>ยังไม่มีข้อมูล</Text>
          <Text style={styles.cardSubtitle}>
            สแกนพืชเพื่อรับคำแนะนำและอินไซต์เฉพาะสำหรับสวนของคุณ
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    padding: getSpacing(4),
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.secondary,
    marginTop: getSpacing(1),
    marginBottom: getSpacing(4),
  },
  card: {
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 12,
    backgroundColor: colors.white,
    padding: getSpacing(4),
  },
  cardTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semibold,
    color: colors.text.primary,
    marginBottom: getSpacing(1),
  },
  cardSubtitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.secondary,
    lineHeight: typography.lineHeight.normal * typography.fontSize.base,
  },
});
