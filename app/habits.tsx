import React, { useCallback, useMemo, useState } from 'react';
import { Text, TextInput, TouchableOpacity, View, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Activity, Check, Droplet, Minus, Plus } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ActionButton,
  AnimatedIn,
  AppScreen,
  BrandHeader,
  C,
  EmptyState,
  ProgressTrack,
  SectionTitle,
  Surface,
  TrendBars,
} from '../components/ui';
import { localDayKey, readJSON, shortDate, writeJSON } from '../lib/storage';

interface WellnessDay {
  id: string;
  date: string;
  waterMl: number;
  activeMinutes: number;
}

export default function HabitsScreen() {
  const [days, setDays] = useState<WellnessDay[]>([]);
  const [waterGoal, setWaterGoal] = useState(2000);
  const [activityGoal, setActivityGoal] = useState(30);
  const [minutesInput, setMinutesInput] = useState('10');
  const [notice, setNotice] = useState('');

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const [savedDays, savedWaterGoal, savedActivityGoal] = await Promise.all([
          readJSON<WellnessDay[]>('@wellness_entries', []),
          AsyncStorage.getItem('@water_goal'),
          AsyncStorage.getItem('@activity_goal'),
        ]);
        if (!active) return;
        setDays(savedDays);
        if (savedWaterGoal && Number.isFinite(Number(savedWaterGoal))) setWaterGoal(Number(savedWaterGoal));
        if (savedActivityGoal && Number.isFinite(Number(savedActivityGoal))) setActivityGoal(Number(savedActivityGoal));
      })();
      return () => { active = false; };
    }, [])
  );

  const today = localDayKey();
  const todayEntry = days.find(item => item.date === today);
  const waterMl = todayEntry?.waterMl || 0;
  const activeMinutes = todayEntry?.activeMinutes || 0;
  const lastSevenDays = useMemo(() => {
    const indexed = new Map(days.map(day => [day.date, day]));
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      const key = localDayKey(date);
      const entry = indexed.get(key);
      return {
        label: date.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', ''),
        value: entry?.waterMl || 0,
      };
    });
  }, [days]);

  const updateToday = async (change: Partial<Pick<WellnessDay, 'waterMl' | 'activeMinutes'>>) => {
    const current = days.find(item => item.date === today) || {
      id: today,
      date: today,
      waterMl: 0,
      activeMinutes: 0,
    };
    const updatedDay = {
      ...current,
      waterMl: Math.max(0, current.waterMl + (change.waterMl || 0)),
      activeMinutes: Math.max(0, current.activeMinutes + (change.activeMinutes || 0)),
    };
    const updated = [updatedDay, ...days.filter(item => item.date !== today)]
      .sort((a, b) => b.date.localeCompare(a.date));
    setDays(updated);
    setNotice('Progression enregistrée sur cet appareil.');
    await writeJSON('@wellness_entries', updated);
  };

  const changeWaterGoal = async (goal: number) => {
    setWaterGoal(goal);
    await AsyncStorage.setItem('@water_goal', String(goal));
  };

  const addMinutes = async (amount?: number) => {
    const parsed = amount ?? Number(minutesInput);
    if (!Number.isFinite(parsed) || parsed < 1 || parsed > 240) {
      setNotice('Choisissez une durée comprise entre 1 et 240 minutes.');
      return;
    }
    await updateToday({ activeMinutes: Math.round(parsed) });
    setMinutesInput('10');
  };

  const waterProgress = Math.min(100, (waterMl / waterGoal) * 100);
  const movementProgress = Math.min(100, (activeMinutes / activityGoal) * 100);

  return (
    <AppScreen>
      <BrandHeader
        eyebrow="VOTRE ROUTINE"
        title="Bien-être"
        subtitle="De petits gestes réguliers, réunis dans un seul espace."
      />

      <AnimatedIn>
        <Surface style={styles.waterCard}>
          <View style={styles.waterHeader}>
            <View style={styles.iconBox}><Droplet size={19} color={C.blue} /></View>
            <View style={styles.cardHeading}>
              <Text style={styles.cardTitle}>Hydratation</Text>
              <Text style={styles.cardDescription}>Votre repère pour aujourd’hui</Text>
            </View>
            {waterMl >= waterGoal ? <View style={styles.completeMark}><Check size={15} color={C.mint} /></View> : null}
          </View>
          <View style={styles.waterNumberRow}>
            <Text style={styles.waterNumber}>{waterMl.toLocaleString('fr-FR')}</Text>
            <Text style={styles.waterUnit}>ml</Text>
            <Text style={styles.waterGoal}>/ {waterGoal.toLocaleString('fr-FR')} ml</Text>
          </View>
          <ProgressTrack progress={waterProgress} color={C.blue} />
          <Text style={styles.progressCaption}>
            {waterMl >= waterGoal
              ? 'Objectif quotidien atteint'
              : `${Math.max(0, waterGoal - waterMl).toLocaleString('fr-FR')} ml pour atteindre votre objectif`}
          </Text>
          <View style={styles.waterActions}>
            {[150, 250, 500].map(amount => (
              <TouchableOpacity key={amount} activeOpacity={0.75} onPress={() => updateToday({ waterMl: amount })} style={styles.waterButton}>
                <Plus size={13} color={C.blue} />
                <Text style={styles.waterButtonText}>{amount} ml</Text>
              </TouchableOpacity>
            ))}
            {waterMl > 0 ? (
              <TouchableOpacity activeOpacity={0.75} onPress={() => updateToday({ waterMl: -250 })} style={styles.undoButton}>
                <Minus size={14} color={C.muted} />
              </TouchableOpacity>
            ) : null}
          </View>
          <View style={styles.goalPicker}>
            <Text style={styles.goalPickerLabel}>Objectif quotidien</Text>
            <View style={styles.goalOptions}>
              {[1500, 2000, 2500].map(goal => (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityState={{ selected: waterGoal === goal }}
                  key={goal}
                  onPress={() => changeWaterGoal(goal)}
                  style={[styles.goalOption, waterGoal === goal && styles.goalOptionActive]}
                >
                  <Text style={[styles.goalOptionText, waterGoal === goal && styles.goalOptionTextActive]}>{goal / 1000} L</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Surface>
      </AnimatedIn>

      <AnimatedIn delay={80}>
        <Surface style={styles.movementCard}>
          <View style={styles.waterHeader}>
            <View style={[styles.iconBox, { backgroundColor: C.mintDark }]}><Activity size={19} color={C.mint} /></View>
            <View style={styles.cardHeading}>
              <Text style={styles.cardTitle}>Mouvement</Text>
              <Text style={styles.cardDescription}>Minutes actives aujourd’hui</Text>
            </View>
            {activeMinutes >= activityGoal ? <View style={styles.completeMark}><Check size={15} color={C.mint} /></View> : null}
          </View>
          <View style={styles.waterNumberRow}>
            <Text style={styles.waterNumber}>{activeMinutes}</Text>
            <Text style={styles.waterUnit}>min</Text>
            <Text style={styles.waterGoal}>/ {activityGoal} min</Text>
          </View>
          <ProgressTrack progress={movementProgress} color={C.mint} />
          <Text style={styles.progressCaption}>
            {activeMinutes >= activityGoal
              ? 'Bravo, votre objectif est atteint'
              : `${Math.max(0, activityGoal - activeMinutes)} min pour atteindre votre objectif`}
          </Text>
          <View style={styles.movementActions}>
            <View style={styles.minuteInputWrap}>
              <TextInput
                accessibilityLabel="Durée de mouvement en minutes"
                value={minutesInput}
                onChangeText={setMinutesInput}
                keyboardType="number-pad"
                maxLength={3}
                style={styles.minuteInput}
              />
              <Text style={styles.minuteLabel}>min</Text>
            </View>
            <ActionButton label="Ajouter" icon={<Plus size={15} color={C.background} />} onPress={() => addMinutes()} style={styles.addMinutesButton} />
            <TouchableOpacity onPress={() => updateToday({ activeMinutes: -activeMinutes })} disabled={activeMinutes === 0} style={[styles.undoButton, activeMinutes === 0 && { opacity: 0.35 }]}>
              <Minus size={15} color={C.muted} />
            </TouchableOpacity>
          </View>
          <View style={styles.goalPicker}>
            <Text style={styles.goalPickerLabel}>Repère quotidien</Text>
            <View style={styles.goalOptions}>
              {[20, 30, 45].map(goal => (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityState={{ selected: activityGoal === goal }}
                  key={goal}
                  onPress={async () => {
                    setActivityGoal(goal);
                    await AsyncStorage.setItem('@activity_goal', String(goal));
                  }}
                  style={[styles.goalOption, activityGoal === goal && styles.goalOptionActiveMint]}
                >
                  <Text style={[styles.goalOptionText, activityGoal === goal && styles.goalOptionTextActive]}>{goal} min</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Surface>
      </AnimatedIn>

      <Surface>
        <SectionTitle title="Hydratation sur 7 jours" detail="Les journées sans relevé restent vides." />
        <TrendBars data={lastSevenDays} color={C.blue} />
      </Surface>

      <SectionTitle title="Mes derniers jours" detail="Un aperçu de vos habitudes enregistrées." />
      {days.length > 0 ? days.slice(0, 7).map((day, index) => (
        <View key={day.id} style={styles.dayRow}>
          <View style={styles.dayDateDot} />
          <Text style={styles.dayDate}>{day.date === today ? 'Aujourd’hui' : shortDate(day.date)}</Text>
          <View style={styles.dayStat}>
            <Droplet size={13} color={C.blue} />
            <Text style={styles.dayStatText}>{day.waterMl.toLocaleString('fr-FR')} ml</Text>
          </View>
          <View style={styles.dayStat}>
            <Activity size={13} color={C.mint} />
            <Text style={styles.dayStatText}>{day.activeMinutes} min</Text>
          </View>
        </View>
      )) : (
        <Surface><EmptyState title="Pas encore d’habitudes enregistrées" detail="Ajoutez un verre d’eau ou une activité pour créer votre premier relevé." /></Surface>
      )}

      {notice ? <Text accessibilityLiveRegion="polite" style={styles.notice}>{notice}</Text> : null}
      <Text style={styles.disclaimer}>
        Les objectifs sont personnalisables. Les besoins varient selon les personnes, les conditions de santé et l’activité.
      </Text>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  waterCard: { backgroundColor: '#102442', borderColor: '#2B466A', padding: 18 },
  movementCard: { padding: 18 },
  waterHeader: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 39, height: 39, borderRadius: 14, backgroundColor: C.blueDark, justifyContent: 'center', alignItems: 'center', marginRight: 11 },
  cardHeading: { flex: 1 },
  cardTitle: { color: C.text, fontSize: 15, fontWeight: '800' },
  cardDescription: { color: C.muted, fontSize: 10, marginTop: 3 },
  completeMark: { width: 28, height: 28, borderRadius: 10, backgroundColor: C.mintDark, alignItems: 'center', justifyContent: 'center' },
  waterNumberRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 18, marginBottom: 11 },
  waterNumber: { color: C.text, fontSize: 35, lineHeight: 40, fontWeight: '800', letterSpacing: -0.7 },
  waterUnit: { color: C.muted, fontSize: 13, fontWeight: '700', marginLeft: 5 },
  waterGoal: { color: C.subtle, fontSize: 12, marginLeft: 7 },
  progressCaption: { color: C.muted, fontSize: 10, marginTop: 8 },
  waterActions: { flexDirection: 'row', gap: 8, marginTop: 16 },
  waterButton: { minHeight: 37, borderRadius: 13, paddingHorizontal: 10, backgroundColor: C.blueDark, flexDirection: 'row', alignItems: 'center', gap: 4 },
  waterButtonText: { color: '#BCD8FF', fontSize: 10, fontWeight: '800' },
  undoButton: { minWidth: 38, minHeight: 38, borderRadius: 13, backgroundColor: C.surfaceRaised, alignItems: 'center', justifyContent: 'center' },
  goalPicker: { marginTop: 18, paddingTop: 14, borderTopWidth: 1, borderTopColor: C.border },
  goalPickerLabel: { color: C.subtle, fontSize: 10, fontWeight: '700', marginBottom: 9 },
  goalOptions: { flexDirection: 'row', gap: 7 },
  goalOption: { borderRadius: 10, paddingVertical: 7, paddingHorizontal: 11, backgroundColor: C.backgroundSoft, borderWidth: 1, borderColor: C.border },
  goalOptionActive: { backgroundColor: C.blueDark, borderColor: '#345982' },
  goalOptionActiveMint: { backgroundColor: C.mintDark, borderColor: '#34766C' },
  goalOptionText: { color: C.muted, fontSize: 10, fontWeight: '700' },
  goalOptionTextActive: { color: C.text },
  movementActions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 15 },
  minuteInputWrap: { width: 85, height: 46, borderRadius: 14, backgroundColor: C.backgroundSoft, borderWidth: 1, borderColor: C.border, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 11 },
  minuteInput: { flex: 1, color: C.text, fontSize: 15, textAlign: 'center', paddingVertical: 0 },
  minuteLabel: { color: C.muted, fontSize: 10, fontWeight: '700' },
  addMinutesButton: { flex: 1 },
  dayRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderColor: C.border, borderWidth: 1, borderRadius: 15, paddingVertical: 12, paddingHorizontal: 12, marginBottom: 7 },
  dayDateDot: { width: 7, height: 7, borderRadius: 5, backgroundColor: C.mint, marginRight: 9 },
  dayDate: { flex: 1, color: C.text, fontSize: 11, fontWeight: '700' },
  dayStat: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 8 },
  dayStatText: { color: C.muted, fontSize: 9, fontWeight: '700' },
  notice: { color: C.mint, textAlign: 'center', fontSize: 10, marginTop: 4, marginBottom: 8 },
  disclaimer: { color: C.subtle, fontSize: 10, lineHeight: 15, textAlign: 'center', paddingHorizontal: 5, paddingBottom: 8 },
});
