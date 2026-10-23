import React, { useCallback, useState } from 'react';
import { Text, View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Check, Droplets, Plus, Trash2 } from 'lucide-react-native';
import {
  ActionButton,
  AnimatedIn,
  AppScreen,
  BrandHeader,
  C,
  EmptyState,
  SectionTitle,
  Surface,
  Tag,
  TrendBars,
} from '../components/ui';
import { parseMetric, readJSON, shortDate, shortTime, writeJSON } from '../lib/storage';

interface GlycemiaEntry {
  id: string;
  value: number;
  moment: string;
  date: string;
  time: string;
  timestamp?: string;
}

const moments = ['À jeun', 'Avant repas', 'Après repas', 'Au coucher'];

function statusFor(value: number, moment: string) {
  if (value < 70) return { label: 'Sous 70', color: C.blue, background: C.blueDark };
  if (moment === 'À jeun') {
    if (value <= 99) return { label: 'Dans le repère', color: C.mint, background: C.mintDark };
    if (value <= 125) return { label: 'Au-dessus du repère', color: C.amber, background: C.amberDark };
    return { label: 'Valeur élevée', color: C.coral, background: C.coralDark };
  }
  if (value <= 140) return { label: 'Dans le repère', color: C.mint, background: C.mintDark };
  if (value <= 199) return { label: 'Au-dessus du repère', color: C.amber, background: C.amberDark };
  return { label: 'Valeur élevée', color: C.coral, background: C.coralDark };
}

export default function GlycemiaScreen() {
  const [value, setValue] = useState('');
  const [moment, setMoment] = useState(moments[0]);
  const [entries, setEntries] = useState<GlycemiaEntry[]>([]);
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      readJSON<GlycemiaEntry[]>('@glycemia_entries', []).then(saved => {
        if (active) setEntries(saved);
      });
      return () => { active = false; };
    }, [])
  );

  const lastEntry = entries[0];
  const lastStatus = lastEntry ? statusFor(lastEntry.value, lastEntry.moment) : null;
  const chartData = [...entries].reverse().slice(-7).map(item => {
    const status = statusFor(item.value, item.moment);
    return {
      label: shortDate(item.timestamp, item.date),
      value: item.value,
      color: status.color,
    };
  });

  const addEntry = async () => {
    const parsed = parseMetric(value);
    if (!parsed || parsed <= 0 || parsed > 1000) {
      setError('Saisissez une valeur valide en mg/dL.');
      return;
    }
    const now = new Date();
    const next: GlycemiaEntry = {
      id: `${now.getTime()}`,
      value: Math.round(parsed * 10) / 10,
      moment,
      date: now.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
      time: now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      timestamp: now.toISOString(),
    };
    const updated = [next, ...entries];
    setEntries(updated);
    setValue('');
    setError('');
    await writeJSON('@glycemia_entries', updated);
  };

  const removeEntry = async () => {
    if (!deleteId) return;
    const updated = entries.filter(item => item.id !== deleteId);
    setEntries(updated);
    setDeleteId(null);
    await writeJSON('@glycemia_entries', updated);
  };

  return (
    <AppScreen>
      <BrandHeader
        eyebrow="SUIVI DES MESURES"
        title="Glycémie"
        subtitle="Un historique clair pour mieux échanger avec votre professionnel de santé."
      />

      {lastEntry && lastStatus ? (
        <AnimatedIn>
          <View style={styles.latestCard}>
            <View style={styles.latestGlow} />
            <View style={styles.latestHeader}>
              <View style={styles.latestIcon}><Droplets size={18} color={C.coral} /></View>
              <Text style={styles.latestLabel}>DERNIÈRE MESURE</Text>
              <Tag color={lastStatus.color} background={lastStatus.background}>{lastStatus.label}</Tag>
            </View>
            <View style={styles.latestValueRow}>
              <Text style={styles.latestValue}>{lastEntry.value.toFixed(lastEntry.value % 1 ? 1 : 0)}</Text>
              <Text style={styles.latestUnit}>mg/dL</Text>
            </View>
            <Text style={styles.latestDetail}>
              {lastEntry.moment} · {shortDate(lastEntry.timestamp, lastEntry.date)}
              {lastEntry.timestamp ? ` à ${shortTime(lastEntry.timestamp)}` : lastEntry.time ? ` à ${lastEntry.time}` : ''}
            </Text>
          </View>
        </AnimatedIn>
      ) : null}

      <Surface>
        <SectionTitle title="Enregistrer une mesure" detail="Choisissez le contexte avant la valeur." />
        <Text style={styles.fieldLabel}>Moment de la mesure</Text>
        <View style={styles.moments}>
          {moments.map(item => {
            const selected = moment === item;
            return (
              <TouchableOpacity
                key={item}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setMoment(item)}
                style={[styles.momentChip, selected && styles.momentChipActive]}
              >
                <Text style={[styles.momentText, selected && styles.momentTextActive]}>{item}</Text>
                {selected ? <Check size={13} color={C.background} /> : null}
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={styles.fieldLabel}>Votre valeur · mg/dL</Text>
        <View style={styles.inputRow}>
          <View style={styles.valueWrap}>
            <TextInput
              accessibilityLabel="Valeur de glycémie en milligrammes par décilitre"
              value={value}
              onChangeText={text => { setValue(text); setError(''); }}
              placeholder="Ex. 95"
              placeholderTextColor={C.subtle}
              keyboardType="decimal-pad"
              returnKeyType="done"
              onSubmitEditing={addEntry}
              style={styles.valueInput}
            />
            <Text style={styles.valueUnit}>mg/dL</Text>
          </View>
          <ActionButton label="Enregistrer" icon={<Plus size={16} color={C.background} />} onPress={addEntry} style={styles.addButton} />
        </View>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </Surface>

      {chartData.length > 1 ? (
        <Surface>
          <SectionTitle title="Tendance récente" detail="Vos 7 dernières mesures, selon le contexte indiqué." />
          <TrendBars data={chartData} color={C.coral} />
        </Surface>
      ) : (
        <Surface>
          <EmptyState
            title="Votre suivi commence ici"
            detail="Ajoutez une mesure pour conserver une trace et observer votre historique."
          />
        </Surface>
      )}

      <SectionTitle title="Historique" detail={`${entries.length} ${entries.length === 1 ? 'mesure' : 'mesures'}`} />
      {entries.map((item, index) => {
        const status = statusFor(item.value, item.moment);
        return (
          <AnimatedIn key={item.id} delay={Math.min(index * 35, 210)}>
            <View style={styles.historyRow}>
              <View style={styles.historyIcon}><Droplets size={16} color={status.color} /></View>
              <View style={styles.historyCopy}>
                <Text style={styles.historyMoment}>{item.moment}</Text>
                <Text style={styles.historyDate}>
                  {shortDate(item.timestamp, item.date)}
                  {item.timestamp ? ` · ${shortTime(item.timestamp)}` : item.time ? ` · ${item.time}` : ''}
                </Text>
              </View>
              <View style={styles.historyMetric}>
                <Text style={styles.historyValue}>{item.value.toFixed(item.value % 1 ? 1 : 0)} <Text style={styles.historyUnit}>mg/dL</Text></Text>
                <Text style={[styles.historyStatus, { color: status.color }]}>{status.label}</Text>
              </View>
              <TouchableOpacity
                accessibilityLabel={`Supprimer la mesure du ${shortDate(item.timestamp, item.date)}`}
                onPress={() => setDeleteId(item.id)}
                style={styles.deleteButton}
              >
                <Trash2 size={16} color={C.subtle} />
              </TouchableOpacity>
            </View>
          </AnimatedIn>
        );
      })}
      {entries.length === 0 ? (
        <Surface><EmptyState title="Aucune mesure enregistrée" detail="Vos relevés apparaîtront ici, du plus récent au plus ancien." /></Surface>
      ) : null}

      {deleteId ? (
        <Surface style={styles.confirmSurface}>
          <Text style={styles.confirmText}>Supprimer cette mesure de l’historique ?</Text>
          <View style={styles.confirmActions}>
            <ActionButton label="Annuler" variant="quiet" onPress={() => setDeleteId(null)} style={styles.confirmButton} />
            <ActionButton label="Supprimer" variant="danger" onPress={removeEntry} style={styles.confirmButton} />
          </View>
        </Surface>
      ) : null}

      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerTitle}>À garder en tête</Text>
        <Text style={styles.disclaimerText}>
          Les repères affichés sont indicatifs et dépendent du contexte, de l’appareil et de votre situation médicale.
          Ils ne permettent pas de poser un diagnostic. Pour interpréter vos résultats, échangez avec un professionnel de santé.
        </Text>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  latestCard: { backgroundColor: '#261E36', borderColor: '#53384B', borderWidth: 1, borderRadius: 24, padding: 20, marginBottom: 14, overflow: 'hidden' },
  latestGlow: { position: 'absolute', width: 190, height: 190, borderRadius: 100, backgroundColor: '#573448', opacity: 0.35, right: -75, top: -115 },
  latestHeader: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  latestIcon: { width: 34, height: 34, borderRadius: 12, backgroundColor: '#4A2C42', alignItems: 'center', justifyContent: 'center' },
  latestLabel: { color: '#C8B7CA', fontSize: 10, letterSpacing: 1.3, fontWeight: '800', flex: 1 },
  latestValueRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 18 },
  latestValue: { color: C.text, fontSize: 47, lineHeight: 54, fontWeight: '800', letterSpacing: -1 },
  latestUnit: { color: C.muted, fontSize: 14, fontWeight: '700', marginLeft: 7 },
  latestDetail: { color: '#C1B5C7', fontSize: 11, marginTop: 4 },
  fieldLabel: { color: C.muted, fontSize: 11, fontWeight: '700', marginBottom: 8 },
  moments: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 17 },
  momentChip: { minHeight: 36, borderRadius: 99, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.backgroundSoft, borderWidth: 1, borderColor: C.border },
  momentChipActive: { backgroundColor: C.mint, borderColor: C.mint },
  momentText: { color: C.muted, fontSize: 11, fontWeight: '700' },
  momentTextActive: { color: C.background },
  inputRow: { flexDirection: 'row', gap: 9 },
  valueWrap: { flex: 1, height: 49, flexDirection: 'row', alignItems: 'center', borderRadius: 15, borderWidth: 1, borderColor: C.border, backgroundColor: C.backgroundSoft, paddingHorizontal: 13 },
  valueInput: { flex: 1, color: C.text, fontSize: 16, paddingVertical: 0 },
  valueUnit: { color: C.muted, fontSize: 10, fontWeight: '700' },
  addButton: { minWidth: 130 },
  errorText: { color: C.coral, fontSize: 11, marginTop: 8 },
  historyRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 17, paddingHorizontal: 12, paddingVertical: 11, marginBottom: 8 },
  historyIcon: { height: 33, width: 33, borderRadius: 12, backgroundColor: C.surfaceRaised, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  historyCopy: { flex: 1 },
  historyMoment: { color: C.text, fontSize: 12, fontWeight: '700' },
  historyDate: { color: C.subtle, fontSize: 10, marginTop: 3 },
  historyMetric: { alignItems: 'flex-end' },
  historyValue: { color: C.text, fontSize: 12, fontWeight: '800' },
  historyUnit: { color: C.muted, fontSize: 9, fontWeight: '600' },
  historyStatus: { fontSize: 9, fontWeight: '700', marginTop: 3 },
  deleteButton: { padding: 9, marginLeft: 2 },
  confirmSurface: { borderColor: C.coralDark },
  confirmText: { color: C.text, fontSize: 13, fontWeight: '700', marginBottom: 12 },
  confirmActions: { flexDirection: 'row', gap: 9 },
  confirmButton: { flex: 1 },
  disclaimer: { paddingHorizontal: 4, paddingTop: 5, paddingBottom: 7 },
  disclaimerTitle: { color: C.muted, fontSize: 11, fontWeight: '800', marginBottom: 4 },
  disclaimerText: { color: C.subtle, fontSize: 10, lineHeight: 15 },
});
