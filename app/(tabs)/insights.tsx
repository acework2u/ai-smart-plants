import React, { useMemo, useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Activity,
  CalendarClock,
  Droplet,
  Leaf,
  Sparkles,
  ThermometerSun,
  TrendingUp,
} from 'lucide-react-native';
import { getSpacing, radius, typography } from '../../core/theme';
import { useTheme, type Theme } from '../../contexts/ThemeContext';
import { useGardenStore } from '../../stores/garden';
import { insightsActions } from '../../stores/insightsStore';
import { useWeatherStore } from '../../stores/weatherStore';
import type { ActivityFrequencyData, EngagementMetrics, ProductivityScore, PersonalizedTip } from '../../types';

const heroFocus = {
  title: 'สวนของคุณกำลังแข็งแรง',
  caption: 'คะแนนสุขภาพเฉลี่ย 82 / 100 · ตรวจพบต้นไม้ที่ควรเฝ้าดู 2 ต้น',
  highlight: [
    { Icon: TrendingUp, text: 'กิจกรรมเพิ่มขึ้น 14%' },
    { Icon: CalendarClock, text: 'งานค้าง 3 รายการ' },
  ],
};

// Removed quickMetrics - now using dynamicMetrics
const _unused_quickMetrics = [
  {
    id: 'metric-activity',
    label: 'กิจกรรมสัปดาห์นี้',
    value: '27 ครั้ง',
    change: '+14% จากค่าเฉลี่ย',
    Icon: Activity,
    trend: [10, 12, 13, 16, 17, 21, 18],
  },
  {
    id: 'metric-moisture',
    label: 'ความชื้นเฉลี่ย',
    value: '58%',
    change: 'อยู่ในช่วงเหมาะสม',
    Icon: Droplet,
  },
  {
    id: 'metric-health',
    label: 'ต้นไม้สุขภาพดี',
    value: '13 / 16',
    change: '+2 ต้นจากสัปดาห์ก่อน',
    Icon: Leaf,
  },
  {
    id: 'metric-score',
    label: 'คะแนนสุขภาพสวน',
    value: '82 / 100',
    change: '+5% แนวโน้มดีขึ้น',
    Icon: Sparkles,
  },
];

const careActivityMock = [
  { day: 'จ.', value: 12 },
  { day: 'อ.', value: 8 },
  { day: 'พ.', value: 14 },
  { day: 'พฤ.', value: 7 },
  { day: 'ศ.', value: 15 },
  { day: 'ส.', value: 9 },
  { day: 'อา.', value: 6 },
];

const upcomingJobsMock = [
  {
    id: 'job-1',
    title: 'รดน้ำ – มอนสเตอร่า',
    dueLabel: 'ภายใน 2 ชั่วโมง',
    note: '250 มล. + พรางแสง 30% วันนี้',
    priority: 'high',
  },
  {
    id: 'job-2',
    title: 'ใส่ปุ๋ย – กุหลาบอังกฤษ',
    dueLabel: 'พรุ่งนี้ 09:00 น.',
    note: 'สูตร 15-15-15 ปริมาณ 30 กรัม',
    priority: 'medium',
  },
  {
    id: 'job-3',
    title: 'ตรวจใบ – กล้วยไม้หวาย',
    dueLabel: 'ภายใน 3 วัน',
    note: 'หาจุดไหม้หรือเชื้อราใต้ใบ',
    priority: 'low',
  },
];

const healthSnapshot = [
  {
    id: 'health-score',
    header: 'คะแนนสุขภาพเฉลี่ย',
    value: '82 / 100',
    descriptor: 'ดีขึ้น 5% จากสัปดาห์ก่อน',
  },
  {
    id: 'health-risk',
    header: 'ต้นไม้เสี่ยงสูง',
    value: '2 ต้น',
    descriptor: 'ต้องติดตามภายใน 24 ชม.',
  },
];

// Removed aiAdvice mock data - now using real personalized tips

const microClimateInsights = [
  {
    id: 'climate-temp',
    label: 'อุณหภูมิเฉลี่ย',
    value: '26°C',
    detail: 'กลางวันสูงสุด 31°C · กลางคืนต่ำสุด 22°C',
  },
  {
    id: 'climate-light',
    label: 'ความเข้มแสง',
    value: '12.4 klux',
    detail: 'เพิ่มขึ้น 8% ช่วง 9:00-11:00 น.',
  },
];

const quickFacts = [
  {
    id: 'fact-activity',
    label: 'กิจกรรมต่อสัปดาห์',
    value: '27 ครั้ง',
    caption: '+6 จากค่าเฉลี่ย 4 สัปดาห์',
  },
  {
    id: 'fact-healthy',
    label: 'สัดส่วนพืชสุขภาพดี',
    value: '78%',
    caption: '13/16 ต้นอยู่ในโซนสีเขียว',
  },
  {
    id: 'fact-fertilizer',
    label: 'การใช้ปุ๋ยเดือนนี้',
    value: '1.4 ลิตร',
    caption: 'ปุ๋ยสูตร 13-13-21 ใช้สูงที่สุด',
  },
];

export default function InsightsScreen() {
  const { theme } = useTheme();
  const plants = useGardenStore((state) => state.plants);
  const stats = useGardenStore((state) => state.stats);
  const weather = useWeatherStore((state) => state.currentWeather);
  const styles = useMemo(() => createStyles(theme), [theme]);

  // State for insights data
  const [activityData, setActivityData] = useState<ActivityFrequencyData[] | null>(null);
  const [engagementData, setEngagementData] = useState<EngagementMetrics | null>(null);
  const [productivityData, setProductivityData] = useState<ProductivityScore | null>(null);
  const [personalizedTips, setPersonalizedTips] = useState<PersonalizedTip[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load insights data
  useEffect(() => {
    const loadInsights = async () => {
      try {
        setIsLoading(true);

        // Load various insights including engagement metrics and personalized tips
        const [activityResult, engagementResult, productivityResult, tipsResult] = await Promise.all([
          insightsActions.getActivityPatterns(),
          insightsActions.getEngagementMetrics(),
          insightsActions.getProductivityScore(),
          insightsActions.getPersonalizedTips(),
        ]);

        if (activityResult.success && activityResult.data) setActivityData(activityResult.data);
        if (engagementResult.success && engagementResult.data) setEngagementData(engagementResult.data);
        if (productivityResult.success && productivityResult.data) setProductivityData(productivityResult.data);
        if (tipsResult.success && tipsResult.data) setPersonalizedTips(tipsResult.data);
      } catch (error) {
        console.error('Failed to load insights:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadInsights();
  }, []);

  // Real-time data sync - reload insights when garden data changes
  useEffect(() => {
    const refreshInsights = async () => {
      if (plants.length > 0) {
        // Notify insights store about data changes
        insightsActions.updateDependency('plantData');

        // Refresh insights with new data
        try {
          const [activityResult, engagementResult] = await Promise.all([
            insightsActions.getActivityPatterns(undefined, true), // force refresh
            insightsActions.getEngagementMetrics(true), // force refresh
          ]);

          if (activityResult.success && activityResult.data) {
            setActivityData(activityResult.data);
          }
          if (engagementResult.success && engagementResult.data) {
            setEngagementData(engagementResult.data);
          }
        } catch (error) {
          console.error('Failed to refresh insights:', error);
        }
      }
    };

    refreshInsights();
  }, [plants.length, stats?.totalPlants]); // Re-run when plants or stats change

  // Calculate dynamic hero data
  const heroData = useMemo(() => {
    const totalPlants = stats?.totalPlants || plants.length || 0;
    const healthyCount = stats?.healthyCount || 0;
    const criticalCount = stats?.criticalCount || 0;
    const warningCount = stats?.warningCount || 0;

    const healthScore = totalPlants > 0 ? parseFloat(((healthyCount / totalPlants) * 100).toFixed(1)) : 0;
    const attentionNeeded = criticalCount + warningCount;

    // Calculate activity trend from engagement data
    const activityTrend = engagementData?.engagement?.trends?.weekOverWeek || 0;
    const activityChange = activityTrend > 0 ? `+${activityTrend}%` :
                          activityTrend < 0 ? `${activityTrend}%` : 'ไม่เปลี่ยนแปลง';

    return {
      title: healthScore >= 80 ? 'สวนของคุณกำลังแข็งแรง' :
             healthScore >= 60 ? 'สวนของคุณมีสุขภาพดี' : 'สวนต้องการความดูแล',
      caption: `คะแนนสุขภาพเฉลี่ย ${healthScore} / 100 · ${attentionNeeded > 0 ? `ตรวจพบต้นไม้ที่ควรเฝ้าดู ${attentionNeeded} ต้น` : 'ทุกต้นมีสุขภาพดี'}`,
      activityChange: isLoading ? 'กำลังโหลด...' : activityChange,
      pendingTasks: attentionNeeded,
      engagementScore: engagementData?.engagement?.score || 0,
      engagementLevel: engagementData?.engagement?.level || 'low',
    };
  }, [stats, plants, engagementData, isLoading]);

  // Calculate dynamic metrics
  const dynamicMetrics = useMemo(() => {
    const totalPlants = stats?.totalPlants || plants.length || 0;
    const healthyCount = stats?.healthyCount || 0;

    // Calculate weekly activities from engagement data
    const weeklyActivities = engagementData?.featureUsage?.activityLogging ||
                           (activityData ? activityData.reduce((sum, activity) => sum + activity.totalCount, 0) : 0);

    // Get real activity trend from engagement data
    const activityTrend = engagementData?.engagement?.trends?.weekOverWeek || 0;
    const activityChange = isLoading ? 'กำลังโหลด...' :
                          activityTrend > 0 ? `+${activityTrend}% จากค่าเฉลี่ย` :
                          activityTrend < 0 ? `${activityTrend}% จากค่าเฉลี่ย` :
                          'ไม่เปลี่ยนแปลง';

    return [
      {
        id: 'metric-activity',
        label: 'กิจกรรมทั้งหมด',
        value: `${weeklyActivities} ครั้ง`,
        change: activityChange,
        Icon: Activity,
        trend: [10, 12, 13, 16, 17, 21, 18], // Mock trend data for chart
      },
      {
        id: 'metric-moisture',
        label: 'ความชื้นอากาศ',
        value: weather?.humidity ? `${weather.humidity.toFixed(1)}%` : '58%',
        change: weather?.humidity
          ? (weather.humidity >= 40 && weather.humidity <= 70 ? 'อยู่ในช่วงเหมาะสม' : weather.humidity > 70 ? 'ชื้นเกินไป' : 'แห้งเกินไป')
          : 'กำลังโหลด...',
        Icon: Droplet,
      },
      {
        id: 'metric-health',
        label: 'ต้นไม้สุขภาพดี',
        value: `${healthyCount} / ${totalPlants}`,
        change: stats?.recentlyAdded ? `+${stats.recentlyAdded} ต้นจากสัปดาห์ก่อน` : 'ไม่มีการเปลี่ยนแปลง',
        Icon: Leaf,
      },
      {
        id: 'metric-engagement',
        label: 'คะแนนการมีส่วนร่วม',
        value: engagementData ? `${engagementData.engagement.score}/100` : '--',
        change: isLoading ? 'กำลังโหลด...' :
                engagementData?.engagement?.level === 'very_high' ? 'การมีส่วนร่วมสูงมาก' :
                engagementData?.engagement?.level === 'high' ? 'การมีส่วนร่วมสูง' :
                engagementData?.engagement?.level === 'medium' ? 'การมีส่วนร่วมปานกลาง' : 'ควรเพิ่มการใช้งาน',
        Icon: Sparkles,
      },
    ];
  }, [stats, plants, activityData, engagementData, weather, isLoading]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero summary */}
        <View style={styles.heroContainer}>
          <Text style={styles.heading}>ข้อมูลเชิงลึก</Text>
          <Text style={styles.subheading}>
            ภาพรวมสุขภาพสวนล่าสุด พร้อมคำแนะนำที่คุณทำตามได้ทันที
          </Text>

          <View style={styles.heroCard}>
            <View style={styles.heroHeaderRow}>
              <View style={styles.heroBadge}>
                <View style={styles.heroBadgeDot} />
                <Text style={styles.heroBadgeLabel}>AI Spotlight</Text>
              </View>
              <Text style={styles.heroAction}>ดูรายงานเต็ม</Text>
            </View>

            <Text style={styles.heroTitle}>{heroData.title}</Text>
            <Text style={styles.heroCaption}>{heroData.caption}</Text>

            <View style={styles.heroSplitRow}>
              <View style={styles.heroHighlightCard}>
                <TrendingUp size={14} color={theme.colors.primary} />
                <Text style={styles.heroHighlightText}>กิจกรรมเพิ่มขึ้น {heroData.activityChange}</Text>
              </View>
              <View style={styles.heroHighlightCard}>
                <CalendarClock size={14} color={theme.colors.primary} />
                <Text style={styles.heroHighlightText}>งานค้าง {heroData.pendingTasks} รายการ</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Snapshot KPIs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.kpiStrip}
        >
          {dynamicMetrics.map(({ id, label, value, change, Icon, trend }) => (
            <View key={id} style={styles.kpiCard}>
              <View style={styles.kpiIconWrap}>
                <Icon size={18} color={theme.colors.primary} />
              </View>
              <Text style={styles.kpiLabel}>{label}</Text>
              <Text style={styles.kpiValue}>{value}</Text>
              <Text style={styles.kpiChange}>{change}</Text>
              {trend && (
                <View style={styles.sparkline}>
                  {trend.map((height, index) => (
                    <View
                      key={`${id}-spark-${index}`}
                      style={[
                        styles.sparklineBar,
                        {
                          height,
                          opacity: 0.5 + index * 0.07,
                        },
                      ]}
                    />
                  ))}
                </View>
              )}
            </View>
          ))}
        </ScrollView>

        {/* Productivity Score Section */}
        {productivityData && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>คะแนนประสิทธิภาพการดูแล</Text>
              <Text style={styles.sectionLink}>ดูรายละเอียด ›</Text>
            </View>

            <View style={styles.productivityCard}>
              <View style={styles.productivityHeader}>
                <View style={styles.productivityScoreContainer}>
                  <Text style={styles.productivityScore}>{productivityData.overall}</Text>
                  <Text style={styles.productivityScoreLabel}>/100</Text>
                </View>
                <View style={styles.productivityTrends}>
                  <Text style={styles.productivityTrendLabel}>เดือนนี้</Text>
                  <Text style={[
                    styles.productivityTrendValue,
                    { color: productivityData.comparison.vsLastMonth >= 0 ? theme.colors.success : theme.colors.error }
                  ]}>
                    {productivityData.comparison.vsLastMonth >= 0 ? '+' : ''}{productivityData.comparison.vsLastMonth}%
                  </Text>
                </View>
              </View>

              <View style={styles.productivityBreakdown}>
                <View style={styles.productivityMetric}>
                  <Text style={styles.productivityMetricLabel}>ความสม่ำเสมอ</Text>
                  <View style={styles.productivityBar}>
                    <View style={[
                      styles.productivityBarFill,
                      {
                        width: `${productivityData.breakdown.consistency}%`,
                        backgroundColor: theme.colors.primary
                      }
                    ]} />
                  </View>
                  <Text style={styles.productivityMetricValue}>{productivityData.breakdown.consistency}%</Text>
                </View>

                <View style={styles.productivityMetric}>
                  <Text style={styles.productivityMetricLabel}>ความครบถ้วน</Text>
                  <View style={styles.productivityBar}>
                    <View style={[
                      styles.productivityBarFill,
                      {
                        width: `${productivityData.breakdown.completeness}%`,
                        backgroundColor: theme.colors.primary
                      }
                    ]} />
                  </View>
                  <Text style={styles.productivityMetricValue}>{productivityData.breakdown.completeness}%</Text>
                </View>

                <View style={styles.productivityMetric}>
                  <Text style={styles.productivityMetricLabel}>ความตรงเวลา</Text>
                  <View style={styles.productivityBar}>
                    <View style={[
                      styles.productivityBarFill,
                      {
                        width: `${productivityData.breakdown.timeliness}%`,
                        backgroundColor: theme.colors.primary
                      }
                    ]} />
                  </View>
                  <Text style={styles.productivityMetricValue}>{productivityData.breakdown.timeliness}%</Text>
                </View>

                <View style={styles.productivityMetric}>
                  <Text style={styles.productivityMetricLabel}>ประสิทธิผล</Text>
                  <View style={styles.productivityBar}>
                    <View style={[
                      styles.productivityBarFill,
                      {
                        width: `${productivityData.breakdown.effectiveness}%`,
                        backgroundColor: theme.colors.primary
                      }
                    ]} />
                  </View>
                  <Text style={styles.productivityMetricValue}>{productivityData.breakdown.effectiveness}%</Text>
                </View>
              </View>

              {productivityData.achievements.length > 0 && (
                <View style={styles.achievementsContainer}>
                  <Text style={styles.achievementsTitle}>ผลงานที่ได้รับ</Text>
                  <View style={styles.achievementsList}>
                    {productivityData.achievements.slice(0, 2).map((achievement, index) => (
                      <View key={index} style={styles.achievementBadge}>
                        <Text style={styles.achievementEmoji}>🏆</Text>
                        <Text style={styles.achievementName}>{achievement.nameThai}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Activity block */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>กิจกรรมการดูแล 7 วันที่ผ่านมา</Text>
            <Text style={styles.sectionLink}>ดูรายละเอียด ›</Text>
          </View>

          <View style={styles.chartCard}>
            <View style={styles.chartBars}>
              {careActivityMock.map((item) => (
                <View key={item.day} style={styles.chartBarSlot}>
                  <View
                    accessibilityLabel={`${item.day} ${item.value} กิจกรรม`}
                    style={[
                      styles.chartBar,
                      {
                        height: 24 + item.value * 3.5,
                        backgroundColor: theme.colors.primary,
                      },
                    ]}
                  />
                  <Text style={styles.chartLabel}>{item.day}</Text>
                </View>
              ))}
            </View>
            <View style={styles.chartFooter}>
              <Text style={styles.chartHighlight}>กิจกรรมรวม 73 ครั้ง</Text>
              <Text style={styles.chartMuted}>มากกว่าสัปดาห์ก่อน 14%</Text>
            </View>
          </View>
        </View>

        {/* Upcoming jobs */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>งานที่ต้องทำเร็ว ๆ นี้</Text>
            <Text style={styles.sectionLink}>จัดการทั้งหมด ›</Text>
          </View>

          <View style={styles.cardStack}>
            {upcomingJobsMock.map((job) => (
              <View key={job.id} style={styles.jobCard}>
                <View style={styles.jobHeader}>
                  <Text style={styles.jobTitle}>{job.title}</Text>
                  <Text
                    style={[
                      styles.jobPill,
                      job.priority === 'high' && styles.jobPillHigh,
                      job.priority === 'medium' && styles.jobPillMedium,
                    ]}
                  >
                    {job.dueLabel}
                  </Text>
                </View>
                <Text style={styles.jobNote}>{job.note}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Health overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>สรุปสุขภาพสำคัญ</Text>
          <View style={styles.healthGrid}>
            {healthSnapshot.map((item) => (
              <View key={item.id} style={styles.healthCard}>
                <Text style={styles.healthHeader}>{item.header}</Text>
                <Text style={styles.healthValue}>{item.value}</Text>
                <Text style={styles.healthDescriptor}>{item.descriptor}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Personalized AI Tips */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>คำแนะนำเฉพาะสำหรับคุณ</Text>
            <Text style={styles.sectionLink}>ดูทั้งหมด ›</Text>
          </View>
          <View style={styles.tipStack}>
            {personalizedTips && personalizedTips.length > 0 ? (
              personalizedTips
                .sort((a, b) => {
                  const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
                  return priorityOrder[b.priority] - priorityOrder[a.priority];
                })
                .slice(0, 3) // Show top 3 tips
                .map((tip) => (
                  <View key={tip.id} style={[
                    styles.tipCard,
                    tip.priority === 'high' && styles.tipCardHigh,
                    tip.priority === 'medium' && styles.tipCardMedium,
                  ]}>
                    <View style={styles.tipHeaderRow}>
                      <View style={[
                        styles.tipBullet,
                        tip.priority === 'high' && styles.tipBulletHigh,
                        tip.priority === 'medium' && styles.tipBulletMedium,
                      ]} />
                      <Text style={styles.tipTitle}>{tip.titleThai}</Text>
                      <View style={[
                        styles.tipPriorityBadge,
                        tip.priority === 'high' && styles.tipPriorityHigh,
                        tip.priority === 'medium' && styles.tipPriorityMedium,
                        tip.priority === 'low' && styles.tipPriorityLow,
                      ]}>
                        <Text style={[
                          styles.tipPriorityText,
                          tip.priority === 'high' && styles.tipPriorityTextHigh,
                        ]}>
                          {tip.priority === 'high' ? 'สำคัญ' :
                           tip.priority === 'medium' ? 'ปานกลาง' : 'ทั่วไป'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.tipBody}>{tip.descriptionThai}</Text>

                    {tip.actionable.stepsThai.length > 0 && (
                      <View style={styles.tipActions}>
                        <Text style={styles.tipActionsTitle}>ขั้นตอนที่แนะนำ:</Text>
                        {tip.actionable.stepsThai.slice(0, 2).map((step, index) => (
                          <Text key={index} style={styles.tipActionItem}>
                            • {step}
                          </Text>
                        ))}
                      </View>
                    )}

                    <View style={styles.tipFooter}>
                      <Text style={styles.tipRelevance}>
                        เกี่ยวข้อง {(tip.relevance * 100).toFixed(1)}%
                      </Text>
                      <Text style={styles.tipCategory}>
                        {tip.category === 'care' ? '🌱 การดูแล' :
                         tip.category === 'timing' ? '⏰ เวลา' :
                         tip.category === 'plant_health' ? '🍃 สุขภาพพืช' :
                         tip.category === 'seasonal' ? '🌤️ ตามฤดูกาล' : '💡 ทั่วไป'}
                      </Text>
                    </View>
                  </View>
                ))
            ) : (
              <View style={styles.tipCard}>
                <View style={styles.tipHeaderRow}>
                  <View style={styles.tipBullet} />
                  <Text style={styles.tipTitle}>ยังไม่มีคำแนะนำ</Text>
                </View>
                <Text style={styles.tipBody}>
                  เริ่มดูแลพืชเพื่อรับคำแนะนำเฉพาะสำหรับคุณ
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Micro climate */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>สภาพแวดล้อมในสวน</Text>
          <View style={styles.climateGrid}>
            {microClimateInsights.map((item) => (
              <View key={item.id} style={styles.climateCard}>
                <ThermometerSun size={18} color={theme.colors.primary} />
                <View style={styles.climateInfo}>
                  <Text style={styles.climateLabel}>{item.label}</Text>
                  <Text style={styles.climateValue}>{item.value}</Text>
                  <Text style={styles.climateDetail}>{item.detail}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Quick facts */}
        <View style={[styles.section, styles.sectionLast]}>
          <Text style={styles.sectionTitle}>ข้อมูลที่น่าสนใจ</Text>
          <View style={styles.factGrid}>
            {quickFacts.map((fact) => (
              <View key={fact.id} style={styles.factCard}>
                <Text style={styles.factLabel}>{fact.label}</Text>
                <Text style={styles.factValue}>{fact.value}</Text>
                <Text style={styles.factCaption}>{fact.caption}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme: Theme) => {
  const isDark = theme.isDark;
  const surfaceShadowStrong = isDark ? 'rgba(0,0,0,0.45)' : 'rgba(15,23,42,0.14)';
  const surfaceShadowSoft = isDark ? 'rgba(0,0,0,0.3)' : 'rgba(15,23,42,0.1)';
  const surfaceBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)';
  const heroBackground = isDark ? 'rgba(54, 172, 80, 0.15)' : 'rgba(34, 197, 94, 0.12)';
  const heroBadge = isDark ? 'rgba(34,197,94,0.18)' : 'rgba(34,197,94,0.16)';

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
    },
    content: {
      paddingHorizontal: getSpacing(4),
      paddingBottom: getSpacing(8),
    },
    heroContainer: {
      paddingVertical: getSpacing(4),
    },
    heading: {
      fontSize: typography.fontSize['2xl'],
      fontFamily: typography.fontFamily.bold,
      color: theme.colors.text.primary,
    },
    subheading: {
      fontSize: typography.fontSize.base,
      fontFamily: typography.fontFamily.regular,
      color: theme.colors.text.secondary,
      marginTop: getSpacing(1),
      lineHeight: typography.fontSize.base * 1.5,
    },
    heroCard: {
      marginTop: getSpacing(3),
      padding: getSpacing(4),
      borderRadius: radius['2xl'],
      backgroundColor: heroBackground,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: heroBadge,
    },
    heroHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: getSpacing(2),
    },
    heroBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: getSpacing(1),
      paddingHorizontal: getSpacing(2),
      paddingVertical: getSpacing(1),
      borderRadius: radius.lg,
      backgroundColor: heroBadge,
    },
    heroBadgeDot: {
      width: getSpacing(2),
      height: getSpacing(2),
      borderRadius: radius.full,
      backgroundColor: theme.colors.primary,
    },
    heroBadgeLabel: {
      fontSize: typography.fontSize.xs,
      fontFamily: typography.fontFamily.medium,
      color: theme.colors.primary,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
    heroAction: {
      fontSize: typography.fontSize.xs,
      fontFamily: typography.fontFamily.medium,
      color: theme.colors.primary,
      textTransform: 'uppercase',
    },
    heroTitle: {
      fontSize: typography.fontSize['2xl'],
      fontFamily: typography.fontFamily.semibold,
      color: theme.colors.text.primary,
      marginBottom: getSpacing(1),
    },
    heroCaption: {
      fontSize: typography.fontSize.sm,
      fontFamily: typography.fontFamily.regular,
      color: theme.colors.text.secondary,
      lineHeight: typography.fontSize.sm * 1.6,
    },
    heroSplitRow: {
      flexDirection: 'row',
      gap: getSpacing(3),
      marginTop: getSpacing(3),
      flexWrap: 'wrap',
    },
    heroHighlightCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: getSpacing(1),
      paddingHorizontal: getSpacing(2),
      paddingVertical: getSpacing(1.5),
      borderRadius: radius.lg,
      backgroundColor: theme.colors.surface.primary,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: surfaceBorder,
    },
    heroHighlightText: {
      fontSize: typography.fontSize.xs,
      fontFamily: typography.fontFamily.medium,
      color: theme.colors.text.secondary,
    },
    kpiStrip: {
      gap: getSpacing(3),
      paddingBottom: getSpacing(3),
      paddingRight: getSpacing(4),
    },
    kpiCard: {
      width: 190,
      padding: getSpacing(3),
      borderRadius: radius.xl,
      backgroundColor: theme.colors.surface.primary,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: surfaceBorder,
      shadowColor: surfaceShadowStrong,
      shadowOpacity: isDark ? 0.35 : 0.16,
      shadowOffset: { width: 0, height: 12 },
      shadowRadius: 26,
      elevation: 5,
    },
    kpiIconWrap: {
      width: getSpacing(6),
      height: getSpacing(6),
      borderRadius: radius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? 'rgba(34,197,94,0.22)' : 'rgba(22,163,74,0.12)',
      marginBottom: getSpacing(2),
    },
    kpiLabel: {
      fontSize: typography.fontSize.sm,
      fontFamily: typography.fontFamily.semibold,
      color: theme.colors.text.secondary,
      marginBottom: getSpacing(1),
    },
    kpiValue: {
      fontSize: typography.fontSize.lg,
      fontFamily: typography.fontFamily.bold,
      color: theme.colors.text.primary,
    },
    kpiChange: {
      marginTop: getSpacing(1),
      fontSize: typography.fontSize.xs,
      fontFamily: typography.fontFamily.medium,
      color: theme.colors.primary,
    },
    sparkline: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 2,
      marginTop: getSpacing(2),
      height: 26,
    },
    sparklineBar: {
      width: 4,
      borderRadius: radius.full,
      backgroundColor: theme.colors.primary,
    },
    section: {
      marginTop: getSpacing(5),
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: getSpacing(2.5),
    },
    sectionTitle: {
      fontSize: typography.fontSize.lg,
      fontFamily: typography.fontFamily.semibold,
      color: theme.colors.text.primary,
    },
    sectionLink: {
      fontSize: typography.fontSize.sm,
      fontFamily: typography.fontFamily.medium,
      color: theme.colors.primary,
    },
    chartCard: {
      backgroundColor: theme.colors.surface.primary,
      borderRadius: radius.lg,
      padding: getSpacing(4),
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: surfaceBorder,
      shadowColor: surfaceShadowSoft,
      shadowOpacity: isDark ? 0.25 : 0.12,
      shadowOffset: { width: 0, height: 10 },
      shadowRadius: 20,
      elevation: 4,
      marginTop: getSpacing(2),
    },
    chartBars: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
    },
    chartBarSlot: {
      alignItems: 'center',
      flex: 1,
    },
    chartBar: {
      width: getSpacing(3.5),
      borderTopLeftRadius: radius.md,
      borderTopRightRadius: radius.md,
    },
    chartLabel: {
      marginTop: getSpacing(1.5),
      fontSize: typography.fontSize.xs,
      fontFamily: typography.fontFamily.medium,
      color: theme.colors.text.secondary,
    },
    chartFooter: {
      marginTop: getSpacing(4),
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    chartHighlight: {
      fontSize: typography.fontSize.base,
      fontFamily: typography.fontFamily.semibold,
      color: theme.colors.text.primary,
    },
    chartMuted: {
      fontSize: typography.fontSize.sm,
      fontFamily: typography.fontFamily.regular,
      color: theme.colors.text.secondary,
    },
    cardStack: {
      gap: getSpacing(2),
      marginTop: getSpacing(2),
    },
    jobCard: {
      backgroundColor: theme.colors.surface.primary,
      borderRadius: radius.lg,
      padding: getSpacing(3),
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: surfaceBorder,
      shadowColor: surfaceShadowStrong,
      shadowOpacity: isDark ? 0.3 : 0.14,
      shadowOffset: { width: 0, height: 12 },
      shadowRadius: 26,
      elevation: 5,
    },
    jobHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: getSpacing(1.5),
    },
    jobTitle: {
      fontSize: typography.fontSize.base,
      fontFamily: typography.fontFamily.semibold,
      color: theme.colors.text.primary,
      flex: 1,
      marginRight: getSpacing(2),
    },
    jobPill: {
      fontSize: typography.fontSize.xs,
      fontFamily: typography.fontFamily.medium,
      paddingHorizontal: getSpacing(2),
      paddingVertical: getSpacing(0.75),
      borderRadius: radius.full,
      color: theme.colors.primary,
      backgroundColor: isDark ? 'rgba(34,197,94,0.12)' : 'rgba(34,197,94,0.15)',
    },
    jobPillHigh: {
      color: '#ef4444',
      backgroundColor: isDark ? 'rgba(239,68,68,0.18)' : 'rgba(239,68,68,0.15)',
    },
    jobPillMedium: {
      color: '#f97316',
      backgroundColor: isDark ? 'rgba(249,115,22,0.18)' : 'rgba(249,115,22,0.18)',
    },
    jobNote: {
      fontSize: typography.fontSize.sm,
      fontFamily: typography.fontFamily.medium,
      color: theme.colors.text.secondary,
      lineHeight: typography.fontSize.sm * 1.5,
    },
    healthGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: getSpacing(2),
      marginTop: getSpacing(2),
    },
    healthCard: {
      flexBasis: '48%',
      backgroundColor: theme.colors.surface.primary,
      borderRadius: radius.lg,
      padding: getSpacing(3),
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: surfaceBorder,
    },
    healthHeader: {
      fontSize: typography.fontSize.sm,
      fontFamily: typography.fontFamily.medium,
      color: theme.colors.text.secondary,
    },
    healthValue: {
      fontSize: typography.fontSize['2xl'],
      fontFamily: typography.fontFamily.bold,
      color: theme.colors.text.primary,
      marginTop: getSpacing(1),
    },
    healthDescriptor: {
      marginTop: getSpacing(1),
      fontSize: typography.fontSize.sm,
      fontFamily: typography.fontFamily.regular,
      color: theme.colors.primary,
    },
    tipStack: {
      gap: getSpacing(2),
      marginTop: getSpacing(2),
    },
    tipCard: {
      backgroundColor: theme.colors.surface.primary,
      borderRadius: radius.lg,
      padding: getSpacing(3),
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: surfaceBorder,
      shadowColor: surfaceShadowSoft,
      shadowOpacity: isDark ? 0.22 : 0.12,
      shadowOffset: { width: 0, height: 10 },
      shadowRadius: 20,
      elevation: 4,
    },
    tipHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: getSpacing(2),
      marginBottom: getSpacing(1),
    },
    tipBullet: {
      width: getSpacing(2),
      height: getSpacing(2),
      borderRadius: radius.full,
      backgroundColor: theme.colors.primary,
    },
    tipTitle: {
      fontSize: typography.fontSize.base,
      fontFamily: typography.fontFamily.semibold,
      color: theme.colors.text.primary,
    },
    tipBody: {
      fontSize: typography.fontSize.sm,
      fontFamily: typography.fontFamily.medium,
      color: theme.colors.text.secondary,
      lineHeight: typography.fontSize.sm * 1.5,
    },
    climateGrid: {
      gap: getSpacing(2),
      marginTop: getSpacing(2),
    },
    climateCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: getSpacing(3),
      backgroundColor: theme.colors.surface.primary,
      borderRadius: radius.lg,
      padding: getSpacing(3),
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: surfaceBorder,
      shadowColor: surfaceShadowSoft,
      shadowOpacity: isDark ? 0.2 : 0.1,
      shadowOffset: { width: 0, height: 8 },
      shadowRadius: 18,
      elevation: 3,
    },
    climateInfo: {
      flex: 1,
    },
    climateLabel: {
      fontSize: typography.fontSize.sm,
      fontFamily: typography.fontFamily.medium,
      color: theme.colors.text.secondary,
    },
    climateValue: {
      fontSize: typography.fontSize.base,
      fontFamily: typography.fontFamily.bold,
      color: theme.colors.text.primary,
      marginTop: getSpacing(0.5),
    },
    climateDetail: {
      fontSize: typography.fontSize.xs,
      fontFamily: typography.fontFamily.regular,
      color: theme.colors.text.tertiary,
      marginTop: getSpacing(1),
      lineHeight: typography.fontSize.xs * 1.6,
    },
    factGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      rowGap: getSpacing(2),
      marginTop: getSpacing(2),
    },
    factCard: {
      width: '48%',
      backgroundColor: theme.colors.surface.primary,
      borderRadius: radius.lg,
      padding: getSpacing(3),
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: surfaceBorder,
    },
    factLabel: {
      fontSize: typography.fontSize.sm,
      fontFamily: typography.fontFamily.medium,
      color: theme.colors.text.secondary,
    },
    factValue: {
      fontSize: typography.fontSize.lg,
      fontFamily: typography.fontFamily.bold,
      color: theme.colors.text.primary,
      marginTop: getSpacing(1),
    },
    factCaption: {
      marginTop: getSpacing(1),
      fontSize: typography.fontSize.xs,
      fontFamily: typography.fontFamily.regular,
      color: theme.colors.text.tertiary,
    },
    sectionLast: {
      marginBottom: getSpacing(8),
    },

    // Productivity Score Styles
    productivityCard: {
      backgroundColor: theme.colors.surface.primary,
      borderRadius: radius.lg,
      padding: getSpacing(4),
      borderWidth: 1,
      borderColor: surfaceBorder,
      shadowColor: surfaceShadowSoft,
      shadowOpacity: isDark ? 0.25 : 0.12,
      shadowOffset: { width: 0, height: 10 },
      shadowRadius: 20,
      elevation: 4,
      marginTop: getSpacing(2),
    },
    productivityHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: getSpacing(4),
    },
    productivityScoreContainer: {
      flexDirection: 'row',
      alignItems: 'baseline',
    },
    productivityScore: {
      fontSize: 32,
      fontFamily: typography.fontFamily.bold,
      color: theme.colors.primary,
    },
    productivityScoreLabel: {
      fontSize: typography.fontSize.base,
      fontFamily: typography.fontFamily.medium,
      color: theme.colors.text.secondary,
      marginLeft: getSpacing(1),
    },
    productivityTrends: {
      alignItems: 'flex-end',
    },
    productivityTrendLabel: {
      fontSize: typography.fontSize.xs,
      fontFamily: typography.fontFamily.medium,
      color: theme.colors.text.secondary,
      marginBottom: getSpacing(0.5),
    },
    productivityTrendValue: {
      fontSize: typography.fontSize.sm,
      fontFamily: typography.fontFamily.semibold,
    },
    productivityBreakdown: {
      gap: getSpacing(3),
    },
    productivityMetric: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    productivityMetricLabel: {
      fontSize: typography.fontSize.sm,
      fontFamily: typography.fontFamily.medium,
      color: theme.colors.text.primary,
      flex: 1,
    },
    productivityBar: {
      height: 8,
      backgroundColor: theme.colors.surface.elevated,
      borderRadius: radius.sm,
      flex: 2,
      marginHorizontal: getSpacing(2),
      overflow: 'hidden',
    },
    productivityBarFill: {
      height: '100%',
      borderRadius: radius.sm,
    },
    productivityMetricValue: {
      fontSize: typography.fontSize.sm,
      fontFamily: typography.fontFamily.semibold,
      color: theme.colors.text.primary,
      minWidth: 40,
      textAlign: 'right',
    },
    achievementsContainer: {
      marginTop: getSpacing(4),
      paddingTop: getSpacing(3),
      borderTopWidth: 1,
      borderTopColor: surfaceBorder,
    },
    achievementsTitle: {
      fontSize: typography.fontSize.sm,
      fontFamily: typography.fontFamily.semibold,
      color: theme.colors.text.primary,
      marginBottom: getSpacing(2),
    },
    achievementsList: {
      flexDirection: 'row',
      gap: getSpacing(2),
    },
    achievementBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface.elevated,
      paddingVertical: getSpacing(1),
      paddingHorizontal: getSpacing(2),
      borderRadius: radius.md,
    },
    achievementEmoji: {
      fontSize: 16,
      marginRight: getSpacing(1),
    },
    achievementName: {
      fontSize: typography.fontSize.xs,
      fontFamily: typography.fontFamily.medium,
      color: theme.colors.text.primary,
    },

    // Enhanced Tip Styles
    tipCardHigh: {
      borderLeftWidth: 3,
      borderLeftColor: theme.colors.error,
    },
    tipCardMedium: {
      borderLeftWidth: 3,
      borderLeftColor: theme.colors.warning,
    },
    tipBulletHigh: {
      backgroundColor: theme.colors.error,
    },
    tipBulletMedium: {
      backgroundColor: theme.colors.warning,
    },
    tipPriorityBadge: {
      paddingHorizontal: getSpacing(1.5),
      paddingVertical: getSpacing(0.5),
      borderRadius: radius.sm,
      marginLeft: getSpacing(2),
    },
    tipPriorityHigh: {
      backgroundColor: theme.colors.error + '20',
    },
    tipPriorityMedium: {
      backgroundColor: theme.colors.warning + '20',
    },
    tipPriorityLow: {
      backgroundColor: theme.colors.surface.elevated,
    },
    tipPriorityText: {
      fontSize: typography.fontSize.xs,
      fontFamily: typography.fontFamily.medium,
      color: theme.colors.text.secondary,
    },
    tipPriorityTextHigh: {
      color: theme.colors.error,
    },
    tipActions: {
      marginTop: getSpacing(2),
      paddingTop: getSpacing(2),
      borderTopWidth: 1,
      borderTopColor: theme.colors.surface.elevated,
    },
    tipActionsTitle: {
      fontSize: typography.fontSize.xs,
      fontFamily: typography.fontFamily.semibold,
      color: theme.colors.text.primary,
      marginBottom: getSpacing(1),
    },
    tipActionItem: {
      fontSize: typography.fontSize.xs,
      fontFamily: typography.fontFamily.regular,
      color: theme.colors.text.secondary,
      marginBottom: getSpacing(0.5),
      lineHeight: 16,
    },
    tipFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: getSpacing(2),
      paddingTop: getSpacing(2),
      borderTopWidth: 1,
      borderTopColor: theme.colors.surface.elevated,
    },
    tipRelevance: {
      fontSize: typography.fontSize.xs,
      fontFamily: typography.fontFamily.medium,
      color: theme.colors.text.tertiary,
    },
    tipCategory: {
      fontSize: typography.fontSize.xs,
      fontFamily: typography.fontFamily.medium,
      color: theme.colors.text.secondary,
    },
  });
};
