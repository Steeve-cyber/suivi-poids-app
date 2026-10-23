import React, { useCallback, useState } from 'react';
import { Text, View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Activity, ArrowDownRight, ArrowUpRight, Plus, Scale, Trash2 } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ActionButton,
  AnimatedIn,
  AppScreen,
  BrandHeader,
  C,
  EmptyState,
  MetricTile,
  ProgressTrack,
  SectionTitle,
  Surface,
  Tag,
  TrendBars,
} from '../components/ui';
import { parseMetric, readJSON, shortDate, writeJSON } from '../lib/storage';

interface WeightEntry {
  id: string;
  weight: number;
  date: string;
  timestamp?: string;
}

export default function HomeScreen() {
  const router = useRouter();
  const [weight, setWeight] = useState('');
  const [targetWeight, setTargetWeight] = useState('70');
  const [height, setHeight] = useState(1.75);
  const [name, setName] = useState('');
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const [savedEntries, savedTarget, savedHeight, savedName] = await Promise.all([
          readJSON<WeightEntry[]>('@weight_entries', []),
          AsyncStorage.getItem('@weight_target'),
          AsyncStorage.getItem('@user_height'),
          AsyncStorage.getItem('@user_name'),
        ]);
        if (!active) return;
        setEntries(savedEntries);
        if (savedTarget) setTargetWeight(savedTarget);
        if (savedHeight && Number.isFinite(Number(savedHeight))) setHeight(Number(savedHeight));
        if (savedName) setName(savedName);
      })();
      return () => { active = false; };
    }, [])
  );

  const currentWeight = entries[0]?.weight;
  const previousWeight = entries[1]?.weight;
  const delta = currentWeight !== undefined && previousWeight !== undefined
    ? currentWeight - previousWeight
    : null;
  const bmi = currentWeight && height > 0 ? currentWeight / (height * height) : null;
  const parsedTarget = parseMetric(targetWeight);
  const remaining = currentWeight && parsedTarget ? Math.abs(currentWeight - parsedTarget) : null;
  const chartData = [...entries].reverse().slice(-7).map(item => ({
    label: shortDate(item.timestamp, item.date),
    value: item.weight,
  }));

  const saveTarget = (value: string) => {
    setTargetWeight(value);
    const parsed = parseMetric(value);
    if (parsed && parsed >= 20 && parsed <= 400) {
      AsyncStorage.setItem('@weight_target', value).catch(() => {});
    }
  };

  const addWeight = async () => {
    const parsed = parseMetric(weight);
    if (!parsed || parsed < 20 || parsed > 400) {
      setError('Saisis un poids valide, entre 20 et 400 kg.');
      return;
    }
    const now = new Date();
    const next: WeightEntry = {
      id: `${now.getTime()}`,
      weight: Math.round(parsed * 10) / 10,
      date: now.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
      timestamp: now.toISOString(),
    };
    const updated = [next, ...entries];
    setEntries(updated);
    setWeight('');
    setError('');
    await writeJSON('@weight_entries', updated);
  };

  const removeEntry = async () => {
    if (!deleteId) return;
    const updated = entries.filter(item => item.id !== deleteId);
    setEntries(updated);
    setDeleteId(null);
    await writeJSON('@weight_entries', updated);
  };

  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <AppScreen>
      <BrandHeader
        eyebrow="VOTRE ESPACE SANTÉ"
        title={name ? `Bonjour, ${name}` : 'Bonjour'}
        subtitle={today.charAt(0).toUpperCase() + today.slice(1)}
      />

      <AnimatedIn>
        <View style={styles.hero}>
          <View style={styles.heroOrb} />
          <View style={styles.heroOrbSmall} />
          <View style={styles.heroTop}>
            <View style={styles.heroLabelRow}>
              <Scale size={15} color={C.mint} />
              <Text style={styles.heroLabel}>POIDS ACTUEL</Text>
            </View>
            <Tag color={C.mint} background="#183C43">SUIVI PERSONNEL</Tag>
          </View>
          <View style={styles.weightRow}>
            <Text style={styles.weightValue}>{currentWeight ? currentWeight.toFixed(1) : '— —'}</Text>
            <Text style={styles.weightUnit}>kg</Text>
          </View>
          <View style={styles.heroFooter}>
            <Text style={styles.heroFootnote}>
              {currentWeight ? 'Dernière mesure enregistrée' : 'Ajoutez votre première mesure'}
            </Text>
            {remaining !== null ? (
              <View style={styles.goalChip}>
                <Text style={styles.goalChipText}>
                  {remaining < 0.05 ? 'Objectif atteint' : `${remaining.toFixed(1)} kg de l’objectif`}
                </Text>
              </View>
            ) : null}
          </View>
          <View style={styles.goalLine}>
            <Text style={styles.goalLabel}>Mon objectif</Text>
            <View style={styles.goalEdit}>
              <TextInput
                accessibilityLabel="Poids cible en kilogrammes"
                keyboardType="decimal-pad"
                value={targetWeight}
                onChangeText={saveTarget}
                style={styles.goalInput}
                maxLength={6}
              />
              <Text style={styles.goalUnit}>kg</Text>
            </View>
          </View>
        </View>
      </AnimatedIn>

      <View style={styles.metricsRow}>
        <MetricTile
          label="IMC"
          value={bmi ? bmi.toFixed(1) : '—'}
          caption={bmi ? 'Repère indicatif' : 'Ajoutez votre poids'}
          accent={C.blue}
        />
        <MetricTile
          label="Évolution"
          value={delta === null ? '—' : `${delta > 0 ? '+' : ''}${delta.toFixed(1)}`}
          unit={delta === null ? undefined : 'kg'}
          caption={delta === null ? 'Une mesure de plus' : 'depuis la mesure précédente'}
          accent={delta !== null && delta < 0 ? C.mint : C.amber}
        />
      </View>

      <Surface style={styles.entrySurface}>
        <SectionTitle title="Nouvelle pesée" detail="Un relevé simple, à votre rythme." />
        <View style={styles.inputRow}>
          <View style={styles.weightInputWrap}>
            <TextInput
              accessibilityLabel="Poids en kilogrammes"
              value={weight}
              onChangeText={value => { setWeight(value); setError(''); }}
              placeholder="Ex. 72,4"
              placeholderTextColor={C.subtle}
              keyboardType="decimal-pad"
              returnKeyType="done"
              onSubmitEditing={addWeight}
              style={styles.weightInput}
            />
            <Text style={styles.inputUnit}>kg</Text>
          </View>
          <ActionButton label="Ajouter" icon={<Plus size={17} color={C.background} />} onPress={addWeight} style={styles.addButton} />
        </View>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <Text style={styles.inputHelper}>Pesez-vous dans des conditions similaires pour suivre la tendance.</Text>
      </Surface>

      {chartData.length > 1 ? (
        <Surface>
          <SectionTitle title="Tendance du poids" detail="Vos 7 dernières mesures" />
          <TrendBars data={chartData} color={C.mint} />
        </Surface>
      ) : (
        <Surface>
          <EmptyState
            title="Votre évolution prendra forme ici"
            detail="Enregistrez quelques pesées pour visualiser votre tendance."
          />
        </Surface>
      )}

      <SectionTitle title="Vos autres repères" detail="Gardez tout votre suivi au même endroit." />
      <View style={styles.shortcuts}>
        <TouchableOpacity activeOpacity={0.8} onPress={() => router.push('/glycemia')} style={styles.shortcut}>
          <View style={[styles.shortcutIcon, { backgroundColor: C.coralDark }]}>
            <Activity size={18} color={C.coral} />
          </View>
          <Text style={styles.shortcutTitle}>Glycémie</Text>
          <Text style={styles.shortcutDetail}>Mesures & historique</Text>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.8} onPress={() => router.push('/habits')} style={styles.shortcut}>
          <View style={[styles.shortcutIcon, { backgroundColor: C.mintDark }]}>
            <Plus size={18} color={C.mint} />
          </View>
          <Text style={styles.shortcutTitle}>Bien-être</Text>
          <Text style={styles.shortcutDetail}>Eau & mouvement</Text>
        </TouchableOpacity>
      </View>

      <SectionTitle title="Historique" detail={`${entries.length} ${entries.length === 1 ? 'mesure' : 'mesures'} enregistrée${entries.length === 1 ? '' : 's'}`} />
      {entries.length === 0 ? (
        <Surface>
          <EmptyState title="Aucun relevé pour le moment" detail="Votre première pesée apparaîtra ici." />
        </Surface>
      ) : (
        entries.map((item, index) => (
          <AnimatedIn key={item.id} delay={Math.min(index * 35, 210)}>
            <View style={styles.historyRow}>
              <View style={styles.historyIcon}>
                {delta !== null && index === 0 && delta < 0
                  ? <ArrowDownRight size={17} color={C.mint} />
                  : <ArrowUpRight size={17} color={C.blue} />}
              </View>
              <View style={styles.historyCopy}>
                <Text style={styles.historyDate}>{shortDate(item.timestamp, item.date)}</Text>
                <Text style={styles.historyCaption}>{item.timestamp ? 'Mesure ajoutée' : 'Pesée enregistrée'}</Text>
              </View>
              <Text style={styles.historyValue}>{item.weight.toFixed(1)} <Text style={styles.historyUnit}>kg</Text></Text>
              <TouchableOpacity
                accessibilityLabel={`Supprimer la mesure du ${shortDate(item.timestamp, item.date)}`}
                onPress={() => setDeleteId(item.id)}
                style={styles.deleteButton}
              >
                <Trash2 size={16} color={C.subtle} />
              </TouchableOpacity>
            </View>
          </AnimatedIn>
        ))
      )}

      {deleteId ? (
        <Surface style={styles.confirmSurface}>
          <Text style={styles.confirmText}>Supprimer cette pesée de votre historique ?</Text>
          <View style={styles.confirmActions}>
            <ActionButton label="Annuler" variant="quiet" onPress={() => setDeleteId(null)} style={styles.confirmButton} />
            <ActionButton label="Supprimer" variant="danger" onPress={removeEntry} style={styles.confirmButton} />
          </View>
        </Surface>
      ) : null}

      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          L’IMC est un indicateur général. Il ne remplace pas un avis médical ni une évaluation personnalisée.
        </Text>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: 25,
    padding: 21,
    marginBottom: 14,
    backgroundColor: '#132849',
    borderColor: '#284365',
    borderWidth: 1,
    overflow: 'hidden',
  },
  heroOrb: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 110,
    backgroundColor: '#1D4560',
    opacity: 0.38,
    right: -80,
    top: -110,
  },
  heroOrbSmall: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 70,
    backgroundColor: '#1D5155',
    opacity: 0.35,
    right: 45,
    bottom: -85,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  heroLabel: { color: '#B9C8DC', fontSize: 10, fontWeight: '800', letterSpacing: 1.4 },
  weightRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 17 },
  weightValue: { color: C.text, fontSize: 54, lineHeight: 59, fontWeight: '800', letterSpacing: -1.5 },
  weightUnit: { color: C.muted, fontSize: 18, fontWeight: '700', marginLeft: 7 },
  heroFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  heroFootnote: { color: '#A5B6CE', fontSize: 11 },
  goalChip: { backgroundColor: '#203B59', paddingHorizontal: 9, paddingVertical: 6, borderRadius: 20 },
  goalChipText: { color: C.mint, fontSize: 10, fontWeight: '700' },
  goalLine: { marginTop: 20, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#2B4566', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  goalLabel: { color: '#A5B6CE', fontSize: 12, fontWeight: '600' },
  goalEdit: { flexDirection: 'row', alignItems: 'center' },
  goalInput: { minWidth: 45, color: C.text, fontSize: 14, fontWeight: '800', textAlign: 'right', paddingVertical: 3 },
  goalUnit: { color: C.muted, fontSize: 12, marginLeft: 4 },
  metricsRow: { flexDirection: 'row', gap: 11, marginBottom: 14 },
  entrySurface: { padding: 16 },
  inputRow: { flexDirection: 'row', gap: 9, alignItems: 'center' },
  weightInputWrap: { flex: 1, height: 49, flexDirection: 'row', alignItems: 'center', borderRadius: 15, borderWidth: 1, borderColor: C.border, backgroundColor: C.backgroundSoft, paddingHorizontal: 14 },
  weightInput: { flex: 1, color: C.text, fontSize: 16, paddingVertical: 0 },
  inputUnit: { color: C.muted, fontSize: 13, fontWeight: '700' },
  addButton: { minWidth: 118 },
  inputHelper: { color: C.subtle, fontSize: 10, lineHeight: 15, marginTop: 10 },
  errorText: { color: C.coral, fontSize: 11, marginTop: 8 },
  shortcuts: { flexDirection: 'row', gap: 11, marginBottom: 21 },
  shortcut: { flex: 1, minHeight: 117, borderRadius: 19, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, padding: 14 },
  shortcutIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 9 },
  shortcutTitle: { color: C.text, fontSize: 13, fontWeight: '800' },
  shortcutDetail: { color: C.muted, fontSize: 10, marginTop: 4 },
  historyRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 17, paddingHorizontal: 13, paddingVertical: 12, marginBottom: 8 },
  historyIcon: { height: 34, width: 34, borderRadius: 12, backgroundColor: C.surfaceRaised, alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  historyCopy: { flex: 1 },
  historyDate: { color: C.text, fontSize: 13, fontWeight: '700' },
  historyCaption: { color: C.subtle, fontSize: 10, marginTop: 3 },
  historyValue: { color: C.text, fontSize: 14, fontWeight: '800' },
  historyUnit: { color: C.muted, fontSize: 11, fontWeight: '600' },
  deleteButton: { padding: 9, marginLeft: 4 },
  confirmSurface: { borderColor: C.coralDark },
  confirmText: { color: C.text, fontSize: 13, fontWeight: '700', marginBottom: 12 },
  confirmActions: { flexDirection: 'row', gap: 9 },
  confirmButton: { flex: 1 },
  disclaimer: { paddingHorizontal: 4, paddingBottom: 5 },
  disclaimerText: { color: C.subtle, fontSize: 10, lineHeight: 15, textAlign: 'center' },
});
