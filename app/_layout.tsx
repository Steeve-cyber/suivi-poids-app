import React from 'react';
import { Tabs } from 'expo-router';
import { Activity, Droplets, Scale, UserRound } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';


// Définition directe des couleurs
const C = {
  background: '#0B132B',
  mint: '#48E5C2',
  subtle: '#5C6B73',
};

export default function Layout() {
  return (
    <>
      <StatusBar style="light" backgroundColor={C.background} />
      <Tabs
        screenOptions={{
          headerShown: false,
          
          tabBarActiveTintColor: C.mint,
          tabBarInactiveTintColor: C.subtle,
          tabBarLabelStyle: { fontSize: 10, fontWeight: '700', marginTop: 1 },
          tabBarStyle: {
            height: 70,
            paddingTop: 8,
            paddingBottom: 8,
            backgroundColor: C.background,
            borderTopWidth: 1,
            borderTopColor: C.subtle,
            elevation: 0,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Poids',
            tabBarIcon: ({ color, size }) => <Scale color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="glycemia"
          options={{
            title: 'Glycémie',
            tabBarIcon: ({ color, size }) => <Droplets color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="habits"
          options={{
            title: 'Bien-être',
            tabBarIcon: ({ color, size }) => <Activity color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Profil',
            tabBarIcon: ({ color, size }) => <UserRound color={color} size={size} />,
          }}
        />
      </Tabs>
    </>
  );
}
