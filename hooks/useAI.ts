import { useEffect, useMemo, useState } from 'react';
import { recommendationEngine } from '../services/RecommendationEngine';
import {
  useWeatherStore,
  useCurrentWeather,
  useWeatherForecast,
  usePlantCareImpacts,
  usePlantCareSuitability,
  useWeatherError,
  useWeatherLoading,
  useSeasonValue,
  useSeasonThai,
} from '../stores/weatherStore';
import { useRef } from 'react';
import { Plant, PlantStatus } from '../types/garden';
import { AITip } from '../types/ai';

export function useWeatherAI() {
  const currentWeather = useCurrentWeather();
  const forecast = useWeatherForecast();
  const impacts = usePlantCareImpacts();
  const suitability = usePlantCareSuitability();
  const error = useWeatherError();
  const isLoading = useWeatherLoading();
  const season = useSeasonValue();
  const seasonThai = useSeasonThai();
  const initializeWeatherData = useWeatherStore((s) => s.initializeWeatherData);
  const refreshWeatherData = useWeatherStore((s) => s.refreshWeatherData);
  const didInitRef = useRef(false);

  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;
    initializeWeatherData().catch(() => {});
  }, [initializeWeatherData]);

  return {
    currentWeather,
    forecast,
    impacts,
    suitability,
    error,
    isLoading,
    season,
    seasonThai,
    refresh: refreshWeatherData,
  };
}

// Transform PlantRecommendations to lightweight UI tips
function mapRecommendationsToTips(recs: any[], language: 'th' | 'en'): AITip[] {
  const now = new Date();
  return (recs || []).slice(0, 5).map((rec: any) => ({
    id: rec.id,
    title: language === 'th' && rec.titleThai ? rec.titleThai : rec.title,
    description: language === 'th' && rec.descriptionThai ? rec.descriptionThai : rec.description,
    category: rec.category ?? 'general',
    priority: rec.priority ?? 3,
    icon: undefined,
    plantTypes: undefined,
    conditions: undefined,
    source: 'ai',
    confidence: rec.confidence ?? 0.8,
    createdAt: rec.createdAt ? new Date(rec.createdAt) : now,
    updatedAt: now,
    isActive: true,
    seasonality: undefined,
    difficulty: rec.difficulty ?? 'beginner',
    actionUrl: undefined,
  }));
}

export function useAITips(plantName?: string, language: 'th' | 'en' = 'th') {
  const { currentWeather, forecast, season } = useWeatherAI();
  const [tips, setTips] = useState<AITip[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const placeholderPlant: Plant = useMemo(() => ({
    id: '00000000-0000-0000-0000-000000000000',
    name: plantName || 'My Plant',
    status: 'Healthy' as PlantStatus,
    createdAt: new Date(),
    updatedAt: new Date(),
  }), [plantName]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        setLoading(true);
        setError(null);

        const recs = await recommendationEngine.generateRecommendations({
          plant: placeholderPlant,
          currentWeather: currentWeather || undefined,
          forecast: forecast || undefined as any,
          season: (season || 'hot') as any,
          location: currentWeather?.location || undefined as any,
        } as any);

        if (!cancelled) {
          setTips(mapRecommendationsToTips(recs, language));
        }
      } catch (e: any) {
        if (cancelled) return;
        // Fallback simple weather-aware tips
        const fallback: AITip[] = [];
        if (currentWeather) {
          if (currentWeather.temperature > 34) {
            fallback.push({
              id: 'tip-heat',
              title: language === 'th' ? 'อากาศร้อน: เพิ่มการรดน้ำ' : 'Hot weather: Increase watering',
              description: language === 'th' ? 'ย้ายไปที่ร่มช่วงแดดจัด และพ่นน้ำเพิ่มความชื้น' : 'Provide shade at noon and mist leaves to raise humidity',
              category: 'temperature',
              priority: 5,
              source: 'ai',
              confidence: 0.7,
              createdAt: new Date(),
              updatedAt: new Date(),
              isActive: true,
            });
          }
          if ((currentWeather.uvIndex ?? 0) > 8) {
            fallback.push({
              id: 'tip-uv',
              title: language === 'th' ? 'UV สูง: ให้ร่มเงา' : 'High UV: Provide shade',
              description: language === 'th' ? 'หลบแดดช่วง 10:00-16:00 เพื่อลดความเสี่ยงใบไหม้' : 'Avoid direct sun 10am–4pm to prevent leaf scorch',
              category: 'lighting',
              priority: 4,
              source: 'ai',
              confidence: 0.7,
              createdAt: new Date(),
              updatedAt: new Date(),
              isActive: true,
            });
          }
        }
        setTips(fallback);
        setError(e?.message || 'Failed to generate AI tips');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [placeholderPlant, currentWeather, forecast, season, language]);

  return { tips, loading, error };
}
