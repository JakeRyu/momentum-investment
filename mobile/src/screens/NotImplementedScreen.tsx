import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Strategy } from '../strategies';

export type NotImplementedScreenProps = {
  strategy: Strategy;
  onBack: () => void;
};

export default function NotImplementedScreen({ strategy, onBack }: NotImplementedScreenProps) {
  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={12}>
          <Text style={styles.back}>← Back</Text>
        </Pressable>
      </View>

      <View style={styles.body}>
        <Text style={styles.short}>{strategy.shortName}</Text>
        <Text style={styles.full}>{strategy.fullName}</Text>
        <View style={styles.divider} />
        <Text style={styles.message}>
          The {strategy.shortName} strategy isn't implemented yet.
        </Text>
        <Text style={styles.subMessage}>{strategy.blurb}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0b0d10',
    paddingTop: 64,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  back: {
    color: '#7ed4a3',
    fontSize: 16,
    fontWeight: '600',
  },
  body: {
    flex: 1,
    alignItems: 'flex-start',
    paddingTop: 32,
  },
  short: {
    color: '#f4f6f8',
    fontSize: 48,
    fontWeight: '700',
    letterSpacing: 1,
  },
  full: {
    color: '#8a93a0',
    fontSize: 16,
    marginTop: 4,
  },
  divider: {
    width: 40,
    height: 2,
    backgroundColor: '#2a2f37',
    marginVertical: 24,
  },
  message: {
    color: '#cfd5dc',
    fontSize: 16,
    lineHeight: 22,
  },
  subMessage: {
    color: '#8a93a0',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 16,
  },
});
