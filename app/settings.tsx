import React, { useCallback, useState } from 'react';
import { Share, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Download, RotateCcw, Save, ShieldCheck, UserRound } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ActionButton,
  AppScreen,
  BrandHeader,
  C,
  SectionTitle,
  Surface,
  TextField,
} from '../components/ui';
import { parseMetric, readJSON } from '../lib/storage';

const DATA_KEYS = [
  '@weight_entries',
  '@weight_target',
  '@user_height',
  '@user_name',
  '@glycemia_entries',
  '@wellness_entries',
  '@water_goal',
  '@activity_goal',
];

export default function SettingsScreen() {
  const [heightCm, setHeightCm] = useState('175');
  const [targetWeight, setTargetWeight] = useState('70');
  const [waterGoal, setWaterGoal] = useState('2000');
  const [activityGoal, setActivityGoal] = useState('30');
  const [name, setName] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [resetPending, setResetPending] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const [height, target, water, activity, savedName] = await Promise.all([
          AsyncStorage.getItem('@user_height'),
          AsyncStorage.getItem('@weight_target'),
          AsyncStorage.getItem('@water_goal'),
          AsyncStorage.getItem('@activity_goal'),
          AsyncStorage.getItem('@user_name'),
        ]);
        if (!active) return;
        if (height && Number.isFinite(Number(height))) {
          const parsedHeight = Number(height);
          setHeightCm(String(Math.round(parsedHeight < 3 ? parsedHeight * 100 : parsedHeight)));
        }
        if (target) setTargetWeight(target);
        if (water) setWaterGoal(water);
        if (activity) setActivityGoal(activity);
        if (savedName) setName(savedName);
      })();
      return () => { active = false; };
    }, [])
  );

  const saveSettings = async () => {
    const height = parseMetric(heightCm);
    const target = parseMetric(targetWeight);
    const water = parseMetric(waterGoal);
    const activity = parseMetric(activityGoal);
    if (!height || height < 100 || height > 230) {
      setError('Saisissez une taille comprise entre 100 et 230 cm.');
      setNotice('');
      return;
    }
    if (!target || target < 20 || target > 400) {
      setError('Saisissez un objectif de poids valide, entre 20 et 400 kg.');
      setNotice('');
      return;
    }
    if (!water || water < 500 || water > 5000) {
      setError('Saisissez un repère d’hydratation entre 500 et 5 000 ml.');
      setNotice('');
      return;
    }
    if (!activity || activity < 1 || activity > 240) {
      setError('Saisissez un repère d’activité entre 1 et 240 minutes.');
      setNotice('');
      return;
    }
    try {
      await AsyncStorage.multiSet([
        ['@user_height', String(height / 100)],
        ['@weight_target', String(target)],
        ['@water_goal', String(Math.round(water))],
        ['@activity_goal', String(Math.round(activity))],
        ['@user_name', name.trim()],
      ]);
      setError('');
      setNotice('Votre profil et vos objectifs sont enregistrés.');
    } catch {
      setError('Les paramètres n’ont pas pu être enregistrés. Réessayez.');
      setNotice('');
    }
  };

  const exportData = async () => {
    try {
      const [weights, glycemia, wellness] = await Promise.all([
        readJSON<unknown[]>('@weight_entries', []),
        readJSON<unknown[]>('@glycemia_entries', []),
        readJSON<unknown[]>('@wellness_entries', []),
      ]);
      const backup = {
        application: 'NOVA Santé',
        exportDate: new Date().toISOString(),
        profile: {
          name: name.trim(),
          heightCm: Number(heightCm),
          targetWeightKg: Number(targetWeight),
          waterGoalMl: Number(waterGoal),
          activityGoalMinutes: Number(activityGoal),
        },
        data: { weights, glycemia, wellness },
      };
      await Share.share({
        title: 'Exporter mes données NOVA Santé',
        message: JSON.stringify(backup, null, 2),
      });
      setNotice('Le partage de votre export a été ouvert.');
      setError('');
    } catch {
      setError('Le partage de vos données n’a pas pu être ouvert sur cet appareil.');
      setNotice('');
    }
  };

  const resetData = async () => {
    try {
      await AsyncStorage.multiRemove(DATA_KEYS);
      setName('');
      setHeightCm('175');
      setTargetWeight('70');
      setWaterGoal('2000');
      setActivityGoal('30');
      setResetPending(false);
      setNotice('Les données enregistrées sur cet appareil ont été supprimées.');
      setError('');
    } catch {
      setError('La réinitialisation a échoué. Réessayez.');
      setNotice('');
    }
  };

  return (
    <AppScreen>
      <BrandHeader
        eyebrow="VOTRE ESPACE"
        title="Profil & réglages"
        subtitle="Personnalisez vos repères et gardez la maîtrise de vos données."
      />

      <Surface>
        <SectionTitle title="Profil personnel" detail="Utilisé pour personnaliser votre tableau de bord." />
        <View style={styles.profileBadge}>
          <View style={styles.avatar}>
            <UserRound size={19} color={C.mint} />
          </View>
          <View>
            <Text style={styles.profileName}>{name.trim() || 'Votre profil'}</Text>
            <Text style={styles.profileSub}>Paramètres personnels</Text>
          </View>
        </View>
        <TextField
          label="Nom ou prénom"
          placeholder="Ex. Alex"
          autoCapitalize="words"
          value={name}
          onChangeText={setName}
        />
        <TextField
          label="Taille"
          placeholder="175"
          keyboardType="decimal-pad"
          value={heightCm}
          onChangeText={setHeightCm}
          hint="Indiquez votre taille en centimètres. Elle sert au calcul de l’IMC."
        />
      </Surface>

      <Surface>
        <SectionTitle title="Mes objectifs" detail="Ils peuvent être adaptés à tout moment." />
        <TextField
          label="Poids cible · kg"
          placeholder="70"
          keyboardType="decimal-pad"
          value={targetWeight}
          onChangeText={setTargetWeight}
        />
        <TextField
          label="Hydratation quotidienne · ml"
          placeholder="2000"
          keyboardType="number-pad"
          value={waterGoal}
          onChangeText={setWaterGoal}
        />
        <TextField
          label="Activité quotidienne · minutes"
          placeholder="30"
          keyboardType="number-pad"
          value={activityGoal}
          onChangeText={setActivityGoal}
        />
        <ActionButton label="Enregistrer mes réglages" icon={<Save size={16} color={C.background} />} onPress={saveSettings} />
      </Surface>

      <Surface style={styles.privacyCard}>
        <View style={styles.privacyIcon}><ShieldCheck size={19} color={C.mint} /></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.privacyTitle}>Vos données restent sur votre appareil</Text>
          <Text style={styles.privacyCopy}>
            Les mesures sont stockées localement. NOVA Santé ne les transmet à aucun compte ou service distant.
          </Text>
        </View>
      </Surface>

      <SectionTitle title="Vos données" detail="Exportez une copie ou effacez l’historique local." />
      <View style={styles.dataActions}>
        <ActionButton
          label="Partager un export JSON"
          icon={<Download size={16} color={C.text} />}
          variant="secondary"
          onPress={exportData}
          style={styles.action}
        />
      </View>

      {resetPending ? (
        <Surface style={styles.confirmSurface}>
          <Text style={styles.confirmTitle}>Effacer toutes les données locales ?</Text>
          <Text style={styles.confirmCopy}>Cette action supprime le profil, les mesures et les objectifs enregistrés sur cet appareil.</Text>
          <View style={styles.confirmActions}>
            <ActionButton label="Annuler" variant="quiet" onPress={() => setResetPending(false)} style={styles.action} />
            <ActionButton label="Tout effacer" variant="danger" onPress={resetData} style={styles.action} />
          </View>
        </Surface>
      ) : (
        <ActionButton
          label="Réinitialiser mes données"
          icon={<RotateCcw size={15} color={C.coral} />}
          variant="danger"
          onPress={() => { setResetPending(true); setNotice(''); }}
        />
      )}

      {error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
      {notice ? <Text accessibilityLiveRegion="polite" style={styles.notice}>{notice}</Text> : null}
      <Text style={styles.version}>NOVA SANTÉ · VERSION 1.1</Text>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  profileBadge: { flexDirection: 'row', alignItems: 'center', marginBottom: 19, padding: 12, backgroundColor: C.backgroundSoft, borderRadius: 15 },
  avatar: { width: 39, height: 39, borderRadius: 14, backgroundColor: C.mintDark, alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  profileName: { color: C.text, fontSize: 13, fontWeight: '800' },
  profileSub: { color: C.muted, fontSize: 10, marginTop: 3 },
  privacyCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: '#102A32', borderColor: '#285052' },
  privacyIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: C.mintDark, alignItems: 'center', justifyContent: 'center' },
  privacyTitle: { color: C.text, fontSize: 12, fontWeight: '800' },
  privacyCopy: { color: C.muted, fontSize: 10, lineHeight: 16, marginTop: 5 },
  dataActions: { marginBottom: 10 },
  action: { flex: 1 },
  confirmSurface: { borderColor: C.coralDark },
  confirmTitle: { color: C.text, fontSize: 14, fontWeight: '800' },
  confirmCopy: { color: C.muted, fontSize: 11, lineHeight: 16, marginTop: 6, marginBottom: 14 },
  confirmActions: { flexDirection: 'row', gap: 9 },
  error: { color: C.coral, fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 11 },
  notice: { color: C.mint, fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 11 },
  version: { color: C.subtle, fontSize: 9, letterSpacing: 1.4, textAlign: 'center', marginTop: 23, paddingBottom: 8 },
});
